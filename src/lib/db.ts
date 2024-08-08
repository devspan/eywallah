import { User, BusinessType, UpgradeType, Achievement, Boost } from '@/types';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function createUser(telegramId: string, username: string | null): Promise<User> {
  const user = await prisma.user.create({
    data: {
      telegramId,
      username,
      cryptoCoins: BigInt(0),
      lastActive: new Date(),
      prestigePoints: 0,
      incomeMultiplier: 1,
      offlineEarnings: BigInt(0)
    },
    include: {
      businesses: true,
      upgrades: true,
      achievements: true,
      boosts: true
    }
  });

  return {
    ...user,
    cryptoCoins: user.cryptoCoins,
    offlineEarnings: user.offlineEarnings,
    businesses: user.businesses.map(b => ({ ...b, type: b.type as BusinessType })),
    upgrades: user.upgrades.map(u => u.type as UpgradeType),
    achievements: user.achievements,
    boosts: user.boosts
  };
}

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: {
      businesses: true,
      upgrades: true,
      achievements: true,
      boosts: true
    }
  });

  if (user) {
    return {
      ...user,
      businesses: user.businesses.map(b => ({ ...b, type: b.type as BusinessType })),
      upgrades: user.upgrades.map(u => u.type as UpgradeType),
      achievements: user.achievements,
      boosts: user.boosts
    };
  }

  return null;
}

export async function updateUser(userId: string, data: Partial<Omit<User, 'businesses' | 'upgrades' | 'achievements' | 'boosts'>>): Promise<User> {
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
      achievements: true,
      boosts: true
    }
  });

  return {
    ...updatedUser,
    businesses: updatedUser.businesses.map(b => ({ ...b, type: b.type as BusinessType })),
    upgrades: updatedUser.upgrades.map(u => u.type as UpgradeType),
    achievements: updatedUser.achievements,
    boosts: updatedUser.boosts
  };
}

export async function addBusiness(userId: string, businessType: BusinessType): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { businesses: true }
  });
  if (!user) throw new Error('User not found');

  const existingBusiness = user.businesses.find(b => b.type === businessType);

  if (existingBusiness) {
    await prisma.business.update({
      where: { id: existingBusiness.id },
      data: { count: { increment: 1 } }
    });
  } else {
    await prisma.business.create({
      data: {
        userId,
        type: businessType,
        count: 1
      }
    });
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businesses: true,
      upgrades: true,
      achievements: true,
      boosts: true
    }
  });

  if (!updatedUser) throw new Error('Failed to fetch updated user');

  return {
    ...updatedUser,
    businesses: updatedUser.businesses.map(b => ({ ...b, type: b.type as BusinessType })),
    upgrades: updatedUser.upgrades.map(u => u.type as UpgradeType),
    achievements: updatedUser.achievements,
    boosts: updatedUser.boosts
  };
}

export async function addUpgrade(userId: string, upgradeType: UpgradeType): Promise<User> {
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
      achievements: true,
      boosts: true
    }
  });

  return {
    ...updatedUser,
    businesses: updatedUser.businesses.map(b => ({ ...b, type: b.type as BusinessType })),
    upgrades: updatedUser.upgrades.map(u => u.type as UpgradeType),
    achievements: updatedUser.achievements,
    boosts: updatedUser.boosts
  };
}

export async function syncUserData(userId: string, cryptoCoins: bigint): Promise<User> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { 
      cryptoCoins,
      lastActive: new Date()
    },
    include: {
      businesses: true,
      upgrades: true,
      achievements: true,
      boosts: true
    }
  });

  return {
    ...updatedUser,
    businesses: updatedUser.businesses.map(b => ({ ...b, type: b.type as BusinessType })),
    upgrades: updatedUser.upgrades.map(u => u.type as UpgradeType),
    achievements: updatedUser.achievements,
    boosts: updatedUser.boosts
  };
}

export async function addAchievement(userId: string, achievementType: string): Promise<User> {
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
      achievements: true,
      boosts: true
    }
  });

  return {
    ...updatedUser,
    businesses: updatedUser.businesses.map(b => ({ ...b, type: b.type as BusinessType })),
    upgrades: updatedUser.upgrades.map(u => u.type as UpgradeType),
    achievements: updatedUser.achievements,
    boosts: updatedUser.boosts
  };
}

export async function updateOfflineEarnings(userId: string, earnings: bigint): Promise<User> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { 
      offlineEarnings: earnings
    },
    include: {
      businesses: true,
      upgrades: true,
      achievements: true,
      boosts: true
    }
  });

  return {
    ...updatedUser,
    businesses: updatedUser.businesses.map(b => ({ ...b, type: b.type as BusinessType })),
    upgrades: updatedUser.upgrades.map(u => u.type as UpgradeType),
    achievements: updatedUser.achievements,
    boosts: updatedUser.boosts
  };
}

export async function addBoost(userId: string, multiplier: number, duration: number): Promise<User> {
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
      achievements: true,
      boosts: true
    }
  });

  return {
    ...updatedUser,
    businesses: updatedUser.businesses.map(b => ({ ...b, type: b.type as BusinessType })),
    upgrades: updatedUser.upgrades.map(u => u.type as UpgradeType),
    achievements: updatedUser.achievements,
    boosts: updatedUser.boosts
  };
}