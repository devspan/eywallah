import { NextResponse } from 'next/server';
import { getUserById, getUserByTelegramId, createUser, updateUser, addBusiness, addUpgrade, resetUserProgress, calculateOfflineEarnings } from '@/lib/db';
import { BUSINESSES, UPGRADES, PRESTIGE_COST, calculateIncome, calculateBusinessCost, calculateClickPower, calculatePrestigePoints, estimateTimeToExhaustSupply } from '@/lib/gameLogic';
import { logger } from '@/lib/logger';

export const dynamic = 'auto';

export async function GET(request: Request) {
  logger.debug('Fetching game data');
  return NextResponse.json({ BUSINESSES, UPGRADES });
}

export async function POST(request: Request) {
  const { action, data } = await request.json();

  try {
    switch (action) {
      case 'init':
        logger.debug('Initializing user data', { telegramId: data.telegramId });
        let user = await getUserByTelegramId(data.telegramId);
        let offlineEarnings = 0;
        if (!user) {
          user = await createUser(data.telegramId, data.username);
        } else {
          const result = await calculateOfflineEarnings(user.id);
          user = result.user;
          offlineEarnings = result.offlineEarnings;
          logger.debug('Offline earnings calculated', { userId: user.id, offlineEarnings });
        }
        const initialIncome = calculateIncome(user);
        return NextResponse.json({ ...user, income: initialIncome, offlineEarnings });

      case 'sync':
        logger.debug('Syncing user data', { userId: data.userId, data });
        const updatedUser = await updateUser(data.userId, {
          cryptoCoins: data.cryptoCoins,
        });
        const syncedIncome = calculateIncome(updatedUser);
        return NextResponse.json({ ...updatedUser, income: syncedIncome });

      case 'click':
        logger.debug('Processing click action', { userId: data.userId });
        const clickedUser = await getUserById(data.userId);
        if (!clickedUser) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const clickPower = calculateClickPower(clickedUser);
        const userAfterClick = await updateUser(data.userId, {
          cryptoCoins: clickedUser.cryptoCoins + clickPower,
        });
        const clickIncome = calculateIncome(userAfterClick);
        return NextResponse.json({ ...userAfterClick, income: clickIncome });

      case 'buyBusiness':
        logger.debug('Buying business', { userId: data.userId, businessType: data.businessType });
        const { businessType } = data;
        const userBeforePurchase = await getUserById(data.userId);
        if (!userBeforePurchase) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const cost = calculateBusinessCost(businessType, userBeforePurchase.businesses.find(b => b.type === businessType)?.count || 0);
        if (userBeforePurchase.cryptoCoins < cost) {
          return NextResponse.json({ error: 'Not enough coins' }, { status: 400 });
        }
        const userAfterAddBusiness = await addBusiness(data.userId, businessType);
        const userAfterPurchase = await updateUser(data.userId, {
          cryptoCoins: userAfterAddBusiness.cryptoCoins - cost,
        });
        const purchaseIncome = calculateIncome(userAfterPurchase);
        return NextResponse.json({ ...userAfterPurchase, income: purchaseIncome });

      case 'buyUpgrade':
        logger.debug('Buying upgrade', { userId: data.userId, upgradeId: data.upgradeId });
        const { upgradeId } = data;
        const userBeforeUpgrade = await getUserById(data.userId);
        if (!userBeforeUpgrade) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const upgradeCost = UPGRADES[upgradeId].cost;
        if (userBeforeUpgrade.cryptoCoins < upgradeCost) {
          return NextResponse.json({ error: 'Not enough coins' }, { status: 400 });
        }
        if (userBeforeUpgrade.upgrades.some(u => u.type === upgradeId)) {
          return NextResponse.json({ error: 'Upgrade already purchased' }, { status: 400 });
        }
        const userAfterAddUpgrade = await addUpgrade(data.userId, upgradeId);
        const userAfterUpgrade = await updateUser(data.userId, {
          cryptoCoins: userAfterAddUpgrade.cryptoCoins - upgradeCost,
        });
        const upgradeIncome = calculateIncome(userAfterUpgrade);
        return NextResponse.json({ ...userAfterUpgrade, income: upgradeIncome });

      case 'prestige':
        logger.debug('Performing prestige', { userId: data.userId });
        const userBeforePrestige = await getUserById(data.userId);
        if (!userBeforePrestige) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        if (userBeforePrestige.cryptoCoins < PRESTIGE_COST) {
          return NextResponse.json({ error: 'Not enough coins to prestige' }, { status: 400 });
        }
        const prestigePoints = calculatePrestigePoints(userBeforePrestige.cryptoCoins);
        const userAfterPrestige = await resetUserProgress(data.userId, prestigePoints);
        const prestigeIncome = calculateIncome(userAfterPrestige);
        return NextResponse.json({ ...userAfterPrestige, income: prestigeIncome });

      default:
        logger.error('Invalid action requested', { action });
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error in POST handler', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}