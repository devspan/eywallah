// src/lib/store.ts

import { create } from 'zustand';
import { debounce, throttle } from 'lodash';
import { User, BusinessType, UpgradeType, GlobalStats } from '@/types';
import { 
  calculateIncome, 
  calculateClickPower,
  updateGlobalState,
  getInitialGlobalStats,
  calculateMiningReward,
  calculateBusinessCost,
  UPGRADES,
  mineBlock
} from '@/lib/gameLogic';
import { logger } from '@/lib/logger';

interface GameState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  income: bigint;
  clickPower: bigint;
  globalStats: GlobalStats;
  setUser: (user: User) => void;
  updateCoins: (amount: bigint) => void;
  buyBusiness: (businessType: BusinessType) => void;
  buyUpgrade: (upgradeType: UpgradeType) => void;
  syncWithServer: () => Promise<void>;
  updateGlobalGame: () => Promise<void>;
  fetchUserData: (telegramId: string, username?: string) => Promise<void>;
  mineBlock: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  income: BigInt(0),
  clickPower: BigInt(0),
  globalStats: getInitialGlobalStats(),
  
  setUser: (user) => {
    const { globalStats } = get();
    const income = calculateIncome(user, globalStats);
    const clickPower = calculateClickPower(user, globalStats);
    set({ user, income, clickPower });
    logger.debug('User set in store', { userId: user.id, income: income.toString(), clickPower: clickPower.toString() });
  },

  updateCoins: debounce((amount: bigint) => {
    set((state) => {
      if (!state.user) return state;
      const newCoins = state.user.cryptoCoins + amount;
      const updatedUser = { ...state.user, cryptoCoins: newCoins };
      const newIncome = calculateIncome(updatedUser, state.globalStats);
      const newClickPower = calculateClickPower(updatedUser, state.globalStats);
      logger.debug('Updating coins', { 
        userId: state.user.id, 
        oldCoins: state.user.cryptoCoins.toString(), 
        newCoins: updatedUser.cryptoCoins.toString(),
        amount: amount.toString()
      });
      return { 
        user: updatedUser,
        income: newIncome,
        clickPower: newClickPower
      };
    });
    get().syncWithServer();
  }, 1000),

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

  syncWithServer: throttle(async () => {
    const { user } = get();
    if (!user) {
      logger.debug('No user to sync');
      return;
    }
  
    try {
      logger.debug('Syncing with server', { 
        userId: user.id, 
        coins: user.cryptoCoins.toString()
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sync', 
          data: { 
            userId: user.id, 
            cryptoCoins: user.cryptoCoins.toString()
          } 
        }),
      });
  
      if (!response.ok) throw new Error('Failed to sync with server');
  
      const updatedUser = await response.json();
      logger.debug('Sync successful', { updatedUser });
      set((state) => ({ 
        user: {
          ...updatedUser,
          cryptoCoins: BigInt(updatedUser.cryptoCoins)
        },
        income: calculateIncome(updatedUser, state.globalStats),
        clickPower: calculateClickPower(updatedUser, state.globalStats)
      }));
    } catch (error) {
      logger.error('Failed to sync with server:', error);
      set({ error: 'Failed to sync with server. Please try again.' });
    }
  }, 10000, { leading: true, trailing: true }),

  updateGlobalGame: throttle(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateGlobalState' }),
      });

      if (!response.ok) throw new Error('Failed to update global state');

      const newGlobalStats: GlobalStats = await response.json();
      set((state) => {
        if (state.user) {
          return { 
            globalStats: newGlobalStats,
            income: calculateIncome(state.user, newGlobalStats),
            clickPower: calculateClickPower(state.user, newGlobalStats)
          };
        }
        return { globalStats: newGlobalStats };
      });
    } catch (error) {
      logger.error('Failed to update global game state:', error);
      set({ error: 'Failed to update global game state. Please try again.' });
    }
  }, 30000, { leading: true, trailing: true }),

  fetchUserData: async (telegramId: string, username?: string) => {
    set({ isLoading: true, error: null });
    try {
      logger.debug('Fetching user data', { telegramId, username });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'init', 
          data: { telegramId, username }
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const userData = await response.json();
      logger.debug('User data received', userData);
      set(state => ({
        user: {
          ...userData,
          cryptoCoins: BigInt(userData.cryptoCoins)
        },
        income: calculateIncome(userData, state.globalStats),
        clickPower: calculateClickPower(userData, state.globalStats),
        isLoading: false
      }));
    } catch (error) {
      logger.error('Error fetching user data', error as Error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  mineBlock: debounce(() => {
    const { user, globalStats, clickPower } = get();
    if (!user) return;

    const { updatedCoins } = mineBlock(user, clickPower);
    set((state) => {
      const updatedUser = state.user ? { 
        ...state.user, 
        cryptoCoins: updatedCoins
      } : null;
      const updatedGlobalStats = updateGlobalState(state.globalStats);
      
      logger.debug('Mining block', { 
        userId: updatedUser?.id, 
        miningReward: clickPower.toString(), 
        newTotalCoins: updatedCoins.toString()
      });

      return {
        user: updatedUser,
        globalStats: updatedGlobalStats,
        income: updatedUser ? calculateIncome(updatedUser, updatedGlobalStats) : state.income,
        clickPower: updatedUser ? calculateClickPower(updatedUser, updatedGlobalStats) : state.clickPower
      };
    });
    get().syncWithServer();
  }, 100)
}));