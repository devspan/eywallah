export type User = {
  id: string;
  telegramId: string;
  username: string | null;
  cryptoCoins: number;
  lastActive: Date;
  prestigePoints: number;
  incomeMultiplier: number;
  offlineEarnings: number;
  businesses: UserBusiness[];
  upgrades: UserUpgrade[];
  achievements: Achievement[];
};

export type UserBusiness = {
  id: string;
  type: BusinessType;
  count: number;
};

export type UserUpgrade = {
  id: string;
  type: UpgradeType;
};

export type Achievement = {
  id: string;
  type: string;
};

export type BusinessType = 'gpuMiner' | 'asicFarm' | 'miningPool' | 'cryptoExchange' | 'nftMarketplace' | 'defiPlatform';
export type UpgradeType = 'fasterInternet' | 'betterCooling' | 'aiOptimization' | 'quantumMining' | 'clickUpgrade';

export type Business = {
  name: string;
  baseCost: number;
  baseHashRate?: number;
  baseTransactionFee?: number;
  baseStakingReward?: number;
};

export type Upgrade = {
  name: string;
  cost: (level: number) => number;
  effect: (level: number) => number;
};

export type GameData = {
  BUSINESSES: Record<BusinessType, Business>;
  UPGRADES: Record<UpgradeType, Upgrade>;
};