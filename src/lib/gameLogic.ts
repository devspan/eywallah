import type { User, Business, Upgrade, BusinessType, UpgradeType } from '@/types';
import { logger } from '@/lib/logger';

export const PRESTIGE_COST = 1e6; // 1 million coins to prestige
export const MAX_TOTAL_SUPPLY = 200e9; // 200 billion max total supply

export const BUSINESSES: Record<BusinessType, Business> = {
  gpuMiner: { name: "GPU Miner", baseCost: 15, baseIncome: 0.01 },
  asicFarm: { name: "ASIC Farm", baseCost: 100, baseIncome: 0.05 },
  blockchainStartup: { name: "Blockchain Startup", baseCost: 1100, baseIncome: 0.2 },
  cryptoExchange: { name: "Crypto Exchange", baseCost: 12000, baseIncome: 1 },
  nftMarketplace: { name: "NFT Marketplace", baseCost: 130000, baseIncome: 5 },
  defiPlatform: { name: "DeFi Platform", baseCost: 1400000, baseIncome: 25 }
};

export const UPGRADES: Record<UpgradeType, Upgrade> = {
  fasterInternet: { name: "Faster Internet", cost: 1000, effect: 1.05 },
  betterCooling: { name: "Better Cooling", cost: 5000, effect: 1.07 },
  aiOptimization: { name: "AI Optimization", cost: 20000, effect: 1.1 },
  clickUpgrade: { name: "Click Power", cost: 500, effect: 1.25 },
};

export const RANKS = [
  { name: "Novice Miner", threshold: 0 },
  { name: "Apprentice Trader", threshold: 1e3 },
  { name: "Crypto Enthusiast", threshold: 1e5 },
  { name: "Blockchain Pioneer", threshold: 1e7 },
  { name: "Digital Asset Manager", threshold: 1e9 },
  { name: "Crypto Mogul", threshold: 1e11 },
  { name: "Blockchain Tycoon", threshold: 1e13 },
  { name: "Crypto Overlord", threshold: 1e15 }
];

export function calculateIncome(user: User): number {
  logger.debug('Calculating income for user', { userId: user.id });
  let totalIncome = 0;
  for (const business of user.businesses) {
    const businessData = BUSINESSES[business.type];
    if (businessData) {
      totalIncome += businessData.baseIncome * business.count;
    }
  }
  
  // Apply upgrades to total income
  for (const upgrade of user.upgrades) {
    if (upgrade.type !== 'clickUpgrade') {
      totalIncome *= UPGRADES[upgrade.type].effect;
    }
  }

  const finalIncome = totalIncome * user.incomeMultiplier * (1 + user.prestigePoints * 0.02);
  logger.debug('Income calculated', { userId: user.id, totalIncome, finalIncome });
  return finalIncome;
}

export function calculateClickPower(user: User): number {
  logger.debug('Calculating click power for user', { userId: user.id });
  let clickPower = 1000; // Reduced base click power
  
  // Apply click upgrade
  const clickUpgrade = user.upgrades.find(upgrade => upgrade.type === 'clickUpgrade');
  if (clickUpgrade) {
    clickPower *= UPGRADES.clickUpgrade.effect;
  }
  
  // Apply other upgrades to click power (reduced effect)
  for (const upgrade of user.upgrades) {
    if (upgrade.type !== 'clickUpgrade') {
      clickPower *= Math.sqrt(UPGRADES[upgrade.type].effect);
    }
  }

  const finalClickPower = clickPower * user.incomeMultiplier * (1 + user.prestigePoints * 0.02);
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
  const totalBusinessIncome = Object.values(BUSINESSES).reduce((total, business) => total + business.baseIncome, 0);
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