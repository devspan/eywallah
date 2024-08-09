import { User, BusinessType, UpgradeType, Achievement, Boost, Task, Referral } from '@/types';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function createUser(telegramId: string, username: string | null): Promise<User> {
  const user = await prisma.user.create({
    data: {
      telegramId,
      username,
      cryptoCoins: BigInt(0),
      lastActive: new Date(),
      lastIncomeUpdate: new Date(),
      prestigePoints: 0,
      incomeMultiplier: 1,
      offlineEarnings: BigInt(0)
    },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return convertPrismaUserToGameUser(user);
}

async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return user ? convertPrismaUserToGameUser(user) : null;
}

async function getUserById(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return user ? convertPrismaUserToGameUser(user) : null;
}

async function getAllUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return users.map(convertPrismaUserToGameUser);
}

async function updateUser(userId: string, data: Partial<Omit<User, 'id' | 'telegramId' | 'businesses' | 'upgrades' | 'activeUpgrades' | 'achievements' | 'boosts' | 'tasks' | 'referrals'>>): Promise<User> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      cryptoCoins: data.cryptoCoins !== undefined ? data.cryptoCoins : undefined,
      offlineEarnings: data.offlineEarnings !== undefined ? data.offlineEarnings : undefined
    },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return convertPrismaUserToGameUser(updatedUser);
}

async function addBusiness(userId: string, businessType: BusinessType): Promise<User> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      businesses: {
        upsert: {
          where: {
            userId_type: {
              userId: userId,
              type: businessType
            }
          },
          create: {
            type: businessType,
            count: 1,
            lastCalculated: new Date()
          },
          update: {
            count: { increment: 1 },
            lastCalculated: new Date()
          }
        }
      }
    },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return convertPrismaUserToGameUser(updatedUser);
}

async function addUpgrade(userId: string, upgradeType: UpgradeType): Promise<User> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      upgrades: {
        create: { type: upgradeType }
      }
    },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return convertPrismaUserToGameUser(updatedUser);
}

async function syncUserData(userId: string, cryptoCoins: bigint): Promise<User> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { 
      cryptoCoins,
      lastActive: new Date()
    },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return convertPrismaUserToGameUser(updatedUser);
}

async function addAchievement(userId: string, achievementType: string): Promise<User> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      achievements: {
        create: {
          type: achievementType
        }
      }
    },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return convertPrismaUserToGameUser(updatedUser);
}

async function updateOfflineEarnings(userId: string, earnings: bigint): Promise<User> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { 
      offlineEarnings: earnings
    },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return convertPrismaUserToGameUser(updatedUser);
}

async function addBoost(userId: string, multiplier: number, duration: number): Promise<User> {
  const endTime = new Date(Date.now() + duration * 1000);
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      boosts: {
        create: {
          multiplier,
          endTime
        }
      }
    },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return convertPrismaUserToGameUser(updatedUser);
}

async function removeExpiredBoosts(userId: string): Promise<User> {
  const now = new Date();
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      boosts: {
        deleteMany: {
          endTime: {
            lt: now
          }
        }
      }
    },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return convertPrismaUserToGameUser(updatedUser);
}

async function updateLastActive(userId: string): Promise<User> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { 
      lastActive: new Date()
    },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return convertPrismaUserToGameUser(updatedUser);
}

function isValidTaskType(type: string): type is Task['type'] {
  return ['youtube_watch', 'youtube_subscribe', 'twitter_follow', 'twitter_tweet', 'telegram_join'].includes(type);
}


async function createTask(userId: string, task: Omit<Task, 'id' | 'completed' | 'userId'>): Promise<Task> {
  const createdTask = await prisma.task.create({
    data: {
      ...task,
      userId,
      completed: false,
      type: task.type
    }
  });

  return createdTask as Task;
}

async function completeTask(userId: string, taskId: string): Promise<User> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      tasks: {
        update: {
          where: { id: taskId },
          data: { completed: true }
        }
      }
    },
    include: {
      businesses: true,
      upgrades: true,
      activeUpgrades: true,
      achievements: true,
      boosts: true,
      tasks: true,
      referrals: true
    }
  });

  return convertPrismaUserToGameUser(updatedUser);
}

async function generateReferralLink(userId: string): Promise<string> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      referralCode: `REF_${userId}_${Date.now()}`
    }
  });

  return `https://t.me/ccapitalist_bot?start=${user.referralCode}`;
}

async function processReferral(referralCode: string, newUserId: string): Promise<void> {
  const referrer = await prisma.user.findFirst({
    where: { referralCode }
  });

  if (referrer) {
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: newUserId,
        bonusAwarded: false
      }
    });
  }
}

async function awardReferralBonus(referrerId: string, referredId: string): Promise<void> {
  const referrerBonus = BigInt(10000);
  const referredBonus = BigInt(5000);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: referrerId },
      data: { cryptoCoins: { increment: referrerBonus } }
    }),
    prisma.user.update({
      where: { id: referredId },
      data: { cryptoCoins: { increment: referredBonus } }
    }),
    prisma.referral.update({
      where: { referrerId_referredId: { referrerId, referredId } },
      data: { bonusAwarded: true }
    })
  ]);
}

async function getReferralStats(userId: string): Promise<{ referralCount: number, totalBonus: bigint }> {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId, bonusAwarded: true }
  });

  const referralCount = referrals.length;
  const totalBonus = BigInt(referralCount * 10000);

  return { referralCount, totalBonus };
}

function convertPrismaUserToGameUser(prismaUser: any): User {
  return {
    id: prismaUser.id,
    telegramId: prismaUser.telegramId,
    username: prismaUser.username,
    cryptoCoins: BigInt(prismaUser.cryptoCoins.toString()),
    lastActive: prismaUser.lastActive,
    businesses: (prismaUser.businesses || []).map((b: any) => ({
      id: b.id,
      type: b.type as BusinessType,
      count: b.count,
      lastCalculated: b.lastCalculated
    })),
    upgrades: (prismaUser.upgrades || []).map((u: any) => u.type as UpgradeType),
    activeUpgrades: (prismaUser.activeUpgrades || []).map((au: any) => ({
      type: au.type as UpgradeType,
      expirationTime: au.expirationTime
    })),
    achievements: (prismaUser.achievements || []).map((a: any) => ({
      id: a.id,
      type: a.type,
      unlockedAt: a.unlockedAt
    })),
    prestigePoints: prismaUser.prestigePoints,
    incomeMultiplier: prismaUser.incomeMultiplier,
    offlineEarnings: BigInt(prismaUser.offlineEarnings.toString()),
    boosts: (prismaUser.boosts || []).map((b: any) => ({
      id: b.id,
      multiplier: b.multiplier,
      endTime: b.endTime
    })),
    lastIncomeUpdate: prismaUser.lastIncomeUpdate,
    referralCode: prismaUser.referralCode,
    tasks: (prismaUser.tasks || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      url: t.url,
      rewardType: t.rewardType,
      rewardAmount: t.rewardAmount,
      completed: t.completed
    })),
    referrals: (prismaUser.referrals || []).map((r: any) => ({
      id: r.id,
      referrerId: r.referrerId,
      referredId: r.referredId,
      dateReferred: r.dateReferred,
      bonusAwarded: r.bonusAwarded
    }))
  };
}

// Export all functions
export {
  createUser,
  getUserByTelegramId,
  getUserById,
  getAllUsers,
  updateUser,
  addBusiness,
  addUpgrade,
  syncUserData,
  addAchievement,
  updateOfflineEarnings,
  addBoost,
  removeExpiredBoosts,
  updateLastActive,
  createTask,
  completeTask,
  generateReferralLink,
  processReferral,
  awardReferralBonus,
  getReferralStats
};