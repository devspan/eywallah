import { NextResponse } from 'next/server';
import { 
  getUserByTelegramId, 
  createUser, 
  updateUser, 
  addBusiness, 
  addUpgrade,
  syncUserData
} from '@/lib/db';
import { 
  calculateIncome, 
  calculateClickPower, 
  calculateBusinessCost, 
  UPGRADES, 
  BUSINESSES
} from '@/lib/gameLogic';
import { BusinessType, UpgradeType, User } from '@/types';
import { logger } from '@/lib/logger';

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
  }
  const income = calculateIncome(user);
  const clickPower = calculateClickPower(user);
  return NextResponse.json({ ...user, income, clickPower });
}

async function handleSync({ userId, cryptoCoins }: { userId: string, cryptoCoins: number }) {
  const user = await syncUserData(userId, cryptoCoins);
  return NextResponse.json(user);
}

async function handleBuyBusiness({ userId, businessType }: { userId: string, businessType: string }) {
  const user = await getUserByTelegramId(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const typedBusinessType = businessType as BusinessType;
  if (!(typedBusinessType in BUSINESSES)) {
    return NextResponse.json({ error: 'Invalid business type' }, { status: 400 });
  }

  const existingBusiness = user.businesses.find(b => b.type === typedBusinessType);
  const currentCount = existingBusiness?.count || 0;
  const cost = calculateBusinessCost(typedBusinessType, currentCount);

  if (user.cryptoCoins < cost) {
    return NextResponse.json({ error: 'Not enough coins' }, { status: 400 });
  }

  const updatedUser = await addBusiness(userId, typedBusinessType);
  updatedUser.cryptoCoins -= cost;
  await updateUser(userId, { cryptoCoins: updatedUser.cryptoCoins });

  const income = calculateIncome(updatedUser);
  const clickPower = calculateClickPower(updatedUser);
  return NextResponse.json({ ...updatedUser, income, clickPower });
}

async function handleBuyUpgrade({ userId, upgradeType }: { userId: string, upgradeType: string }) {
  const user = await getUserByTelegramId(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const typedUpgradeType = upgradeType as UpgradeType;
  if (!(typedUpgradeType in UPGRADES)) {
    return NextResponse.json({ error: 'Invalid upgrade type' }, { status: 400 });
  }

  const upgradeCost = UPGRADES[typedUpgradeType].cost;
  if (user.cryptoCoins < upgradeCost) {
    return NextResponse.json({ error: 'Not enough coins' }, { status: 400 });
  }

  if (user.upgrades.some(u => u.type === typedUpgradeType)) {
    return NextResponse.json({ error: 'Upgrade already purchased' }, { status: 400 });
  }

  const updatedUser = await addUpgrade(userId, typedUpgradeType);
  updatedUser.cryptoCoins -= upgradeCost;
  await updateUser(userId, { cryptoCoins: updatedUser.cryptoCoins });

  const income = calculateIncome(updatedUser);
  const clickPower = calculateClickPower(updatedUser);
  return NextResponse.json({ ...updatedUser, income, clickPower });
}