// Core game types

export interface User {
  id: string;
  telegramId: string;
  username: string | null;
  cryptoCoins: bigint;
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
  baseCost: bigint;
  baseHashRate?: number;
  baseTransactionFee?: number;
  baseStakingReward?: number;
}

export interface UpgradeData {
  name: string;
  cost: bigint;
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
  cryptoCoins: string; // BigInt as string
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

// Game state types

export interface GameState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  income: number;
  clickPower: number;
  globalStats: GlobalStats;
}

// Action types for state management

export type GameAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'UPDATE_COINS'; payload: bigint }
  | { type: 'BUY_BUSINESS'; payload: { businessType: BusinessType; cost: bigint } }
  | { type: 'BUY_UPGRADE'; payload: { upgradeType: UpgradeType; cost: bigint } }
  | { type: 'UPDATE_GLOBAL_STATS'; payload: GlobalStats }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_INCOME'; payload: number }
  | { type: 'UPDATE_CLICK_POWER'; payload: number };

// Leaderboard types

export interface LeaderboardEntry {
  userId: string;
  username: string | null;
  cryptoCoins: bigint;
  rank: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: number | null;
}

// Game logic types

export interface IncomeCalculationResult {
  totalIncome: bigint;
  miningIncome: bigint;
  transactionFees: bigint;
  stakingRewards: bigint;
}

export interface ClickPowerCalculationResult {
  baseClickPower: bigint;
  finalClickPower: number;
  clickPowerValue: bigint;
}

export interface OfflineProgressResult {
  earnedCoins: bigint;
  timePassed: number;
}