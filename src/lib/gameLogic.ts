import { User, Business, Upgrade, BusinessType, UpgradeType, GameData } from './index';
import { logger } from '@/lib/logger';

// Constants
export const PRESTIGE_COST = 1e6; // 1 million coins to prestige
export const MAX_TOTAL_SUPPLY = 200e9; // 200 billion max total supply
export const INITIAL_BLOCK_REWARD = 50; // Initial block reward
export const HALVING_INTERVAL = 210000; // Number of blocks between halvings
export const INITIAL_MINING_DIFFICULTY = 1;
export const TARGET_BLOCK_TIME = 600; // 10 minutes in seconds
export const DIFFICULTY_ADJUSTMENT_INTERVAL = 2016; // Number of blocks between difficulty adjustments

// Global state
let globalBlockHeight = 0;
let globalMiningDifficulty = INITIAL_MINING_DIFFICULTY;
let globalHashRate = 1000; // Initial global hash rate
let lastDifficultyAdjustmentTime = Date.now();
let coinMarketPrice = 1; // Initial market price in USD

export const BUSINESSES: Record<BusinessType, Business> = {
  gpuMiner: { name: "GPU Miner", baseCost: 15, baseHashRate: 1 },
  asicFarm: { name: "ASIC Farm", baseCost: 100, baseHashRate: 10 },
  miningPool: { name: "Mining Pool", baseCost: 1100, baseHashRate: 100 },
  cryptoExchange: { name: "Crypto Exchange", baseCost: 12000, baseTransactionFee: 0.001 },
  nftMarketplace: { name: "NFT Marketplace", baseCost: 130000, baseTransactionFee: 0.025 },
  defiPlatform: { name: "DeFi Platform", baseCost: 1400000, baseStakingReward: 0.0001 }
};

export const UPGRADES: Record<UpgradeType, Upgrade> = {
  fasterInternet: {
    name: "Faster Internet",
    cost: (level) => 1000 * Math.pow(1.5, level),
    effect: (level) => 1 + 0.05 * level
  },
  betterCooling: {
    name: "Better Cooling",
    cost: (level) => 5000 * Math.pow(1.6, level),
    effect: (level) => 1 + 0.07 * level
  },
  aiOptimization: {
    name: "AI Optimization",
    cost: (level) => 20000 * Math.pow(1.7, level),
    effect: (level) => 1 + 0.1 * level
  },
  quantumMining: {
    name: "Quantum Mining",
    cost: (level) => 1000000 * Math.pow(2, level),
    effect: (level) => 1 + 0.2 * level
  },
  clickUpgrade: {
    name: "Click Power",
    cost: (level) => 500 * Math.pow(1.3, level),
    effect: (level) => 1 + 0.25 * level
  }
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

export function calculateIncome(user: User): number {
  logger.debug('Calculating income for user', { userId: user.id });
  
  const miningIncome = calculateMiningReward(user);
  const transactionFees = calculateTransactionFees(user);
  const stakingRewards = calculateStakingRewards(user);
  
  const totalIncome = (miningIncome + transactionFees + stakingRewards) * coinMarketPrice;
  const finalIncome = totalIncome * user.incomeMultiplier * (1 + user.prestigePoints * 0.02);
  
  logger.debug('Income calculated', { userId: user.id, miningIncome, transactionFees, stakingRewards, totalIncome, finalIncome });
  return finalIncome;
}

export function calculateMiningReward(user: User): number {
  const blockReward = INITIAL_BLOCK_REWARD / Math.pow(2, Math.floor(globalBlockHeight / HALVING_INTERVAL));
  const userHashRate = calculateUserHashRate(user);
  const miningProbability = userHashRate / globalHashRate;
  
  const reward = blockReward * miningProbability;
  
  logger.debug('Mining reward calculated', { userId: user.id, reward, blockReward, userHashRate, globalHashRate });
  return reward;
}

function calculateTransactionFees(user: User): number {
  let fees = 0;
  for (const business of user.businesses) {
    if (BUSINESSES[business.type].baseTransactionFee) {
      fees += BUSINESSES[business.type].baseTransactionFee! * business.count * globalBlockHeight * 0.01;
    }
  }
  return fees;
}

function calculateStakingRewards(user: User): number {
  const defiPlatform = user.businesses.find(b => b.type === 'defiPlatform');
  if (!defiPlatform || !BUSINESSES.defiPlatform.baseStakingReward) return 0;
  
  const baseReward = BUSINESSES.defiPlatform.baseStakingReward * defiPlatform.count;
  return baseReward * user.cryptoCoins * 0.1; // Assume 10% of coins are staked
}

export function calculateUserHashRate(user: User): number {
  let totalHashRate = 0;
  for (const business of user.businesses) {
    const businessData = BUSINESSES[business.type];
    if (businessData.baseHashRate) {
      totalHashRate += businessData.baseHashRate * business.count;
    }
  }
  
  // Apply upgrades to hash rate
  for (const upgrade of user.upgrades) {
    if (upgrade.type !== 'clickUpgrade') {
      const upgradeData = UPGRADES[upgrade.type];
      totalHashRate *= upgradeData.effect(getUserUpgradeLevel(user, upgrade.type));
    }
  }
  
  return totalHashRate;
}

export function calculateClickPower(user: User): number {
  logger.debug('Calculating click power for user', { userId: user.id });
  let clickPower = 1000; // Base click power
  
  // Apply click upgrade
  const clickUpgrade = user.upgrades.find(upgrade => upgrade.type === 'clickUpgrade');
  if (clickUpgrade) {
    clickPower *= UPGRADES.clickUpgrade.effect(getUserUpgradeLevel(user, 'clickUpgrade'));
  }
  
  // Apply other upgrades to click power (reduced effect)
  for (const upgrade of user.upgrades) {
    if (upgrade.type !== 'clickUpgrade') {
      clickPower *= Math.sqrt(UPGRADES[upgrade.type].effect(getUserUpgradeLevel(user, upgrade.type)));
    }
  }

  const finalClickPower = clickPower * user.incomeMultiplier * (1 + user.prestigePoints * 0.02) * coinMarketPrice;
  logger.debug('Click power calculated', { userId: user.id, clickPower, finalClickPower });
  return finalClickPower;
}

export function calculateBusinessCost(businessType: BusinessType, currentCount: number): number {
  logger.debug('Calculating business cost', { businessType, currentCount });
  const business = BUSINESSES[businessType];
  if (!business) {
    logger.error(`Business type ${businessType} not found`);
    return 0;
  }
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
  const totalBusinessIncome = Object.values(BUSINESSES).reduce((total, business) => total + (business.baseHashRate || 0), 0);
  const maxUpgradeEffect = Object.values(UPGRADES).reduce((max, upgrade) => Math.max(max, upgrade.effect(100)), 1);
  const maxPrestigeEffect = 1 + (MAX_TOTAL_SUPPLY / PRESTIGE_COST) * 0.02;
  
  const theoreticalMaxIncomePerSecond = totalBusinessIncome * maxUpgradeEffect * maxPrestigeEffect * coinMarketPrice;
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

export function updateGlobalState() {
  globalBlockHeight++;
  adjustDifficulty();
  updateGlobalHashRate();
  simulateMarket();
  
  logger.debug('Global state updated', { 
    globalBlockHeight, 
    globalMiningDifficulty, 
    globalHashRate, 
    coinMarketPrice 
  });
}

function adjustDifficulty() {
  if (globalBlockHeight % DIFFICULTY_ADJUSTMENT_INTERVAL === 0) {
    const timeElapsed = Date.now() - lastDifficultyAdjustmentTime;
    const expectedTime = DIFFICULTY_ADJUSTMENT_INTERVAL * TARGET_BLOCK_TIME * 1000;
    
    globalMiningDifficulty *= expectedTime / timeElapsed;
    globalMiningDifficulty = Math.max(INITIAL_MINING_DIFFICULTY, globalMiningDifficulty);
    
    lastDifficultyAdjustmentTime = Date.now();
  }
}

function updateGlobalHashRate() {
  // Simulate gradual increase in global hash rate
  globalHashRate *= 1.001;
}

function simulateMarket() {
  // Simple random walk for market price
  const change = (Math.random() - 0.5) * 0.02; // -1% to +1% change
  coinMarketPrice *= (1 + change);
  coinMarketPrice = Math.max(0.01, coinMarketPrice); // Ensure price doesn't go below $0.01
}

export function getCurrentMarketPrice(): number {
  return coinMarketPrice;
}

export function getGlobalStats() {
  return {
    blockHeight: globalBlockHeight,
    difficulty: globalMiningDifficulty,
    globalHashRate: globalHashRate,
    marketPrice: coinMarketPrice
  };
}

// Helper function to calculate the cost of an upgrade
export function calculateUpgradeCost(upgradeType: UpgradeType, level: number): number {
  return UPGRADES[upgradeType].cost(level);
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

// Helper function to get the level of a user's upgrade
function getUserUpgradeLevel(user: User, upgradeType: UpgradeType): number {
  const upgrade = user.upgrades.find(u => u.type === upgradeType);
  return upgrade ? 1 : 0;
}