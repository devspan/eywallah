import { NextResponse } from 'next/server';
import { 
  getUserById, createUser, updateUser, addBusiness, 
  addUpgrade, resetUserProgress, calculateOfflineEarnings
} from '@/lib/db';
import { 
  BUSINESSES, UPGRADES, PRESTIGE_COST, 
  calculateIncome, calculateBusinessCost, 
  calculateClickPower, calculatePrestigePoints 
} from '@/lib/gameLogic';
import { BusinessType, UpgradeType } from '@/types';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const { action, userId, data } = await request.json();

  try {
    switch (action) {
      case 'init': {
        logger.debug('Initializing user data', { userId });
        let user = await getUserById(userId);
        let offlineEarnings = 0;
        if (!user) {
          user = await createUser(userId);
        } else {
          const result = await calculateOfflineEarnings(userId);
          user = result.user;
          offlineEarnings = result.offlineEarnings;
          logger.debug('Offline earnings calculated', { userId, offlineEarnings });
        }
        const income = calculateIncome(user);
        return NextResponse.json({ ...user, income, offlineEarnings });
      }

      case 'sync': {
        logger.debug('Syncing user data', { userId, data });
        const updatedUser = await updateUser(userId, {
          cryptoCoins: data.cryptoCoins,
        });
        const income = calculateIncome(updatedUser);
        return NextResponse.json({ ...updatedUser, income });
      }

      case 'click': {
        logger.debug('Processing click action', { userId });
        const clickedUser = await getUserById(userId);
        if (!clickedUser) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const clickPower = calculateClickPower(clickedUser);
        const userAfterClick = await updateUser(userId, {
          cryptoCoins: clickedUser.cryptoCoins + clickPower,
        });
        const income = calculateIncome(userAfterClick);
        return NextResponse.json({ ...userAfterClick, income });
      }

      case 'buyBusiness': {
        logger.debug('Buying business', { userId, businessType: data.businessType });
        const { businessType } = data as { businessType: BusinessType };
        const userBeforePurchase = await getUserById(userId);
        if (!userBeforePurchase) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const cost = calculateBusinessCost(businessType, userBeforePurchase.businesses.find(b => b.type === businessType)?.count || 0);
        if (userBeforePurchase.cryptoCoins < cost) {
          return NextResponse.json({ error: 'Not enough coins' }, { status: 400 });
        }
        const userAfterAddBusiness = await addBusiness(userId, businessType);
        const userAfterPurchase = await updateUser(userId, {
          cryptoCoins: userAfterAddBusiness.cryptoCoins - cost,
        });
        const income = calculateIncome(userAfterPurchase);
        return NextResponse.json({ ...userAfterPurchase, income });
      }

      case 'buyUpgrade': {
        logger.debug('Buying upgrade', { userId, upgradeId: data.upgradeId });
        const { upgradeId } = data as { upgradeId: UpgradeType };
        const userBeforeUpgrade = await getUserById(userId);
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
        const userAfterAddUpgrade = await addUpgrade(userId, upgradeId);
        const userAfterUpgrade = await updateUser(userId, {
          cryptoCoins: userAfterAddUpgrade.cryptoCoins - upgradeCost,
        });
        const income = calculateIncome(userAfterUpgrade);
        return NextResponse.json({ ...userAfterUpgrade, income });
      }

      case 'prestige': {
        logger.debug('Performing prestige', { userId });
        const userBeforePrestige = await getUserById(userId);
        if (!userBeforePrestige) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        if (userBeforePrestige.cryptoCoins < PRESTIGE_COST) {
          return NextResponse.json({ error: 'Not enough coins to prestige' }, { status: 400 });
        }
        const prestigePoints = calculatePrestigePoints(userBeforePrestige.cryptoCoins);
        const userAfterPrestige = await resetUserProgress(userId, prestigePoints);
        const income = calculateIncome(userAfterPrestige);
        return NextResponse.json({ ...userAfterPrestige, income });
      }

      default: {
        logger.error('Invalid action requested', { action });
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    }
  } catch (error) {
    logger.error('Error in POST handler', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ BUSINESSES, UPGRADES });
}