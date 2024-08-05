import { getGameState, saveGameState } from './redis';
import {
  addBusiness,
  addUpgrade,
  applyPurchaseCost,
  calculateBusinessCost,
  calculateUpgradeCost,
  canAfford,
} from './gameLogic';
import { User, BusinessType, UpgradeType } from '@/types';
import { cookies } from 'next/headers';

export async function getUserState(telegramId: string): Promise<User | null> {
  return await getGameState(telegramId);
}

export async function saveUserState(user: User): Promise<void> {
  await saveGameState(user);
}

export async function purchaseBusiness(businessType: BusinessType, telegramId: string): Promise<boolean> {
  const user = await getUserState(telegramId);
  if (!user) return false;

  const businessCost = calculateBusinessCost(businessType, user.businesses.filter((b) => b.type === businessType).length);

  if (!canAfford(user, businessCost)) {
    return false;
  }

  const updatedUser = applyPurchaseCost(addBusiness(user, businessType), businessCost);
  await saveUserState(updatedUser);
  return true;
}

export async function purchaseUpgrade(upgradeType: UpgradeType, telegramId: string): Promise<boolean> {
  const user = await getUserState(telegramId);
  if (!user) return false;

  const userUpgrade = user.upgrades.find((u) => u.type === upgradeType);
  const level = userUpgrade ? 1 : 0;
  const upgradeCost = calculateUpgradeCost(upgradeType, level);

  if (!canAfford(user, upgradeCost)) {
    return false;
  }

  const updatedUser = applyPurchaseCost(addUpgrade(user, upgradeType), upgradeCost);
  await saveUserState(updatedUser);
  return true;
}

export async function getUserBusinesses(telegramId: string): Promise<UserBusiness[]> {
  const user = await getUserState(telegramId);
  return user?.businesses || [];
}

export async function getUserUpgrades(telegramId: string): Promise<UserUpgrade[]> {
  const user = await getUserState(telegramId);
  return user?.upgrades || [];
}

export async function getUserCryptoCoins(telegramId: string): Promise<number> {
  const user = await getUserState(telegramId);
  return user?.cryptoCoins || 0;
}

export async function getUserPrestigePoints(telegramId: string): Promise<number> {
  const user = await getUserState(telegramId);
  return user?.prestigePoints || 0;
}

export async function getUserIncomeMultiplier(telegramId: string): Promise<number> {
  const user = await getUserState(telegramId);
  return user?.incomeMultiplier || 1;
}

export async function getUserOfflineEarnings(telegramId: string): Promise<number> {
  const user = await getUserState(telegramId);
  return user?.offlineEarnings || 0;
}

export function getTelegramId(headers: Headers): string | null {
  const authHeader = headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const decodedToken = atob(token.split('.')[1]);
  const { id } = JSON.parse(decodedToken);
  return id ? String(id) : null;
}