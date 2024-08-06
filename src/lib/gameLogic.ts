// src/lib/gameLogic.ts

import type { User, Business, Upgrade, BusinessType, UpgradeType } from '@/types';
import { logger } from '@/lib/logger';

// Constants
export const PRESTIGE_COST = 1e6; // 1 million coins to prestige
export const MAX_TOTAL_SUPPLY = 21e6; // 21 million max total supply (like Bitcoin)
export const INITIAL_BLOCK_REWARD = 50; // Initial block reward
export const HALVING_INTERVAL = 210000; // Number of blocks between halvings
export const INITIAL_MINING_DIFFICULTY = 1;
export const TARGET_BLOCK_TIME = 600; // 10 minutes in seconds
export const DIFFICULTY_ADJUSTMENT_INTERVAL = 2016; // Number of blocks between difficulty adjustments

export interface GlobalStats {
  blockHeight: number;
  difficulty: number;
  globalHashRate: number;
  lastBlockTime: Date;
  networkHashRate: number;
  mempool: number;
  coinMarketPrice: number;
}

export const BUSINESSES: Record<BusinessType, Business> = {
  gpuMiner: { name: "GPU Miner", baseCost: 15, baseHashRate: 1 },
  asicFarm: { name: "ASIC Farm", baseCost: 100, baseHashRate: 10 },
  miningPool: { name: "Mining Pool", baseCost: 1100, baseHashRate: 100 },
  cryptoExchange: { name: "Crypto Exchange", baseCost: 12000, baseTransactionFee: 0.001 },
  nftMarketplace: { name: "NFT Marketplace", baseCost: 130000, baseTransactionFee: 0.025 },
  defiPlatform: { name: "DeFi Platform", baseCost: 1400000, baseStakingReward: 0.0001 }
};

export const UPGRADES: Record<UpgradeType, Upgrade> = {
  fasterInternet: { name: "Faster Internet", cost: 1000, effect: 1.05 },
  betterCooling: { name: "Better Cooling", cost: 5000, effect: 1.07 },
  aiOptimization: { name: "AI Optimization", cost: 20000, effect: 1.1 },
  quantumMining: { name: "Quantum Mining", cost: 1000000, effect: 2 },
  clickUpgrade: { name: "Click Power", cost: 500, effect: 1.25 },
};

export const RANKS = [
  { name: "Novice Miner", threshold: 0 },
  { name: "Blockchain Pioneer", threshold: 1e5 },
  { name: "Crypto Enthusiast", threshold: 1e7 },
  { name: "Mining Magnate", threshold: 1e9 },
  { name: "Blockchain Tycoon", threshold: 1e11 },
  { name: "Crypto Whale", threshold: 1e13 },
  { name: "Digital Asset Mogul", threshold: 1e15 },
  { name: "Crypto Overlord", threshold: 1e17 }
];

export function calculateIncome(user: User, globalStats: GlobalStats): number {
  logger.debug('Calculating income for user', { userId: user.id });
  
  const miningIncome = calculateMiningReward(user, globalStats);
  const transactionFees = calculateTransactionFees(user, globalStats);
  const stakingRewards = calculateStakingRewards(user, globalStats);
  
  const totalIncome = (miningIncome + transactionFees + stakingRewards) * globalStats.coinMarketPrice;
  const finalIncome = totalIncome * user.incomeMultiplier * (1 + user.prestigePoints * 0.02);
  
  logger.debug('Income calculated', { userId: user.id, miningIncome, transactionFees, stakingRewards, totalIncome, finalIncome });
  return finalIncome;
}

export function calculateMiningReward(user: User, globalStats: GlobalStats): number {
  const blockReward = INITIAL_BLOCK_REWARD / Math.pow(2, Math.floor(globalStats.blockHeight / HALVING_INTERVAL));
  const userHashRate = calculateUserHashRate(user);
  const miningProbability = userHashRate / globalStats.networkHashRate;
  
  const reward = blockReward * miningProbability;
  
  logger.debug('Mining reward calculated', { userId: user.id, reward, blockReward, userHashRate, networkHashRate: globalStats.networkHashRate });
  return reward;
}

function calculateTransactionFees(user: User, globalStats: GlobalStats): number {
  let fees = 0;
  for (const business of user.businesses) {
    const businessData = BUSINESSES[business.type];
    if ('baseTransactionFee' in businessData) {
      fees += (businessData.baseTransactionFee as number) * business.count * globalStats.mempool * 0.0001;
    }
  }
  return fees;
}

function calculateStakingRewards(user: User, globalStats: GlobalStats): number {
  const defiPlatform = user.businesses.find(b => b.type === 'defiPlatform');
  if (!defiPlatform) return 0;
  
  const businessData = BUSINESSES.defiPlatform;
  if ('baseStakingReward' in businessData) {
    const baseReward = businessData.baseStakingReward as number;
    return baseReward * defiPlatform.count * user.cryptoCoins * 0.1; // Assume 10% of coins are staked
  }
  return 0;
}

export function calculateUserHashRate(user: User): number {
  let totalHashRate = 0;
  for (const business of user.businesses) {
    const businessData = BUSINESSES[business.type];
    if ('baseHashRate' in businessData) {
      totalHashRate += (businessData.baseHashRate as number) * business.count;
    }
  }
  
  // Apply upgrades to hash rate
  for (const upgrade of user.upgrades) {
    if (upgrade.type !== 'clickUpgrade') {
      totalHashRate *= UPGRADES[upgrade.type].effect;
    }
  }
  
  return totalHashRate;
}

export function calculateClickPower(user: User, globalStats: GlobalStats): number {
  logger.debug('Calculating click power for user', { userId: user.id });
  
  // Dynamic base click power based on global hash rate and difficulty
  let baseClickPower = 0.001 * Math.sqrt(globalStats.globalHashRate / globalStats.difficulty);
  
  // Apply click upgrade
  const clickUpgrade = user.upgrades.find(upgrade => upgrade.type === 'clickUpgrade');
  if (clickUpgrade) {
    baseClickPower *= UPGRADES.clickUpgrade.effect;
  }
  
  // Apply other upgrades to click power (reduced effect)
  for (const upgrade of user.upgrades) {
    if (upgrade.type !== 'clickUpgrade') {
      baseClickPower *= Math.sqrt(UPGRADES[upgrade.type].effect);
    }
  }

  // Apply user's income multiplier and prestige points
  const finalClickPower = baseClickPower * user.incomeMultiplier * (1 + user.prestigePoints * 0.02);
  
  // Apply current market price
  const clickPowerValue = finalClickPower * globalStats.coinMarketPrice;

  logger.debug('Click power calculated', { userId: user.id, baseClickPower, finalClickPower, clickPowerValue });
  return clickPowerValue;
}

export function calculateBusinessCost(businessType: BusinessType, currentCount: number): number {
  logger.debug('Calculating business cost', { businessType, currentCount });
  const business = BUSINESSES[businessType];
  const cost = Math.floor(business.baseCost * Math.pow(1.15, currentCount));
  logger.debug('Business cost calculated', { businessType, currentCount, cost });
  return cost;
}

export function calculatePrestigePoints(coins: number): number {
  logger.debug('Calculating prestige points', { coins });
  const prestigePoints = Math.floor(Math.log10(coins / PRESTIGE_COST));
  logger.debug('Prestige points calculated', { coins, prestigePoints });
  return Math.max(0, prestigePoints);
}

export function getBusinessTypes(): BusinessType[] {
  return Object.keys(BUSINESSES) as BusinessType[];
}

export function getUpgradeTypes(): UpgradeType[] {
  return Object.keys(UPGRADES) as UpgradeType[];
}

export function estimateTotalSupply(user: User): number {
  const totalBusinessIncome = Object.values(BUSINESSES).reduce((total, business) => {
    if ('baseHashRate' in business) {
      return total + (business.baseHashRate as number);
    }
    return total;
  }, 0);
  const maxUpgradeEffect = Object.values(UPGRADES).reduce((max, upgrade) => Math.max(max, upgrade.effect), 1);
  const maxPrestigeEffect = 1 + (MAX_TOTAL_SUPPLY / PRESTIGE_COST) * 0.02;
  
  const theoreticalMaxIncomePerSecond = totalBusinessIncome * maxUpgradeEffect * maxPrestigeEffect;
  const estimatedTotalSupply = user.cryptoCoins + (theoreticalMaxIncomePerSecond * 365 * 24 * 60 * 60); // Estimate for a year

  return Math.min(estimatedTotalSupply, MAX_TOTAL_SUPPLY);
}

export function calculateRank(totalEarnings: number): string {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalEarnings >= RANKS[i].threshold) {
      return RANKS[i].name;
    }
  }
  return RANKS[0].name; // Default to the lowest rank
}

export function estimateTimeToExhaustSupply(currentSupply: number, incomePerSecond: number): string {
  const remainingSupply = MAX_TOTAL_SUPPLY - currentSupply;
  const secondsToExhaust = remainingSupply / incomePerSecond;
  
  const years = Math.floor(secondsToExhaust / (365 * 24 * 60 * 60));
  const months = Math.floor((secondsToExhaust % (365 * 24 * 60 * 60)) / (30 * 24 * 60 * 60));
  const days = Math.floor((secondsToExhaust % (30 * 24 * 60 * 60)) / (24 * 60 * 60));

  return `${years} years, ${months} months, and ${days} days`;
}

export function updateGlobalState(currentStats: GlobalStats): GlobalStats {
  const newStats = { ...currentStats };
  
  // Update block height
  newStats.blockHeight++;
  
  // Update difficulty
  if (newStats.blockHeight % DIFFICULTY_ADJUSTMENT_INTERVAL === 0) {
    const timeElapsed = newStats.lastBlockTime.getTime() - currentStats.lastBlockTime.getTime();
    const expectedTime = DIFFICULTY_ADJUSTMENT_INTERVAL * TARGET_BLOCK_TIME * 1000;
    newStats.difficulty *= expectedTime / timeElapsed;
    newStats.difficulty = Math.max(INITIAL_MINING_DIFFICULTY, newStats.difficulty);
  }
  
  // Update global hash rate
  newStats.globalHashRate *= 1.0001; // Slight increase in global hash rate
  
  // Update network hash rate
  newStats.networkHashRate = newStats.globalHashRate * (0.9 + Math.random() * 0.2); // 90-110% of global hash rate
  
  // Update mempool
  newStats.mempool = Math.max(0, newStats.mempool - 1000 + Math.floor(Math.random() * 2000)); // Remove transactions, add new ones
  
  // Update market price (simplified)
  const priceChange = (Math.random() - 0.5) * 0.02; // -1% to +1% change
  newStats.coinMarketPrice *= (1 + priceChange);
  newStats.coinMarketPrice = Math.max(0.01, newStats.coinMarketPrice); // Ensure price doesn't go below $0.01

  newStats.lastBlockTime = new Date();
  
  return newStats;
}

export function getCurrentMarketPrice(globalStats: GlobalStats): number {
  return globalStats.coinMarketPrice;
}

export function getInitialGlobalStats(): GlobalStats {
  return {
    blockHeight: 0,
    difficulty: INITIAL_MINING_DIFFICULTY,
    globalHashRate: 1000,
    lastBlockTime: new Date(),
    networkHashRate: 1000,
    mempool: 0,
    coinMarketPrice: 1
  };
}

// Helper function to calculate the cost of an upgrade
export function calculateUpgradeCost(upgradeType: UpgradeType): number {
  return UPGRADES[upgradeType].cost;
}

// Function to check if a user can afford a business or upgrade
export function canAfford(user: User, cost: number): boolean {
  return user.cryptoCoins >= cost;
}

// Function to apply the cost of a purchase to the user's balance
export function applyPurchaseCost(user: User, cost: number): User {
  return {
    ...user,
    cryptoCoins: user.cryptoCoins - cost
  };
}

// Function to add a business to the user
export function addBusiness(user: User, businessType: BusinessType): User {
  const existingBusiness = user.businesses.find(b => b.type === businessType);
  if (existingBusiness) {
    return {
      ...user,
      businesses: user.businesses.map(b =>
        b.type === businessType ? { ...b, count: b.count + 1 } : b
      )
    };
  } else {
    return {
      ...user,
      businesses: [...user.businesses, { id: Date.now().toString(), type: businessType, count: 1 }]
    };
  }
}

// Function to add an upgrade to the user
export function addUpgrade(user: User, upgradeType: UpgradeType): User {
  if (user.upgrades.some(u => u.type === upgradeType)) {
    // Upgrade already exists, don't add it again
    return user;
  }
  return {
    ...user,
    upgrades: [...user.upgrades, { id: Date.now().toString(), type: upgradeType }]
  };
}

// Function to perform a prestige reset
export function performPrestige(user: User): User {
  const newPrestigePoints = calculatePrestigePoints(user.cryptoCoins);
  return {
    ...user,
    cryptoCoins: 0,
    businesses: [],
    upgrades: [],
    prestigePoints: user.prestigePoints + newPrestigePoints,
    incomeMultiplier: 1 + (user.prestigePoints + newPrestigePoints) * 0.1
  };
}