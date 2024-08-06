// src/lib/store.ts

import { create } from 'zustand';
import { User, BusinessType, UpgradeType } from '@/types';
import { 
  BUSINESSES, 
  UPGRADES, 
  calculateIncome, 
  calculateBusinessCost, 
  calculateClickPower,
  getCurrentMarketPrice,
  updateGlobalState,
  getInitialGlobalStats,
  calculateMiningReward,
  GlobalStats
} from '@/lib/gameLogic';
import { logger } from '@/lib/logger';

interface GameState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  income: number;
  clickPower: number;
  globalStats: GlobalStats;
  setUser: (user: User) => void;
  updateCoins: (amount: number) => void;
  buyBusiness: (businessType: BusinessType) => void;
  buyUpgrade: (upgradeType: UpgradeType) => void;
  syncWithServer: () => Promise<void>;
  updateGlobalGame: () => void;
  fetchUserData: (telegramId: string, username?: string) => Promise<void>;
  mineBlock: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  income: 0,
  clickPower: 0,
  globalStats: getInitialGlobalStats(),
  setUser: (user) => {
    const { globalStats } = get();
    const income = calculateIncome(user, globalStats);
    const clickPower = calculateClickPower(user, globalStats);
    set({ user, income, clickPower });
    logger.debug('User set in store', { userId: user.id, income, clickPower });
  },
  updateCoins: (amount) => {
    set((state) => {
      if (!state.user) return state;
      const newCoins = state.user.cryptoCoins + amount;
      const updatedUser = { ...state.user, cryptoCoins: newCoins };
      const newIncome = calculateIncome(updatedUser, state.globalStats);
      const newClickPower = calculateClickPower(updatedUser, state.globalStats);
      return { 
        user: updatedUser,
        income: newIncome,
        clickPower: newClickPower
      };
    });
    get().syncWithServer();
  },
  buyBusiness: (businessType) => {
    const { user, globalStats } = get();
    if (!user) return;

    const existingBusiness = user.businesses.find(b => b.type === businessType);
    const currentCount = existingBusiness?.count || 0;
    const cost = calculateBusinessCost(businessType, currentCount);

    if (user.cryptoCoins >= cost) {
      set((state) => {
        if (!state.user) return state;
        const updatedBusinesses = existingBusiness
          ? state.user.businesses.map(b => b.type === businessType ? { ...b, count: b.count + 1 } : b)
          : [...state.user.businesses, { id: Date.now().toString(), type: businessType, count: 1 }];

        const updatedUser = {
          ...state.user,
          cryptoCoins: state.user.cryptoCoins - cost,
          businesses: updatedBusinesses
        };
        const newIncome = calculateIncome(updatedUser, state.globalStats);
        const newClickPower = calculateClickPower(updatedUser, state.globalStats);
        return {
          user: updatedUser,
          income: newIncome,
          clickPower: newClickPower
        };
      });
      get().syncWithServer();
    }
  },
  buyUpgrade: (upgradeType) => {
    const { user, globalStats } = get();
    if (!user) return;

    const upgradeCost = UPGRADES[upgradeType].cost;

    if (user.cryptoCoins >= upgradeCost && !user.upgrades.some(u => u.type === upgradeType)) {
      set((state) => {
        if (!state.user) return state;
        const updatedUpgrades = [
          ...state.user.upgrades,
          { id: Date.now().toString(), type: upgradeType }
        ];

        const updatedUser = {
          ...state.user,
          cryptoCoins: state.user.cryptoCoins - upgradeCost,
          upgrades: updatedUpgrades
        };
        const newIncome = calculateIncome(updatedUser, state.globalStats);
        const newClickPower = calculateClickPower(updatedUser, state.globalStats);
        return {
          user: updatedUser,
          income: newIncome,
          clickPower: newClickPower
        };
      });
      get().syncWithServer();
    }
  },
  syncWithServer: async () => {
    const { user } = get();
    if (!user) {
      logger.debug('No user to sync');
      return;
    }
  
    try {
      logger.debug('Syncing with server', { userId: user.id, coins: user.cryptoCoins });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sync', 
          data: { userId: user.id, cryptoCoins: Math.floor(user.cryptoCoins) } 
        }),
      });
  
      if (!response.ok) throw new Error('Failed to sync with server');
  
      const updatedUser = await response.json();
      logger.debug('Sync successful', { updatedUser });
      set((state) => ({ 
        user: updatedUser,
        income: calculateIncome(updatedUser, state.globalStats),
        clickPower: calculateClickPower(updatedUser, state.globalStats)
      }));
    } catch (error) {
      logger.error('Failed to sync with server:', error);
    }
  },
  updateGlobalGame: () => {
    set((state) => {
      const newGlobalStats = updateGlobalState(state.globalStats);
      const newMarketPrice = getCurrentMarketPrice(newGlobalStats);
      return { 
        globalStats: newGlobalStats,
        income: state.user ? calculateIncome(state.user, newGlobalStats) : state.income,
        clickPower: state.user ? calculateClickPower(state.user, newGlobalStats) : state.clickPower
      };
    });
  },
  fetchUserData: async (telegramId: string, username?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'init', 
          data: { telegramId, username }
        }),
      });
      if (!response.ok) throw new Error('Failed to fetch user data');
      const userData = await response.json();
      get().setUser(userData);
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  mineBlock: () => {
    const { user, globalStats } = get();
    if (!user) return;

    const miningReward = calculateMiningReward(user, globalStats);
    set((state) => {
      const updatedUser = state.user ? { ...state.user, cryptoCoins: state.user.cryptoCoins + miningReward } : null;
      const updatedGlobalStats: GlobalStats = {
        ...state.globalStats,
        blockHeight: state.globalStats.blockHeight + 1,
        lastBlockTime: new Date(),
        mempool: Math.max(0, state.globalStats.mempool - 1000) // Assume each block clears 1000 transactions
      };
      return {
        user: updatedUser,
        globalStats: updatedGlobalStats,
        income: updatedUser ? calculateIncome(updatedUser, updatedGlobalStats) : state.income,
        clickPower: updatedUser ? calculateClickPower(updatedUser, updatedGlobalStats) : state.clickPower
      };
    });
    get().syncWithServer();
  }
}));