// src/types/index.ts

// Core game types

export interface User {
  id: string;
  telegramId: string;
  username: string | null;
  cryptoCoins: bigint;
  lastActive: Date;
  businesses: Business[];
  upgrades: UpgradeType[];
  activeUpgrades: UpgradeWithExpiration[];
  achievements: Achievement[];
  prestigePoints: number;
  incomeMultiplier: number;
  offlineEarnings: bigint;
  boosts: Boost[];
  lastIncomeUpdate: Date;
  referralCode: string | null;
  tasks: Task[];
  referrals: Referral[];
}

export interface UpgradeWithExpiration {
  type: UpgradeType;
  expirationTime: Date;
}

export interface Business {
  id: string;
  type: BusinessType;
  count: number;
  lastCalculated: Date;
}

export interface Achievement {
  id: string;
  type: string;
  unlockedAt: Date;
}

export interface Boost {
  id: string;
  multiplier: number;
  endTime: Date;
}

export interface BusinessData {
  name: string;
  baseCost: bigint;
  baseIncome: bigint;
}

export interface UpgradeData {
  name: string;
  cost: bigint;
  effect: number;
}

export type BusinessType = 'gpuMiner' | 'asicFarm' | 'miningPool' | 'cryptoExchange' | 'nftMarketplace' | 'defiPlatform';

export type UpgradeType = 'fasterInternet' | 'betterCooling' | 'aiOptimization' | 'quantumMining' | 'clickUpgrade';

export type TaskType = 'youtube_watch' | 'youtube_subscribe' | 'twitter_follow' | 'twitter_tweet' | 'telegram_join';

// Constants

export const PRESTIGE_COST: bigint = BigInt(1_000_000_000);
export const MAX_TOTAL_SUPPLY: bigint = BigInt(200_000_000_000);

// Game logic types

export interface IncomeCalculationResult {
  totalIncome: bigint;
}

export interface ClickPowerCalculationResult {
  baseClickPower: bigint;
  finalClickPower: bigint;
}

export interface OfflineProgressResult {
  earnedCoins: bigint;
  timePassed: number;
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
  income: bigint;
  clickPower: bigint;
}

// Action types for state management

export type GameAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'UPDATE_COINS'; payload: bigint }
  | { type: 'BUY_BUSINESS'; payload: { businessType: BusinessType; cost: bigint } }
  | { type: 'BUY_UPGRADE'; payload: { upgradeType: UpgradeType; cost: bigint } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_INCOME'; payload: bigint }
  | { type: 'UPDATE_CLICK_POWER'; payload: bigint };

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

// Rank types

export interface Rank {
  name: string;
  threshold: bigint;
}

export interface Task {
  id: string;
  type: TaskType;
  description: string;
  url: string;
  rewardType: string;
  rewardAmount: number;
  completed: boolean;
  userId: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  dateReferred: Date;
  bonusAwarded: boolean;
}

// Function types (based on game logic)

export type CalculateIncome = (user: User) => Promise<bigint>;
export type CalculateClickPower = (user: User) => Promise<bigint>;
export type CalculateBusinessCost = (businessType: BusinessType, currentCount: number) => bigint;
export type CalculateUpgradeCost = (upgradeType: UpgradeType, userUpgrades: UpgradeType[]) => bigint;
export type CalculatePrestigePoints = (coins: bigint) => number;
export type GetBusinessTypes = () => BusinessType[];
export type GetUpgradeTypes = () => UpgradeType[];
export type CalculateRank = (totalEarnings: bigint) => string;
export type CanAfford = (user: User, cost: bigint) => boolean;
export type ApplyPurchaseCost = (user: User, cost: bigint) => User;
export type AddBusiness = (user: User, businessType: BusinessType) => User;
export type AddUpgrade = (user: User, upgradeType: UpgradeType) => User;
export type PerformPrestige = (user: User) => User;
export type AddAchievement = (user: User, achievementType: string) => User;
export type CheckAndAddAchievements = (user: User) => User;
export type CalculateOfflineEarnings = (user: User, currentTime: Date) => Promise<bigint>;
export type SimulateGameTick = (user: User, currentTime: Date) => Promise<User>;
export type CanPrestige = (user: User) => boolean;
export type GetNextRank = (user: User) => Rank | null;
export type CalculateProgressToNextRank = (user: User) => number;
export type FormatLargeNumber = (num: bigint) => string;
export type CalculateTotalWorth = (user: User) => bigint;
export type MineBlock = (user: User, clickPower: bigint) => { updatedUser: User };
export type GetLeaderboardPosition = (user: User, allUsers: User[]) => number;
export type CalculateEstimatedTimeToGoal = (user: User, goalCoins: bigint) => Promise<number>;
export type CalculateMaxAffordableCount = (user: User, businessType: BusinessType) => number;
export type BuyMaxBusinesses = (user: User, businessType: BusinessType) => User;
export type CalculateBoostDuration = (user: User) => number;
export type ApplyBoost = (user: User, boostMultiplier: number, duration: number) => User;
export type CleanExpiredBoosts = (user: User) => User;
export type CalculateTotalBoostMultiplier = (user: User) => number;
export type CalculateIdleTime = (user: User, currentTime: Date) => number;
export type SimulateIdleEarnings = (user: User, currentTime: Date) => Promise<User>;
export type CalculateAllTimeEarnings = (user: User) => bigint;
export type ResetUserProgress = (user: User) => User;
export type CalculatePrestigeRewards = (user: User) => { prestigePoints: number, bonusMultiplier: number };
export type GenerateTasks = (userId: string) => Promise<Task[]>;
export type CompleteTask = (user: User, taskId: string) => Promise<User>;
export type AwardTaskReward = (user: User, taskId: string) => Promise<User>;
export type GenerateReferralLink = (user: User) => Promise<string>;
export type ProcessReferral = (referralCode: string, newUserId: string) => Promise<void>;
export type AwardReferralBonus = (referrerId: string, referredId: string) => Promise<void>;
export type GetReferralStats = (userId: string) => Promise<{ referralCount: number, totalBonus: bigint }>;