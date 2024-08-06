import { NextResponse } from 'next/server';
import { 
  getUserByTelegramId, 
  createUser, 
  updateUser, 
  addBusiness, 
  addUpgrade,
  syncUserData,
  getGlobalState,
  updateGlobalState,
  calculateOfflineEarnings
} from '@/lib/db';
import { 
  calculateIncome, 
  calculateClickPower, 
  calculateBusinessCost, 
  UPGRADES, 
  BUSINESSES,
  GlobalStats,
  updateGlobalState as updateGameGlobalState
} from '@/lib/gameLogic';
import { BusinessType, UpgradeType, User } from '@/types';
import { logger } from '@/lib/logger';
import { throttle } from 'lodash';

const throttledUpdateGlobalState = throttle(updateGlobalState, 5000);

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'init':
        return await handleInit(data);
      case 'sync':
        return await handleSync(data);
      case 'buyBusiness':
        return await handleBuyBusiness(data);
      case 'buyUpgrade':
        return await handleBuyUpgrade(data);
      case 'mineBlock':
        return await handleMineBlock(data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error in game API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleInit({ telegramId, username }: { telegramId: string, username?: string }) {
  let user = await getUserByTelegramId(telegramId);
  if (!user) {
    user = await createUser(telegramId, username || null);
    logger.debug('New user created', { userId: user.id, telegramId });
  } else {
    const { user: updatedUser, offlineEarnings } = await calculateOfflineEarnings(user.id);
    user = updatedUser;
    logger.debug('Existing user found, offline earnings calculated', { userId: user.id, offlineEarnings });
  }
  const globalStats = await getGlobalState();
  const income = calculateIncome(user, globalStats);
  const clickPower = calculateClickPower(user, globalStats);
  logger.debug('User initialization complete', { userId: user.id, income, clickPower, coins: user.cryptoCoins });
  return NextResponse.json({ ...user, income, clickPower, globalStats });
}

async function handleSync({ userId, cryptoCoins, fractionalCoins }: { userId: string, cryptoCoins: number, fractionalCoins: number }) {
  try {
    logger.debug('Handling sync', { userId, cryptoCoins, fractionalCoins });
    const user = await syncUserData(userId, cryptoCoins, fractionalCoins);
    const globalStats = await getGlobalState();
    const income = calculateIncome(user, globalStats);
    const clickPower = calculateClickPower(user, globalStats);
    logger.debug('Sync complete', { userId, updatedCoins: user.cryptoCoins, updatedFractionalCoins: user.fractionalCoins, income, clickPower });
    return NextResponse.json({ ...user, income, clickPower, globalStats });
  } catch (error) {
    logger.error('Error handling sync', { userId, error });
    return NextResponse.json({ error: 'Failed to sync user data' }, { status: 500 });
  }
}

async function handleBuyBusiness({ userId, businessType }: { userId: string, businessType: BusinessType }) {
  const user = await getUserByTelegramId(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const existingBusiness = user.businesses.find(b => b.type === businessType);
  const currentCount = existingBusiness?.count || 0;
  const cost = calculateBusinessCost(businessType, currentCount);

  if (user.cryptoCoins < cost) {
    return NextResponse.json({ error: 'Not enough coins' }, { status: 400 });
  }

  const updatedUser = await addBusiness(userId, businessType);
  updatedUser.cryptoCoins -= cost;
  await updateUser(userId, { cryptoCoins: updatedUser.cryptoCoins });

  const globalStats = await getGlobalState();
  const income = calculateIncome(updatedUser, globalStats);
  const clickPower = calculateClickPower(updatedUser, globalStats);
  return NextResponse.json({ ...updatedUser, income, clickPower, globalStats });
}

async function handleBuyUpgrade({ userId, upgradeType }: { userId: string, upgradeType: UpgradeType }) {
  const user = await getUserByTelegramId(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const upgradeCost = UPGRADES[upgradeType].cost;
  if (user.cryptoCoins < upgradeCost) {
    return NextResponse.json({ error: 'Not enough coins' }, { status: 400 });
  }

  if (user.upgrades.some(u => u.type === upgradeType)) {
    return NextResponse.json({ error: 'Upgrade already purchased' }, { status: 400 });
  }

  const updatedUser = await addUpgrade(userId, upgradeType);
  updatedUser.cryptoCoins -= upgradeCost;
  await updateUser(userId, { cryptoCoins: updatedUser.cryptoCoins });

  const globalStats = await getGlobalState();
  const income = calculateIncome(updatedUser, globalStats);
  const clickPower = calculateClickPower(updatedUser, globalStats);
  return NextResponse.json({ ...updatedUser, income, clickPower, globalStats });
}

async function handleMineBlock({ userId }: { userId: string }) {
  const user = await getUserByTelegramId(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let globalStats = await getGlobalState();
  const clickPower = calculateClickPower(user, globalStats);

  // Update user's crypto coins and fractional coins
  let updatedFractionalCoins = user.fractionalCoins + clickPower;
  let updatedCoins = user.cryptoCoins + Math.floor(updatedFractionalCoins);
  updatedFractionalCoins = updatedFractionalCoins % 1;

  const updatedUser = await updateUser(userId, {
    cryptoCoins: updatedCoins,
    fractionalCoins: updatedFractionalCoins
  });

  globalStats = updateGameGlobalState(globalStats);
  await throttledUpdateGlobalState(globalStats);

  const income = calculateIncome(updatedUser, globalStats);

  return NextResponse.json({ 
    ...updatedUser, 
    income, 
    clickPower, 
    globalStats
  });
}