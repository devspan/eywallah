import { User, BusinessType, UpgradeType, BusinessData, UpgradeData, Achievement, GlobalStats } from '@/types';
import { logger } from '@/lib/logger';
import { debounce } from 'lodash';

// Constants
export const PRESTIGE_COST = BigInt(1_000_000_000); // 1 billion coins to prestige
export const MAX_TOTAL_SUPPLY = BigInt(200_000_000_000); // 200 billion max total supply
export const INITIAL_BLOCK_REWARD = BigInt(5000); // Initial block reward
export const HALVING_INTERVAL = 2_100_000; // Number of blocks between halvings
export const INITIAL_MINING_DIFFICULTY = 1;
export const TARGET_BLOCK_TIME = 600; // 10 minutes in seconds
export const DIFFICULTY_ADJUSTMENT_INTERVAL = 2016; // Number of blocks between difficulty adjustments

export const BUSINESSES: Record<BusinessType, BusinessData> = {
  gpuMiner: { name: "GPU Miner", baseCost: BigInt(1000), baseHashRate: 100 },
  asicFarm: { name: "ASIC Farm", baseCost: BigInt(10000), baseHashRate: 1000 },
  miningPool: { name: "Mining Pool", baseCost: BigInt(100000), baseHashRate: 10000 },
  cryptoExchange: { name: "Crypto Exchange", baseCost: BigInt(1000000), baseTransactionFee: 100 },
  nftMarketplace: { name: "NFT Marketplace", baseCost: BigInt(10000000), baseTransactionFee: 2500 },
  defiPlatform: { name: "DeFi Platform", baseCost: BigInt(100000000), baseStakingReward: 100 }
};

export const UPGRADES: Record<UpgradeType, UpgradeData> = {
  fasterInternet: { name: "Faster Internet", cost: BigInt(100000), effect: 105 },
  betterCooling: { name: "Better Cooling", cost: BigInt(500000), effect: 107 },
  aiOptimization: { name: "AI Optimization", cost: BigInt(2000000), effect: 110 },
  quantumMining: { name: "Quantum Mining", cost: BigInt(100000000), effect: 200 },
  clickUpgrade: { name: "Click Power", cost: BigInt(50000), effect: 125 },
};

export const RANKS = [
  { name: "Novice Miner", threshold: BigInt(0) },
  { name: "Blockchain Pioneer", threshold: BigInt(1_000_000_000) },
  { name: "Crypto Enthusiast", threshold: BigInt(10_000_000_000) },
  { name: "Mining Magnate", threshold: BigInt(100_000_000_000) },
  { name: "Blockchain Tycoon", threshold: BigInt(1_000_000_000_000) },
  { name: "Crypto Whale", threshold: BigInt(10_000_000_000_000) },
  { name: "Digital Asset Mogul", threshold: BigInt(100_000_000_000_000) },
  { name: "Crypto Overlord", threshold: BigInt(1_000_000_000_000_000) }
];

export function calculateIncome(user: User, globalStats: GlobalStats): bigint {
  logger.debug('Calculating income for user', { userId: user.id });
  
  const miningIncome = calculateMiningReward(user, globalStats);
  const transactionFees = calculateTransactionFees(user, globalStats);
  const stakingRewards = calculateStakingRewards(user, globalStats);
  
  const totalIncome = (miningIncome + transactionFees + stakingRewards) * BigInt(Math.floor(globalStats.coinMarketPrice));
  const finalIncome = totalIncome * BigInt(Math.floor(user.incomeMultiplier * 100)) / BigInt(100) * 
                      (BigInt(100) + BigInt(user.prestigePoints * 2)) / BigInt(100);
  
  logger.debug('Income calculated', { 
    userId: user.id, 
    miningIncome: miningIncome.toString(), 
    transactionFees: transactionFees.toString(), 
    stakingRewards: stakingRewards.toString(), 
    totalIncome: totalIncome.toString(), 
    finalIncome: finalIncome.toString() 
  });
  return finalIncome;
}

export function calculateMiningReward(user: User, globalStats: GlobalStats): bigint {
  const blockReward = INITIAL_BLOCK_REWARD / BigInt(Math.pow(2, Math.floor(globalStats.blockHeight / HALVING_INTERVAL)));
  const userHashRate = calculateUserHashRate(user);
  const miningProbability = Number(userHashRate) / globalStats.networkHashRate;
  
  const reward = blockReward * BigInt(Math.floor(miningProbability * 1e6)) / BigInt(1e6);
  
  logger.debug('Mining reward calculated', { 
    userId: user.id, 
    reward: reward.toString(), 
    blockReward: blockReward.toString(), 
    userHashRate: userHashRate.toString(), 
    networkHashRate: globalStats.networkHashRate 
  });
  return reward;
}

function calculateTransactionFees(user: User, globalStats: GlobalStats): bigint {
  let fees = BigInt(0);
  for (const business of user.businesses) {
    const businessData = BUSINESSES[business.type];
    if ('baseTransactionFee' in businessData) {
      fees += BigInt(businessData.baseTransactionFee as number) * BigInt(business.count) * 
              BigInt(globalStats.mempool) * BigInt(1) / BigInt(10000);
    }
  }
  return fees;
}

function calculateStakingRewards(user: User, globalStats: GlobalStats): bigint {
  const defiPlatform = user.businesses.find(b => b.type === 'defiPlatform');
  if (!defiPlatform) return BigInt(0);
  
  const businessData = BUSINESSES.defiPlatform;
  if ('baseStakingReward' in businessData) {
    const baseReward = BigInt(businessData.baseStakingReward as number);
    return baseReward * BigInt(defiPlatform.count) * user.cryptoCoins / BigInt(10);
  }
  return BigInt(0);
}

export function calculateUserHashRate(user: User): bigint {
  let totalHashRate = BigInt(0);
  for (const business of user.businesses) {
    const businessData = BUSINESSES[business.type];
    if ('baseHashRate' in businessData) {
      totalHashRate += BigInt(businessData.baseHashRate as number) * BigInt(business.count);
    }
  }
  
  // Apply upgrades to hash rate
  for (const upgrade of user.upgrades) {
    if (upgrade.type !== 'clickUpgrade') {
      totalHashRate = totalHashRate * BigInt(UPGRADES[upgrade.type].effect) / BigInt(100);
    }
  }
  
  return totalHashRate;
}

export function calculateClickPower(user: User, globalStats: GlobalStats): bigint {
  logger.debug('Calculating click power for user', { userId: user.id });
  
  // Set base click power to 1
  let baseClickPower = BigInt(1);
  
  // Apply click upgrade
  const clickUpgrade = user.upgrades.find(upgrade => upgrade.type === 'clickUpgrade');
  if (clickUpgrade) {
    baseClickPower = baseClickPower * BigInt(UPGRADES.clickUpgrade.effect) / BigInt(100);
  }
  
  // Apply other upgrades to click power (reduced effect)
  for (const upgrade of user.upgrades) {
    if (upgrade.type !== 'clickUpgrade') {
      baseClickPower = baseClickPower * BigInt(Math.floor(Math.sqrt(UPGRADES[upgrade.type].effect / 100) * 100)) / BigInt(100);
    }
  }

  // Apply user's income multiplier and prestige points
  const finalClickPower = baseClickPower * BigInt(Math.floor(user.incomeMultiplier * 100)) / BigInt(100) * 
                          (BigInt(100) + BigInt(user.prestigePoints * 2)) / BigInt(100);
  
  // Apply current market price
  const clickPowerValue = finalClickPower * BigInt(Math.floor(globalStats.coinMarketPrice));

  logger.debug('Click power calculated', { 
    userId: user.id, 
    baseClickPower: baseClickPower.toString(), 
    finalClickPower: finalClickPower.toString(), 
    clickPowerValue: clickPowerValue.toString() 
  });
  return clickPowerValue;
}

export function calculateBusinessCost(businessType: BusinessType, currentCount: number): bigint {
  logger.debug('Calculating business cost', { businessType, currentCount });
  const business = BUSINESSES[businessType];
  const cost = business.baseCost * BigInt(Math.floor(Math.pow(1.15, currentCount) * 100)) / BigInt(100);
  logger.debug('Business cost calculated', { businessType, currentCount, cost: cost.toString() });
  return cost;
}

export function calculatePrestigePoints(coins: bigint): number {
  logger.debug('Calculating prestige points', { coins: coins.toString() });
  const prestigePoints = Math.floor(Number(coins / PRESTIGE_COST));
  logger.debug('Prestige points calculated', { coins: coins.toString(), prestigePoints });
  return Math.max(0, prestigePoints);
}

export function getBusinessTypes(): BusinessType[] {
  return Object.keys(BUSINESSES) as BusinessType[];
}

export function getUpgradeTypes(): UpgradeType[] {
  return Object.keys(UPGRADES) as UpgradeType[];
}

export function estimateTotalSupply(user: User): bigint {
  const totalBusinessIncome = Object.values(BUSINESSES).reduce((total, business) => {
    if ('baseHashRate' in business) {
      return total + BigInt(business.baseHashRate as number);
    }
    return total;
  }, BigInt(0));
  const maxUpgradeEffect = Object.values(UPGRADES).reduce((max, upgrade) => Math.max(max, upgrade.effect), 100);
  const maxPrestigeEffect = BigInt(100) + (MAX_TOTAL_SUPPLY / PRESTIGE_COST) * BigInt(2);
  
  const theoreticalMaxIncomePerSecond = totalBusinessIncome * BigInt(maxUpgradeEffect) / BigInt(100) * maxPrestigeEffect / BigInt(100);
  const estimatedTotalSupply = user.cryptoCoins + (theoreticalMaxIncomePerSecond * BigInt(365 * 24 * 60 * 60)); // Estimate for a year

  return estimatedTotalSupply > MAX_TOTAL_SUPPLY ? MAX_TOTAL_SUPPLY : estimatedTotalSupply;
}

export function calculateRank(totalEarnings: bigint): string {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalEarnings >= RANKS[i].threshold) {
      return RANKS[i].name;
    }
  }
  return RANKS[0].name; // Default to the lowest rank
}

export function estimateTimeToExhaustSupply(currentSupply: bigint, incomePerSecond: bigint): string {
  const remainingSupply = MAX_TOTAL_SUPPLY - currentSupply;
  const secondsToExhaust = Number(remainingSupply / incomePerSecond);
  
  const years = Math.floor(secondsToExhaust / (365 * 24 * 60 * 60));
  const months = Math.floor((secondsToExhaust % (365 * 24 * 60 * 60)) / (30 * 24 * 60 * 60));
  const days = Math.floor((secondsToExhaust % (30 * 24 * 60 * 60)) / (24 * 60 * 60));

  return `${years} years, ${months} months, and ${days} days`;
}

export function updateGlobalState(currentStats: GlobalStats): GlobalStats {
  const newStats: GlobalStats = {
    id: currentStats.id,
    blockHeight: currentStats.blockHeight + 1,
    difficulty: calculateNetworkDifficulty(currentStats),
    globalHashRate: Math.floor(currentStats.globalHashRate * 1.0001),
    lastBlockTime: new Date(),
    networkHashRate: Math.floor(currentStats.globalHashRate * (0.9 + Math.random() * 0.2)),
    mempool: Math.max(0, currentStats.mempool - 1000 + Math.floor(Math.random() * 2000)),
    coinMarketPrice: simulateMarketFluctuation(currentStats.coinMarketPrice),
  };

  return newStats;
}

export function getCurrentMarketPrice(globalStats: GlobalStats): number {
  return globalStats.coinMarketPrice;
}

export function getInitialGlobalStats(): GlobalStats {
  return {
    id: 'global', 
    blockHeight: 0,
    difficulty: INITIAL_MINING_DIFFICULTY,
    globalHashRate: 1000,
    lastBlockTime: new Date(),
    networkHashRate: 1000,
    mempool: 0,
    coinMarketPrice: 100 // Start with a non-zero market price
  };
}

export function calculateUpgradeCost(upgradeType: UpgradeType): bigint {
  return UPGRADES[upgradeType].cost;
}

export function canAfford(user: User, cost: bigint): boolean {
  return user.cryptoCoins >= cost;
}

export function applyPurchaseCost(user: User, cost: bigint): User {
  return {
    ...user,
    cryptoCoins: user.cryptoCoins - cost
  };
}

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

export function performPrestige(user: User): User {
  const newPrestigePoints = calculatePrestigePoints(user.cryptoCoins);
  return {
    ...user,
    cryptoCoins: BigInt(0),
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
  const coinMilestones = [BigInt(1_000_000_000), BigInt(10_000_000_000), BigInt(100_000_000_000)];
  coinMilestones.forEach(milestone => {
    if (user.cryptoCoins >= milestone && !user.achievements.some(a => a.type === `coins${milestone}`)) {
      updatedUser = addAchievement(updatedUser, `coins${milestone.toString()}`);
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
  const income = calculateIncome(user, globalStats) * BigInt(elapsedSeconds);
  
  // Update user's crypto coins
  let updatedCoins = user.cryptoCoins + income;
  
  let updatedUser = {
    ...user,
    cryptoCoins: updatedCoins
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

export function calculateOfflineProgress(user: User, globalStats: GlobalStats, offlineTime: number): {user: User, globalStats: GlobalStats, offlineEarnings: bigint} {
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
    cryptoCoins: BigInt(0),
    businesses: [],
    upgrades: [],
    prestigePoints: user.prestigePoints + newPrestigePoints,
    incomeMultiplier: 1 + (user.prestigePoints + newPrestigePoints) * 0.1
  };
}

export function canPrestige(user: User): boolean {
  return user.cryptoCoins >= PRESTIGE_COST;
}

export function getNextRank(user: User): { name: string; threshold: bigint } | null {
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
  
  const progress = Number((user.cryptoCoins - currentRank.threshold) * BigInt(100) / (nextRank.threshold - currentRank.threshold));
  return Math.min(Math.max(progress, 0), 100); // Ensure it's between 0 and 100
}

export function formatLargeNumber(num: bigint): string {
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg', 'Uvg'];
  let suffixIndex = 0;
  
  let numStr = num.toString();
  while (numStr.length > 3 && suffixIndex < suffixes.length - 1) {
    numStr = numStr.slice(0, -3);
    suffixIndex++;
  }
  
  const formattedNum = Number(numStr) / 1000;
  return formattedNum.toFixed(3) + suffixes[suffixIndex];
}

export function calculateTotalWorth(user: User, globalStats: GlobalStats): bigint {
  const businessesWorth = user.businesses.reduce((total, business) => {
    const businessType = business.type as BusinessType;
    const cost = calculateBusinessCost(businessType, business.count);
    return total + cost;
  }, BigInt(0));

  const upgradesWorth = user.upgrades.reduce((total, upgrade) => {
    return total + UPGRADES[upgrade.type as UpgradeType].cost;
  }, BigInt(0));

  return user.cryptoCoins + businessesWorth + upgradesWorth;
}

export function getLeaderboardPosition(user: User, allUsers: User[]): number {
  const sortedUsers = allUsers.sort((a, b) => (b.cryptoCoins > a.cryptoCoins) ? 1 : -1);
  return sortedUsers.findIndex(u => u.id === user.id) + 1;
}

export const debouncedMineBlock = debounce((user: User, clickPower: bigint): { updatedCoins: bigint } => {
  logger.debug('Debounced mineBlock called', { userId: user.id, clickPower: clickPower.toString() });
  const updatedCoins = user.cryptoCoins + clickPower;
  return { updatedCoins };
}, 100); // 100ms debounce

export const debouncedUpdateGlobalState = debounce((currentStats: GlobalStats): GlobalStats => {
  logger.debug('Debounced updateGlobalState called');
  return updateGlobalState(currentStats);
}, 5000); // 5 second debounce

export const debouncedSimulateGameTick = debounce((user: User, globalStats: GlobalStats, elapsedSeconds: number): {user: User, globalStats: GlobalStats} => {
  logger.debug('Debounced simulateGameTick called', { userId: user.id, elapsedSeconds });
  return simulateGameTick(user, globalStats, elapsedSeconds);
}, 1000); // 1 second debounce

export function applyUpgradeEffect(baseValue: bigint, upgrade: UpgradeData): bigint {
  return baseValue * BigInt(upgrade.effect) / BigInt(100);
}

export function calculateTotalUpgradeEffect(user: User): number {
  return user.upgrades.reduce((total, upgrade) => {
    const upgradeData = UPGRADES[upgrade.type as UpgradeType];
    return total * (upgradeData.effect / 100);
  }, 1);
}

export function simulateMarketFluctuation(currentPrice: number): number {
  const fluctuationPercent = (Math.random() - 0.5) * 0.05; // -2.5% to +2.5%
  return Math.max(1, Math.floor(currentPrice * (1 + fluctuationPercent)));
}

export function calculateNetworkDifficulty(globalStats: GlobalStats): number {
  if (globalStats.blockHeight % DIFFICULTY_ADJUSTMENT_INTERVAL === 0) {
    const timeElapsed = new Date().getTime() - globalStats.lastBlockTime.getTime();
    const expectedTime = DIFFICULTY_ADJUSTMENT_INTERVAL * TARGET_BLOCK_TIME * 1000;
    const newDifficulty = Math.floor(globalStats.difficulty * expectedTime / timeElapsed);
    return Math.max(INITIAL_MINING_DIFFICULTY, newDifficulty);
  }
  return globalStats.difficulty;
}

export function mineBlock(user: User, clickPower: bigint): { updatedCoins: bigint } {
  logger.debug('Mining block', { userId: user.id, clickPower: clickPower.toString() });
  const updatedCoins = user.cryptoCoins + clickPower;
  return { updatedCoins };
}

logger.debug('gameLogic.ts loaded and initialized');

export type { GlobalStats };
