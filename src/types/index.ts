// Game-related types

export interface User {
  id: string;
  telegramId: string;
  username: string | null;
  cryptoCoins: number;
  fractionalCoins: number;
  prestigePoints: number;
  lastActive: Date;
  incomeMultiplier: number;
  offlineEarnings: number;
  businesses: Business[];
  upgrades: Upgrade[];
  achievements: Achievement[];
}

export interface Business {
  id: string;
  type: BusinessType;
  count: number;
}

export interface Upgrade {
  id: string;
  type: UpgradeType;
}

export interface Achievement {
  id: string;
  type: string;
  unlockedAt: Date;
}

export interface GlobalStats {
  id: string;
  blockHeight: number;
  difficulty: number;
  globalHashRate: number;
  lastBlockTime: Date;
  networkHashRate: number;
  mempool: number;
  coinMarketPrice: number;
}

export type BusinessType = 'gpuMiner' | 'asicFarm' | 'miningPool' | 'cryptoExchange' | 'nftMarketplace' | 'defiPlatform';

export type UpgradeType = 'fasterInternet' | 'betterCooling' | 'aiOptimization' | 'quantumMining' | 'clickUpgrade';

export interface BusinessData {
  name: string;
  baseCost: number;
  baseHashRate?: number;
  baseTransactionFee?: number;
  baseStakingReward?: number;
}

export interface UpgradeData {
  name: string;
  cost: number;
  effect: number;
}

// API-related types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface InitData {
  telegramId: string;
  username?: string;
}

export interface SyncData {
  userId: string;
  cryptoCoins: number;
  fractionalCoins: number;
}

export interface BuyBusinessData {
  userId: string;
  businessType: BusinessType;
}

export interface BuyUpgradeData {
  userId: string;
  upgradeType: UpgradeType;
}

export interface MineBlockData {
  userId: string;
}

// Telegram-related types

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

// Add any other types specific to your project here