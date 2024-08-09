// src/app/api/game/route.ts

import { NextResponse } from 'next/server';
import { 
  calculateIncome, 
  calculateClickPower, 
  calculateBusinessCost, 
  calculateUpgradeCost,
  mineBlock,
  updateUserBalance,
  addBusiness as addBusinessLogic,
  addUpgrade as addUpgradeLogic,
  BUSINESSES,
  UPGRADES,
  generateTasks
} from '@/lib/gameLogic';
import { BusinessType, UpgradeType, User, Task } from '@/types';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';
import { 
  createUser, 
  getUserByTelegramId, 
  updateUser, 
  getUserById, 
  addBusiness,
  createTask,
  completeTask,
  generateReferralLink,
  processReferral,
  awardReferralBonus,
  getReferralStats
} from '@/lib/db';

const prisma = new PrismaClient();

// Set up an interval for periodic updates (every minute)
setInterval(updateAllUsers, 60000);

async function updateAllUsers() {
  try {
    const users = await prisma.user.findMany();
    for (const user of users) {
      const updatedUser = await updateUserBalance(user as User, new Date());
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          cryptoCoins: updatedUser.cryptoCoins,
          lastIncomeUpdate: new Date()
        }
      });
    }
    logger.info('All users updated successfully');
  } catch (error) {
    logger.error('Error updating users:', error);
  }
}

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
      case 'generateTasks':
        return await handleGenerateTasks(data);
      case 'completeTask':
        return await handleCompleteTask(data);
      case 'generateReferralLink':
        return await handleGenerateReferralLink(data);
      case 'processReferral':
        return await handleProcessReferral(data);
      case 'getReferralStats':
        return await handleGetReferralStats(data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error in game API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// In the handleInit function
async function handleInit({ telegramId, username }: { telegramId: string, username?: string }) {
  try {
    let user = await getUserByTelegramId(telegramId);

    if (!user) {
      user = await createUser(telegramId, username || null);
    }

    const updatedUser = await updateUserBalance(user, new Date());
    const income = await calculateIncome(updatedUser);
    const clickPower = await calculateClickPower(updatedUser);

    await updateUser(user.id, {
      cryptoCoins: updatedUser.cryptoCoins,
      lastActive: new Date(),
      lastIncomeUpdate: new Date()
    });

    const formattedResponse = formatUserResponse(updatedUser, income, clickPower);
    return NextResponse.json(formattedResponse);
  } catch (error) {
    logger.error('Error in handleInit', error);
    return NextResponse.json({ error: 'Failed to initialize user' }, { status: 500 });
  }
}

async function handleSync({ userId }: { userId: string }) {
  try {
    logger.debug('Handling sync', { userId });
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = updateUserBalance(user, new Date());
    const income = calculateIncome(await updatedUser);
    const clickPower = calculateClickPower(await updatedUser);

    await updateUser(userId, {
      cryptoCoins: (await updatedUser).cryptoCoins,
      lastActive: new Date(),
      lastIncomeUpdate: new Date()
    });
    
    logger.debug('Sync complete', { 
      userId: (await updatedUser).id, 
      updatedCoins: (await updatedUser).cryptoCoins.toString(), 
      income: income.toString(), 
      clickPower: clickPower.toString() 
    });
    
    return NextResponse.json(formatUserResponse(await updatedUser, await income, await clickPower));
  } catch (error) {
    logger.error('Error handling sync', { userId: (error as any).userId, error });
    return NextResponse.json({ error: 'Failed to sync user data' }, { status: 500 });
  }
}

async function handleBuyBusiness({ userId, businessType }: { userId: string, businessType: BusinessType }) {
  try {
    logger.debug('Handling buy business request', { userId, businessType });

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await updateUserBalance(user, new Date());
    const existingBusiness = updatedUser.businesses.find(b => b.type === businessType);
    const currentCount = existingBusiness?.count || 0;
    const cost = calculateBusinessCost(businessType, currentCount);

    if (updatedUser.cryptoCoins < cost) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
    }

    updatedUser.cryptoCoins -= cost;
    
    logger.debug('Adding business', { userId, businessType, currentCount, cost: cost.toString() });
    const userWithNewBusiness = await addBusiness(userId, businessType);
    logger.debug('Business added', { userId, businessType, newBusinesses: JSON.stringify(userWithNewBusiness.businesses) });

    const income = calculateIncome(userWithNewBusiness);
    const clickPower = calculateClickPower(userWithNewBusiness);

    const finalUser = await updateUser(userId, {
      cryptoCoins: userWithNewBusiness.cryptoCoins,
      lastActive: new Date(),
      lastIncomeUpdate: new Date()
    });

    const newBusinessCount = finalUser.businesses.find(b => b.type === businessType)?.count || 0;

    logger.debug('Business purchase successful', { 
      userId, 
      businessType, 
      newCoins: finalUser.cryptoCoins.toString(),
      newBusinessCount,
      newIncome: income.toString(),
      newClickPower: clickPower.toString()
    });

    return NextResponse.json(formatUserResponse(finalUser, await income, await clickPower));
  } catch (error) {
    logger.error('Error in handleBuyBusiness', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

async function handleBuyUpgrade({ userId, upgradeType }: { userId: string, upgradeType: UpgradeType }) {
  try {
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await updateUserBalance(user, new Date());
    const upgradeCost = calculateUpgradeCost(upgradeType, updatedUser.upgrades);
    if (updatedUser.cryptoCoins < upgradeCost) {
      return NextResponse.json({ error: 'Not enough coins' }, { status: 400 });
    }

    updatedUser.cryptoCoins -= upgradeCost;
    const userWithNewUpgrade = addUpgradeLogic(updatedUser, upgradeType);

    const income = await calculateIncome(userWithNewUpgrade);
    const clickPower = await calculateClickPower(userWithNewUpgrade);

    const finalUser = await updateUser(userId, {
      cryptoCoins: userWithNewUpgrade.cryptoCoins,
      lastActive: new Date(),
      lastIncomeUpdate: new Date()
    });

    return NextResponse.json(formatUserResponse(finalUser, income, clickPower));
  } catch (error) {
    logger.error('Error in handleBuyUpgrade', error);
    return NextResponse.json({ error: 'Failed to purchase upgrade' }, { status: 500 });
  }
}

async function handleMineBlock({ userId }: { userId: string }) {
  try {
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await updateUserBalance(user, new Date());
    const clickPower = await calculateClickPower(updatedUser);
    const { updatedUser: userAfterMining } = mineBlock(updatedUser, clickPower);

    const finalUser = await updateUser(userId, {
      cryptoCoins: userAfterMining.cryptoCoins,
      lastActive: new Date(),
      lastIncomeUpdate: new Date()
    });

    const income = await calculateIncome(finalUser);

    return NextResponse.json(formatUserResponse(finalUser, income, clickPower));
  } catch (error) {
    logger.error('Error in handleMineBlock', error);
    return NextResponse.json({ error: 'Failed to mine block' }, { status: 500 });
  }
}

async function handleGenerateTasks({ userId }: { userId: string }) {
  try {
    const tasks = await generateTasks(userId);
    for (const task of tasks) {
      await createTask(userId, task);
    }
    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    logger.error('Error generating tasks', error);
    return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 });
  }
}

async function handleCompleteTask({ userId, taskId }: { userId: string, taskId: string }) {
  try {
    const updatedUser = await completeTask(userId, taskId);
    const income = await calculateIncome(updatedUser);
    const clickPower = await calculateClickPower(updatedUser);
    return NextResponse.json(formatUserResponse(updatedUser, income, clickPower));
  } catch (error) {
    logger.error('Error completing task', error);
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }
}

async function handleGenerateReferralLink({ userId }: { userId: string }) {
  try {
    const referralLink = await generateReferralLink(userId);
    return NextResponse.json({ success: true, referralLink });
  } catch (error) {
    logger.error('Error generating referral link', error);
    return NextResponse.json({ error: 'Failed to generate referral link' }, { status: 500 });
  }
}

async function handleProcessReferral({ referralCode, newUserId }: { referralCode: string, newUserId: string }) {
  try {
    await processReferral(referralCode, newUserId);
    await awardReferralBonus(referralCode, newUserId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error processing referral', error);
    return NextResponse.json({ error: 'Failed to process referral' }, { status: 500 });
  }
}

async function handleGetReferralStats({ userId }: { userId: string }) {
  try {
    const stats = await getReferralStats(userId);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    logger.error('Error getting referral stats', error);
    return NextResponse.json({ error: 'Failed to get referral stats' }, { status: 500 });
  }
}

function formatUserResponse(user: User, income: bigint, clickPower: bigint) {
  return {
    ...user,
    cryptoCoins: user.cryptoCoins.toString(),
    offlineEarnings: user.offlineEarnings.toString(),
    income: income.toString(),
    clickPower: clickPower.toString(),
    businesses: user.businesses.map(b => ({
      ...b,
      cost: calculateBusinessCost(b.type as BusinessType, b.count).toString(),
      income: (BUSINESSES[b.type as BusinessType].baseIncome * BigInt(b.count)).toString()
    })),
    upgrades: user.upgrades.map(u => ({
      type: u,
      cost: calculateUpgradeCost(u, user.upgrades).toString(),
      effect: UPGRADES[u].effect
    })),
    boosts: user.boosts.map(b => ({
      ...b,
      multiplier: b.multiplier
    }))
  };
}