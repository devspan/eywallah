import { User, Business, Upgrade, BusinessType, UpgradeType } from '@/types';
import { logger } from '@/lib/logger';

export const PRESTIGE_COST = 1e6; // 1 million coins to prestige

export const BUSINESSES: Record<BusinessType, Business> = {
  gpuMiner: { name: "GPU Miner", baseCost: 10, baseIncome: 0.1 },
  asicFarm: { name: "ASIC Farm", baseCost: 100, baseIncome: 1 },
  blockchainStartup: { name: "Blockchain Startup", baseCost: 1000, baseIncome: 10 },
  cryptoExchange: { name: "Crypto Exchange", baseCost: 10000, baseIncome: 100 },
  nftMarketplace: { name: "NFT Marketplace", baseCost: 100000, baseIncome: 1000 },
  defiPlatform: { name: "DeFi Platform", baseCost: 1000000, baseIncome: 10000 }
};

export const UPGRADES: Record<UpgradeType, Upgrade> = {
  fasterInternet: { name: "Faster Internet", cost: 1000, effect: 1.1 },
  betterCooling: { name: "Better Cooling", cost: 5000, effect: 1.2 },
  aiOptimization: { name: "AI Optimization", cost: 10000, effect: 1.5 },
  clickUpgrade: { name: "Click Power", cost: 500, effect: 2 },
};

export function calculateIncome(user: User): number {
  logger.debug('Calculating income for user', { userId: user.id });
  let totalIncome = 0;
  for (const business of user.businesses) {
    const businessData = BUSINESSES[business.type];
    if (businessData) {
      totalIncome += businessData.baseIncome * business.count;
    }
  }
  const finalIncome = totalIncome * user.incomeMultiplier * (1 + user.prestigePoints * 0.1);
  logger.debug('Income calculated', { userId: user.id, totalIncome, finalIncome });
  return finalIncome;
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

export function calculateClickPower(user: User): number {
  logger.debug('Calculating click power for user', { userId: user.id });
  let clickPower = 1;
  const clickUpgrade = user.upgrades.find(upgrade => upgrade.type === 'clickUpgrade');
  if (clickUpgrade) {
    clickPower *= UPGRADES.clickUpgrade.effect;
  }
  const finalClickPower = clickPower * user.incomeMultiplier;
  logger.debug('Click power calculated', { userId: user.id, clickPower, finalClickPower });
  return finalClickPower;
}

export function calculatePrestigePoints(coins: number): number {
  logger.debug('Calculating prestige points', { coins });
  const prestigePoints = Math.floor(Math.log10(coins / PRESTIGE_COST));
  logger.debug('Prestige points calculated', { coins, prestigePoints });
  return prestigePoints;
}

export function getBusinessTypes(): BusinessType[] {
  return Object.keys(BUSINESSES) as BusinessType[];
}

export function getUpgradeTypes(): UpgradeType[] {
  return Object.keys(UPGRADES) as UpgradeType[];
}