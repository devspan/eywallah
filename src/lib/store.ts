import { create } from 'zustand';
import type { User, BusinessType, UpgradeType, UserBusiness, UserUpgrade } from '@/types';
import { 
  BUSINESSES, 
  UPGRADES, 
  calculateIncome, 
  calculateBusinessCost, 
  calculateClickPower, 
  getCurrentMarketPrice,
  getGlobalStats,
  updateGlobalState,
  performPrestige
} from '@/lib/gameLogic';
import { logger } from '@/lib/logger';

interface GlobalStats {
  blockHeight: number;
  difficulty: number;
  globalHashRate: number;
  marketPrice: number;
}

interface GameState {
  user: User | null;
  localCoins: number;
  income: number;
  clickPower: number;
  offlineEarnings: number;
  marketPrice: number;
  globalStats: GlobalStats;
  setUser: (user: User) => void;
  updateLocalCoins: (amount: number) => void;
  buyBusiness: (businessType: BusinessType) => void;
  buyUpgrade: (upgradeType: UpgradeType) => void;
  syncWithServer: () => Promise<void>;
  updateGlobalStats: () => void;
  prestige: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  user: null,
  localCoins: 0,
  income: 0,
  clickPower: 0,
  offlineEarnings: 0,
  marketPrice: 1,
  globalStats: {
    blockHeight: 0,
    difficulty: 1,
    globalHashRate: 1000,
    marketPrice: 1
  },
  setUser: (user) => {
    const income = calculateIncome(user);
    const clickPower = calculateClickPower(user);
    set({ 
      user, 
      localCoins: user.cryptoCoins, 
      income, 
      clickPower,
      offlineEarnings: user.offlineEarnings 
    });
    logger.debug('User set in store', { userId: user.id, income, clickPower });
  },
  updateLocalCoins: (amount) => set((state) => {
    const newLocalCoins = state.localCoins + amount;
    logger.debug('Updating local coins', { oldAmount: state.localCoins, newAmount: newLocalCoins });
    return { 
      localCoins: newLocalCoins,
      user: state.user ? { ...state.user, cryptoCoins: newLocalCoins } : null
    };
  }),
  buyBusiness: (businessType) => {
    const { user, localCoins } = get();
    if (!user) return;

    const existingBusiness = user.businesses.find(b => b.type === businessType);
    const currentCount = existingBusiness?.count || 0;
    const cost = calculateBusinessCost(businessType, currentCount);

    if (localCoins >= cost) {
      set((state) => {
        let updatedBusinesses: UserBusiness[];
        if (existingBusiness) {
          updatedBusinesses = state.user!.businesses.map(b =>
            b.type === businessType ? { ...b, count: b.count + 1 } : b
          );
        } else {
          updatedBusinesses = [
            ...state.user!.businesses,
            { id: Date.now().toString(), type: businessType, count: 1 }
          ];
        }

        const updatedUser = {
          ...state.user!,
          cryptoCoins: state.localCoins - cost,
          businesses: updatedBusinesses
        };
        const newIncome = calculateIncome(updatedUser);
        const newClickPower = calculateClickPower(updatedUser);
        logger.debug('Business bought', { businessType, newCount: currentCount + 1, newIncome });
        return {
          user: updatedUser,
          localCoins: state.localCoins - cost,
          income: newIncome,
          clickPower: newClickPower
        };
      });
    }
  },
  buyUpgrade: (upgradeType) => {
    const { user, localCoins } = get();
    if (!user) return;

    const upgradeCost = UPGRADES[upgradeType].cost;

    if (localCoins >= upgradeCost && !user.upgrades.some(u => u.type === upgradeType)) {
      set((state) => {
        const updatedUpgrades: UserUpgrade[] = [
          ...state.user!.upgrades,
          { id: Date.now().toString(), type: upgradeType }
        ];

        const updatedUser = {
          ...state.user!,
          cryptoCoins: state.localCoins - upgradeCost,
          upgrades: updatedUpgrades
        };
        const newIncome = calculateIncome(updatedUser);
        const newClickPower = calculateClickPower(updatedUser);
        logger.debug('Upgrade bought', { upgradeType, newIncome, newClickPower });
        return {
          user: updatedUser,
          localCoins: state.localCoins - upgradeCost,
          income: newIncome,
          clickPower: newClickPower
        };
      });
    }
  },
  syncWithServer: async () => {
    const { user, localCoins } = get();
    if (!user) return;

    try {
      logger.debug('Syncing with server', { userId: user.id, localCoins });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', data: { userId: user.id, cryptoCoins: localCoins } }),
      });

      if (!response.ok) throw new Error('Failed to sync with server');

      const updatedUser = await response.json();
      const newIncome = calculateIncome(updatedUser);
      const newClickPower = calculateClickPower(updatedUser);
      logger.debug('Synced with server', { updatedUser, newIncome, newClickPower });
      set({ 
        user: updatedUser, 
        localCoins: updatedUser.cryptoCoins,
        income: newIncome,
        clickPower: newClickPower
      });
    } catch (error) {
      logger.error('Failed to sync with server:', error);
    }
  },
  updateGlobalStats: () => {
    updateGlobalState();
    const newMarketPrice = getCurrentMarketPrice();
    const newGlobalStats = getGlobalStats();
    logger.debug('Updating global stats', { newMarketPrice, newGlobalStats });
    set({ marketPrice: newMarketPrice, globalStats: newGlobalStats });
  },
  prestige: () => {
    const { user } = get();
    if (!user) return;

    const updatedUser = performPrestige(user);
    const newIncome = calculateIncome(updatedUser);
    const newClickPower = calculateClickPower(updatedUser);
    logger.debug('Performing prestige', { oldPrestigePoints: user.prestigePoints, newPrestigePoints: updatedUser.prestigePoints });
    set({
      user: updatedUser,
      localCoins: updatedUser.cryptoCoins,
      income: newIncome,
      clickPower: newClickPower
    });
  }
}));