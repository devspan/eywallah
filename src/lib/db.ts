import { PrismaClient, type Prisma } from '@prisma/client';
import type { User, BusinessType, UpgradeType } from '@/types';
import { BUSINESSES, UPGRADES, calculateIncome } from '@/lib/gameLogic';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

type PrismaUser = Prisma.UserGetPayload<{
  include: { businesses: true; upgrades: true; achievements: true }
}>;

function convertPrismaUserToUser(prismaUser: PrismaUser): User {
  logger.debug('Converting Prisma user to User object', { userId: prismaUser.id });
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
    logger.debug('Fetching user by ID', { userId });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: true,
        upgrades: true,
        achievements: true,
      },
    });
    if (user) {
      logger.debug('User found', { userId });
      return convertPrismaUserToUser(user);
    } else {
      logger.debug('User not found', { userId });
      return null;
    }
  } catch (error) {
    logger.error('Error fetching user by ID', { userId, error });
    return null;
  }
}

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  try {
    logger.debug('Fetching user by Telegram ID', { telegramId });
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        businesses: true,
        upgrades: true,
        achievements: true,
      },
    });
    if (user) {
      logger.debug('User found', { telegramId, userId: user.id });
      return convertPrismaUserToUser(user);
    } else {
      logger.debug('User not found', { telegramId });
      return null;
    }
  } catch (error) {
    logger.error('Error fetching user by Telegram ID', { telegramId, error });
    return null;
  }
}

export async function createUser(telegramId: string, username: string | null): Promise<User> {
  try {
    logger.debug('Creating new user', { telegramId, username });
    const user = await prisma.user.create({
      data: {
        telegramId,
        username,
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
    logger.debug('User created', { userId: user.id, telegramId, username });
    return convertPrismaUserToUser(user);
  } catch (error) {
    logger.error('Error creating user', { telegramId, username, error });
    throw error;
  }
}

export async function updateUser(userId: string, data: Partial<Omit<User, 'businesses' | 'upgrades' | 'achievements'>>): Promise<User> {
  try {
    logger.debug('Updating user', { userId, data });
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: data as Prisma.UserUpdateInput,
      include: {
        businesses: true,
        upgrades: true,
        achievements: true,
      },
    });
    logger.debug('User updated successfully', { userId });
    return convertPrismaUserToUser(updatedUser);
  } catch (error) {
    logger.error('Error updating user', { userId, data, error });
    throw error;
  }
}

export async function addBusiness(userId: string, businessType: BusinessType): Promise<User> {
  try {
    logger.debug('Adding business to user', { userId, businessType });
    const existingBusiness = await prisma.business.findFirst({
      where: {
        userId: userId,
        type: businessType,
      },
    });

    if (existingBusiness) {
      logger.debug('Existing business found, incrementing count', { userId, businessType, businessId: existingBusiness.id });
      await prisma.business.update({
        where: { id: existingBusiness.id },
        data: { count: { increment: 1 } },
      });
    } else {
      logger.debug('Creating new business', { userId, businessType });
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

    if (!updatedUser) {
      logger.error('User not found after adding business', { userId });
      throw new Error('User not found after adding business');
    }

    logger.debug('Business added successfully', { userId, businessType });
    return convertPrismaUserToUser(updatedUser);
  } catch (error) {
    logger.error('Error adding business', { userId, businessType, error });
    throw error;
  }
}

export async function addUpgrade(userId: string, upgradeType: UpgradeType): Promise<User> {
  try {
    logger.debug('Adding upgrade to user', { userId, upgradeType });
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

    logger.debug('Upgrade added successfully', { userId, upgradeType });
    return convertPrismaUserToUser(user);
  } catch (error) {
    logger.error('Error adding upgrade', { userId, upgradeType, error });
    throw error;
  }
}

export async function calculateOfflineEarnings(userId: string): Promise<{ user: User; offlineEarnings: number }> {
  try {
    logger.debug('Calculating offline earnings', { userId });
    const user = await getUserById(userId);
    if (!user) {
      logger.error('User not found while calculating offline earnings', { userId });
      throw new Error('User not found');
    }

    const now = new Date();
    const timeDiffInSeconds = (now.getTime() - user.lastActive.getTime()) / 1000;
    const income = calculateIncome(user);
    const offlineEarnings = income * timeDiffInSeconds;

    logger.debug('Updating user with offline earnings', { userId, offlineEarnings });
    const updatedUser = await updateUser(userId, {
      cryptoCoins: user.cryptoCoins + offlineEarnings,
      lastActive: now,
      offlineEarnings: offlineEarnings,
    });

    logger.debug('Offline earnings calculated and updated', { userId, offlineEarnings });
    return { user: updatedUser, offlineEarnings };
  } catch (error) {
    logger.error('Error calculating offline earnings', { userId, error });
    throw error;
  }
}

export async function resetUserProgress(userId: string, prestigePoints: number): Promise<User> {
  try {
    logger.debug('Resetting user progress', { userId, prestigePoints });
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

    logger.debug('User progress reset successfully', { userId, prestigePoints });
    return convertPrismaUserToUser(updatedUser);
  } catch (error) {
    logger.error('Error resetting user progress', { userId, prestigePoints, error });
    throw error;
  }
}

export function calculateBusinessCost(businessType: BusinessType, currentCount: number): number {
  logger.debug('Calculating business cost', { businessType, currentCount });
  return Math.floor(BUSINESSES[businessType].baseCost * Math.pow(1.15, currentCount));
}