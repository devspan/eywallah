import { PrismaClient, Prisma } from '@prisma/client';
import { User, BusinessType, UpgradeType } from '@/types';
import { BUSINESSES, UPGRADES, calculateIncome } from '@/lib/gameLogic';

const prisma = new PrismaClient();

type PrismaUser = Prisma.UserGetPayload<{
  include: { businesses: true; upgrades: true; achievements: true }
}>;

function convertPrismaUserToUser(prismaUser: PrismaUser): User {
  return {
    ...prismaUser,
    businesses: prismaUser.businesses.map(b => ({
      id: b.id,
      type: b.type as BusinessType,
      count: b.count
    })),
    upgrades: prismaUser.upgrades.map(u => ({
      id: u.id,
      type: u.type as UpgradeType
    })),
    achievements: prismaUser.achievements,
    offlineEarnings: prismaUser.offlineEarnings
  } as User;
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: true,
        upgrades: true,
        achievements: true,
      },
    });
    return user ? convertPrismaUserToUser(user) : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function createUser(userId: string): Promise<User> {
  try {
    const user = await prisma.user.create({
      data: {
        id: userId,
        cryptoCoins: 0,
        lastActive: new Date(),
        prestigePoints: 0,
        incomeMultiplier: 1,
        offlineEarnings: 0,
      } as Prisma.UserCreateInput,
      include: {
        businesses: true,
        upgrades: true,
        achievements: true,
      },
    });
    return convertPrismaUserToUser(user);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(userId: string, data: Partial<Omit<User, 'businesses' | 'upgrades' | 'achievements'>>): Promise<User> {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: data as Prisma.UserUpdateInput,
      include: {
        businesses: true,
        upgrades: true,
        achievements: true,
      },
    });
    return convertPrismaUserToUser(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function addBusiness(userId: string, businessType: BusinessType): Promise<User> {
  try {
    const existingBusiness = await prisma.business.findFirst({
      where: {
        userId: userId,
        type: businessType,
      },
    });

    if (existingBusiness) {
      await prisma.business.update({
        where: { id: existingBusiness.id },
        data: { count: { increment: 1 } },
      });
    } else {
      await prisma.business.create({
        data: {
          userId: userId,
          type: businessType,
          count: 1,
        },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: true,
        upgrades: true,
        achievements: true,
      },
    });

    if (!updatedUser) throw new Error('User not found after adding business');
    return convertPrismaUserToUser(updatedUser);
  } catch (error) {
    console.error('Error adding business:', error);
    throw error;
  }
}

export async function addUpgrade(userId: string, upgradeType: UpgradeType): Promise<User> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        upgrades: {
          create: {
            type: upgradeType,
          },
        },
      },
      include: {
        businesses: true,
        upgrades: true,
        achievements: true,
      },
    });

    return convertPrismaUserToUser(user);
  } catch (error) {
    console.error('Error adding upgrade:', error);
    throw error;
  }
}

export async function calculateOfflineEarnings(userId: string): Promise<{ user: User; offlineEarnings: number }> {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const timeDiffInSeconds = (now.getTime() - user.lastActive.getTime()) / 1000;
    const income = calculateIncome(user);
    const offlineEarnings = income * timeDiffInSeconds;

    const updatedUser = await updateUser(userId, {
      cryptoCoins: user.cryptoCoins + offlineEarnings,
      lastActive: now,
      offlineEarnings: offlineEarnings,
    });

    return { user: updatedUser, offlineEarnings };
  } catch (error) {
    console.error('Error calculating offline earnings:', error);
    throw error;
  }
}

export async function resetUserProgress(userId: string, prestigePoints: number): Promise<User> {
  try {
    const updatedUser = await prisma.$transaction(async (prisma) => {
      await prisma.business.deleteMany({ where: { userId } });
      await prisma.upgrade.deleteMany({ where: { userId } });

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          cryptoCoins: 0,
          prestigePoints: {
            increment: prestigePoints,
          },
          incomeMultiplier: 1 + prestigePoints * 0.1,
          lastActive: new Date(),
          offlineEarnings: 0,
        },
        include: {
          businesses: true,
          upgrades: true,
          achievements: true,
        },
      });

      return user;
    });

    return convertPrismaUserToUser(updatedUser);
  } catch (error) {
    console.error('Error resetting user progress:', error);
    throw error;
  }
}

export function calculateBusinessCost(businessType: BusinessType, currentCount: number): number {
  return Math.floor(BUSINESSES[businessType].baseCost * Math.pow(1.15, currentCount));
}