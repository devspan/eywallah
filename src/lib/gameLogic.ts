import type { User, BusinessType, UpgradeType, BusinessData, UpgradeData, Achievement } from '@/types';
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
  id : string;
  blockHeight: number;
  difficulty: number;
  globalHashRate: number;
  lastBlockTime: Date;
  networkHashRate: number;
  mempool: number;
  coinMarketPrice: number;
}

export const BUSINESSES: Record<BusinessType, BusinessData> = {
  gpuMiner: { name: "GPU Miner", baseCost: 15, baseHashRate: 1 },
  asicFarm: { name: "ASIC Farm", baseCost: 100, baseHashRate: 10 },
  miningPool: { name: "Mining Pool", baseCost: 1100, baseHashRate: 100 },
  cryptoExchange: { name: "Crypto Exchange", baseCost: 12000, baseTransactionFee: 0.001 },
  nftMarketplace: { name: "NFT Marketplace", baseCost: 130000, baseTransactionFee: 0.025 },
  defiPlatform: { name: "DeFi Platform", baseCost: 1400000, baseStakingReward: 0.0001 }
};

export const UPGRADES: Record<UpgradeType, UpgradeData> = {
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
  const newStats: GlobalStats = {
    id: currentStats.id, // Add this line
    blockHeight: currentStats.blockHeight + 1,
    difficulty: currentStats.difficulty,
    globalHashRate: currentStats.globalHashRate * 1.0001,
    lastBlockTime: new Date(),
    networkHashRate: currentStats.globalHashRate * (0.9 + Math.random() * 0.2),
    mempool: Math.max(0, currentStats.mempool - 1000 + Math.floor(Math.random() * 2000)),
    coinMarketPrice: currentStats.coinMarketPrice * (1 + (Math.random() - 0.5) * 0.02),
  };

  if (newStats.blockHeight % DIFFICULTY_ADJUSTMENT_INTERVAL === 0) {
    const timeElapsed = newStats.lastBlockTime.getTime() - currentStats.lastBlockTime.getTime();
    const expectedTime = DIFFICULTY_ADJUSTMENT_INTERVAL * TARGET_BLOCK_TIME * 1000;
    newStats.difficulty *= expectedTime / timeElapsed;
    newStats.difficulty = Math.max(INITIAL_MINING_DIFFICULTY, newStats.difficulty);
  }

  newStats.coinMarketPrice = Math.max(0.01, newStats.coinMarketPrice);

  return newStats;
}


export function getCurrentMarketPrice(globalStats: GlobalStats): number {
  return globalStats.coinMarketPrice;
}

export function getInitialGlobalStats(): GlobalStats {
  return {
    id: '0', 
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

export function addAchievement(user: User, achievementType: string): User {
  const existingAchievement = user.achievements.find(a => a.type === achievementType);
  if (existingAchievement) {
    return user;
  }
  
  const newAchievement: Achievement = {
    id: Date.now().toString(),
    type: achievementType,
    unlockedAt: new Date()
  };
  
  return {
    ...user,
    achievements: [...user.achievements, newAchievement]
  };
}

export function checkAndAddAchievements(user: User): User {
  let updatedUser = user;

  // Check for business count achievements
  const businessCounts = user.businesses.reduce((acc, business) => {
    acc[business.type] = (acc[business.type] || 0) + business.count;
    return acc;
  }, {} as Record<BusinessType, number>);

  Object.entries(businessCounts).forEach(([type, count]) => {
    if (count >= 10 && !user.achievements.some(a => a.type === `${type}10`)) {
      updatedUser = addAchievement(updatedUser, `${type}10`);
    }
    if (count >= 50 && !user.achievements.some(a => a.type === `${type}50`)) {
      updatedUser = addAchievement(updatedUser, `${type}50`);
    }
    if (count >= 100 && !user.achievements.some(a => a.type === `${type}100`)) {
      updatedUser = addAchievement(updatedUser, `${type}100`);
    }
  });

  // Check for coin milestones
  const coinMilestones = [1000, 1000000, 1000000000];
  coinMilestones.forEach(milestone => {
    if (user.cryptoCoins >= milestone && !user.achievements.some(a => a.type === `coins${milestone}`)) {
      updatedUser = addAchievement(updatedUser, `coins${milestone}`);
    }
  });

  // Check for upgrade milestones
  const upgradeCount = user.upgrades.length;
  if (upgradeCount >= 5 && !user.achievements.some(a => a.type === 'upgrades5')) {
    updatedUser = addAchievement(updatedUser, 'upgrades5');
  }
  if (upgradeCount >= 10 && !user.achievements.some(a => a.type === 'upgrades10')) {
    updatedUser = addAchievement(updatedUser, 'upgrades10');
  }

  // Check for prestige milestones
  if (user.prestigePoints >= 1 && !user.achievements.some(a => a.type === 'prestige1')) {
    updatedUser = addAchievement(updatedUser, 'prestige1');
  }
  if (user.prestigePoints >= 5 && !user.achievements.some(a => a.type === 'prestige5')) {
    updatedUser = addAchievement(updatedUser, 'prestige5');
  }
  if (user.prestigePoints >= 10 && !user.achievements.some(a => a.type === 'prestige10')) {
    updatedUser = addAchievement(updatedUser, 'prestige10');
  }

  return updatedUser;
}

export function simulateGameTick(user: User, globalStats: GlobalStats, elapsedSeconds: number): {user: User, globalStats: GlobalStats} {
  // Calculate income for the elapsed time
  const income = calculateIncome(user, globalStats) * elapsedSeconds;
  
  // Update user's crypto coins and fractional coins
  let updatedFractionalCoins = user.fractionalCoins + income;
  let updatedCoins = user.cryptoCoins + Math.floor(updatedFractionalCoins);
  updatedFractionalCoins = updatedFractionalCoins % 1;
  
  let updatedUser = {
    ...user,
    cryptoCoins: updatedCoins,
    fractionalCoins: updatedFractionalCoins
  };
  
  // Check and add achievements
  updatedUser = checkAndAddAchievements(updatedUser);
  
  // Update global stats
  const updatedGlobalStats = updateGlobalState(globalStats);
  
  return {
    user: updatedUser,
    globalStats: updatedGlobalStats
  };
}

export function calculateOfflineProgress(user: User, globalStats: GlobalStats, offlineTime: number): {user: User, globalStats: GlobalStats, offlineEarnings: number} {
  const { user: updatedUser, globalStats: updatedGlobalStats } = simulateGameTick(user, globalStats, offlineTime);
  const offlineEarnings = updatedUser.cryptoCoins - user.cryptoCoins;
  
  return {
    user: updatedUser,
    globalStats: updatedGlobalStats,
    offlineEarnings
  };
}

export function applyPrestige(user: User): User {
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

export function canPrestige(user: User): boolean {
  return user.cryptoCoins >= PRESTIGE_COST;
}

export function getNextRank(user: User): { name: string; threshold: number } | null {
  const currentRank = calculateRank(user.cryptoCoins);
  const currentRankIndex = RANKS.findIndex(rank => rank.name === currentRank);
  
  if (currentRankIndex < RANKS.length - 1) {
    return RANKS[currentRankIndex + 1];
  }
  
  return null; // User is at the highest rank
}

export function calculateProgressToNextRank(user: User): number {
  const nextRank = getNextRank(user);
  if (!nextRank) return 100; // User is at max rank
  
  const currentRank = RANKS.find(rank => rank.name === calculateRank(user.cryptoCoins));
  if (!currentRank) return 0; // This should never happen, but TypeScript doesn't know that
  
  const progress = (user.cryptoCoins - currentRank.threshold) / (nextRank.threshold - currentRank.threshold);
  return Math.min(Math.max(progress * 100, 0), 100); // Ensure it's between 0 and 100
}

export function formatLargeNumber(num: number): string {
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg', 'Uvg'];
  let suffixIndex = 0;
  
  while (num >= 1000 && suffixIndex < suffixes.length - 1) {
    num /= 1000;
    suffixIndex++;
  }
  
  return num.toFixed(3) + suffixes[suffixIndex];
}

export function calculateTotalWorth(user: User, globalStats: GlobalStats): number {
  const businessesWorth = user.businesses.reduce((total, business) => {
    const businessType = business.type as BusinessType;
    const cost = calculateBusinessCost(businessType, business.count);
    return total + cost;
  }, 0);

  const upgradesWorth = user.upgrades.reduce((total, upgrade) => {
    return total + UPGRADES[upgrade.type as UpgradeType].cost;
  }, 0);

  return user.cryptoCoins + businessesWorth + upgradesWorth;
}

export function getLeaderboardPosition(user: User, allUsers: User[]): number {
  const sortedUsers = allUsers.sort((a, b) => b.cryptoCoins - a.cryptoCoins);
  return sortedUsers.findIndex(u => u.id === user.id) + 1;
}

export function mineBlock(user: User, clickPower: number): { updatedCoins: number, updatedFractionalCoins: number } {
  let updatedFractionalCoins = user.fractionalCoins + clickPower;
  let updatedCoins = user.cryptoCoins + Math.floor(updatedFractionalCoins);
  updatedFractionalCoins = updatedFractionalCoins % 1;

  return {
    updatedCoins,
    updatedFractionalCoins
  };
}