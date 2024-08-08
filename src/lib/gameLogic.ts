import { User, BusinessType, UpgradeType, BusinessData, UpgradeData, Achievement, Boost } from '@/types';
import { logger } from '@/lib/logger';
import { memoize } from 'lodash';

// Constants
export const PRESTIGE_COST = BigInt(1_000_000_000); // 1 billion coins to prestige
export const MAX_TOTAL_SUPPLY = BigInt(200_000_000_000); // 200 billion max total supply

export const BUSINESSES: Record<BusinessType, BusinessData> = {
  gpuMiner: { name: "GPU Miner", baseCost: BigInt(1000), baseIncome: BigInt(100) },
  asicFarm: { name: "ASIC Farm", baseCost: BigInt(10000), baseIncome: BigInt(1000) },
  miningPool: { name: "Mining Pool", baseCost: BigInt(100000), baseIncome: BigInt(10000) },
  cryptoExchange: { name: "Crypto Exchange", baseCost: BigInt(1000000), baseIncome: BigInt(100000) },
  nftMarketplace: { name: "NFT Marketplace", baseCost: BigInt(10000000), baseIncome: BigInt(1000000) },
  defiPlatform: { name: "DeFi Platform", baseCost: BigInt(100000000), baseIncome: BigInt(10000000) }
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

export const calculateIncome = memoize((user: User): bigint => {
  try {
    logger.debug('Calculating income for user', { userId: user.id });
    
    let totalIncome = BigInt(0);
    
    for (const business of user.businesses) {
      totalIncome += BUSINESSES[business.type].baseIncome * BigInt(business.count);
    }
    
    // Apply upgrades
    for (const upgrade of user.upgrades) {
      totalIncome = totalIncome * BigInt(UPGRADES[upgrade].effect) / BigInt(100);
    }
    
    const finalIncome = totalIncome * BigInt(Math.floor(user.incomeMultiplier * 100)) / BigInt(100) * 
                        (BigInt(100) + BigInt(user.prestigePoints * 2)) / BigInt(100);
    
    logger.debug('Income calculated', { 
      userId: user.id, 
      totalIncome: totalIncome.toString(), 
      finalIncome: finalIncome.toString() 
    });
    return finalIncome;
  } catch (error) {
    logger.error('Error calculating income', { userId: user.id, error });
    return BigInt(0);
  }
}, (user: User) => user.id);

export function calculateClickPower(user: User): bigint {
  logger.debug('Calculating click power for user', { userId: user.id });
  
  let baseClickPower = BigInt(1);
  
  const hasClickUpgrade = user.upgrades.includes('clickUpgrade');
  if (hasClickUpgrade) {
    baseClickPower = baseClickPower * BigInt(UPGRADES.clickUpgrade.effect) / BigInt(100);
  }
  
  for (const upgrade of user.upgrades) {
    if (upgrade !== 'clickUpgrade') {
      baseClickPower = baseClickPower * BigInt(Math.floor(Math.sqrt(UPGRADES[upgrade].effect / 100) * 100)) / BigInt(100);
    }
  }

  const finalClickPower = baseClickPower * BigInt(Math.floor(user.incomeMultiplier * 100)) / BigInt(100) * 
                          (BigInt(100) + BigInt(user.prestigePoints * 2)) / BigInt(100);

  logger.debug('Click power calculated', { 
    userId: user.id, 
    baseClickPower: baseClickPower.toString(), 
    finalClickPower: finalClickPower.toString()
  });
  return finalClickPower;
}

export function calculateBusinessCost(businessType: BusinessType, currentCount: number): bigint {
  logger.debug('Calculating business cost', { businessType, currentCount });
  const business = BUSINESSES[businessType];
  const cost = business.baseCost * BigInt(Math.floor(Math.pow(1.15, currentCount) * 100)) / BigInt(100);
  logger.debug('Business cost calculated', { businessType, currentCount, cost: cost.toString() });
  return cost;
}

export function calculateUpgradeCost(upgradeType: UpgradeType, userUpgrades: UpgradeType[]): bigint {
  const upgrade = UPGRADES[upgradeType];
  const ownedCount = userUpgrades.filter(u => u === upgradeType).length;
  const cost = upgrade.cost * BigInt(Math.pow(2, ownedCount));
  logger.debug('Upgrade cost calculated', { upgradeType, ownedCount, cost: cost.toString() });
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

export function calculateRank(totalEarnings: bigint): string {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalEarnings >= RANKS[i].threshold) {
      return RANKS[i].name;
    }
  }
  return RANKS[0].name; // Default to the lowest rank
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
      businesses: [...user.businesses, { 
        id: Date.now().toString(), 
        type: businessType, 
        count: 1, 
        lastCalculated: new Date()
      }]
    };
  }
}

export function addUpgrade(user: User, upgradeType: UpgradeType): User {
  if (user.upgrades.includes(upgradeType)) {
    return user;
  }
  return {
    ...user,
    upgrades: [...user.upgrades, upgradeType]
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

  const coinMilestones = [BigInt(1_000_000_000), BigInt(10_000_000_000), BigInt(100_000_000_000)];
  coinMilestones.forEach(milestone => {
    if (user.cryptoCoins >= milestone && !user.achievements.some(a => a.type === `coins${milestone}`)) {
      updatedUser = addAchievement(updatedUser, `coins${milestone.toString()}`);
    }
  });

  const upgradeCount = user.upgrades.length;
  if (upgradeCount >= 5 && !user.achievements.some(a => a.type === 'upgrades5')) {
    updatedUser = addAchievement(updatedUser, 'upgrades5');
  }
  if (upgradeCount >= 10 && !user.achievements.some(a => a.type === 'upgrades10')) {
    updatedUser = addAchievement(updatedUser, 'upgrades10');
  }

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

export function calculateOfflineEarnings(user: User, currentTime: Date): bigint {
  logger.debug('Calculating offline earnings', { userId: user.id });
  
  let totalOfflineEarnings = BigInt(0);
  
  for (const business of user.businesses) {
    const elapsedSeconds = (currentTime.getTime() - business.lastCalculated.getTime()) / 1000;
    const businessIncome = BUSINESSES[business.type].baseIncome * BigInt(business.count);
    const offlineEarnings = businessIncome * BigInt(Math.floor(elapsedSeconds));
    totalOfflineEarnings += offlineEarnings;
  }
  
  // Apply upgrades and multipliers
  for (const upgrade of user.upgrades) {
    totalOfflineEarnings = totalOfflineEarnings * BigInt(UPGRADES[upgrade].effect) / BigInt(100);
  }
  
  totalOfflineEarnings = totalOfflineEarnings * BigInt(Math.floor(user.incomeMultiplier * 100)) / BigInt(100) * 
                         (BigInt(100) + BigInt(user.prestigePoints * 2)) / BigInt(100);
  
  logger.debug('Offline earnings calculated', { 
    userId: user.id, 
    totalOfflineEarnings: totalOfflineEarnings.toString() 
  });
  
  return totalOfflineEarnings;
}

export function simulateGameTick(user: User, currentTime: Date): User {
  logger.debug('Starting game tick simulation', { userId: user.id });

  const offlineEarnings = calculateOfflineEarnings(user, currentTime);
  const updatedCoins = user.cryptoCoins + offlineEarnings;

  const updatedUser = {
    ...user,
    cryptoCoins: updatedCoins,
    lastActive: currentTime,
    businesses: user.businesses.map(business => ({
      ...business,
      lastCalculated: currentTime
    }))
  };

  return checkAndAddAchievements(updatedUser);
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
  return num.toLocaleString();
}

export function calculateTotalWorth(user: User): bigint {
  const businessesWorth = user.businesses.reduce((total, business) => {
    const businessType = business.type as BusinessType;
    const cost = calculateBusinessCost(businessType, business.count);
    return total + cost;
  }, BigInt(0));

  const upgradesWorth = user.upgrades.reduce((total, upgrade) => {
    return total + UPGRADES[upgrade].cost;
  }, BigInt(0));

  return user.cryptoCoins + businessesWorth + upgradesWorth;
}

export function mineBlock(user: User, clickPower: bigint): { updatedUser: User } {
  const minedCoins = clickPower;
  const updatedUser = {
    ...user,
    cryptoCoins: user.cryptoCoins + minedCoins
  };
  return { updatedUser };
}

export function getLeaderboardPosition(user: User, allUsers: User[]): number {
  const sortedUsers = allUsers.sort((a, b) => (b.cryptoCoins > a.cryptoCoins ? 1 : -1));
  return sortedUsers.findIndex(u => u.id === user.id) + 1;
}

export function calculateEstimatedTimeToGoal(user: User, goalCoins: bigint): number {
  const income = calculateIncome(user);
  if (income === BigInt(0)) return Infinity;
  
  const remainingCoins = goalCoins > user.cryptoCoins ? goalCoins - user.cryptoCoins : BigInt(0);
  return Number(remainingCoins / income);
}

export function calculateMaxAffordableCount(user: User, businessType: BusinessType): number {
  let count = 0;
  let totalCost = BigInt(0);
  
  while (true) {
    const nextCost = calculateBusinessCost(businessType, count);
    if (totalCost + nextCost > user.cryptoCoins) break;
    totalCost += nextCost;
    count++;
  }
  
  return count;
}

export function buyMaxBusinesses(user: User, businessType: BusinessType): User {
  const maxAffordableCount = calculateMaxAffordableCount(user, businessType);
  let updatedUser = user;
  let totalCost = BigInt(0);
  
  for (let i = 0; i < maxAffordableCount; i++) {
    const cost = calculateBusinessCost(businessType, updatedUser.businesses.find(b => b.type === businessType)?.count || 0);
    totalCost += cost;
    updatedUser = addBusiness(updatedUser, businessType);
  }
  
  updatedUser.cryptoCoins -= totalCost;
  return updatedUser;
}

export function calculateBoostDuration(user: User): number {
  // Base duration of 5 minutes
  let duration = 5 * 60;
  
  // Add 10 seconds for each business owned
  duration += user.businesses.reduce((total, business) => total + business.count * 10, 0);
  
  // Add 30 seconds for each upgrade owned
  duration += user.upgrades.length * 30;
  
  // Add 1 minute for each prestige point
  duration += user.prestigePoints * 60;
  
  return duration;
}

export function applyBoost(user: User, boostMultiplier: number, duration: number): User {
  const newBoost: Boost = {
    multiplier: boostMultiplier,
    endTime: new Date(Date.now() + duration * 1000),
    id: ''
  };

  return {
    ...user,
    boosts: [...(user.boosts || []), newBoost]
  };
}

export function cleanExpiredBoosts(user: User): User {
  const currentTime = new Date();
  return {
    ...user,
    boosts: (user.boosts || []).filter(boost => boost.endTime > currentTime)
  };
}

export function calculateTotalBoostMultiplier(user: User): number {
  const currentTime = new Date();
  return (user.boosts || []).reduce((total, boost) => {
    if (boost.endTime > currentTime) {
      return total * boost.multiplier;
    }
    return total;
  }, 1);
}

export function calculateIdleTime(user: User, currentTime: Date): number {
  return Math.floor((currentTime.getTime() - user.lastActive.getTime()) / 1000);
}

export function simulateIdleEarnings(user: User, currentTime: Date): User {
  const idleTime = calculateIdleTime(user, currentTime);
  const idleEarnings = calculateOfflineEarnings(user, currentTime);
  
  return {
    ...user,
    cryptoCoins: user.cryptoCoins + idleEarnings,
    lastActive: currentTime
  };
}

export function calculateAllTimeEarnings(user: User): bigint {
  return user.cryptoCoins + BigInt(user.prestigePoints) * PRESTIGE_COST;
}

export function resetUserProgress(user: User): User {
  return {
    ...user,
    cryptoCoins: BigInt(0),
    businesses: [],
    upgrades: [],
    lastActive: new Date(),
    boosts: []
  };
}

export function calculatePrestigeRewards(user: User): { prestigePoints: number, bonusMultiplier: number } {
  const newPrestigePoints = calculatePrestigePoints(user.cryptoCoins);
  const bonusMultiplier = 1 + newPrestigePoints * 0.1; // 10% increase per prestige point
  
  return {
    prestigePoints: newPrestigePoints,
    bonusMultiplier
  };
}