import { create } from 'zustand';
import { User, BusinessType, UpgradeType, UserBusiness, UserUpgrade } from '@/types';
import { 
  BUSINESSES, 
  UPGRADES, 
  calculateIncome, 
  calculateBusinessCost, 
  calculateClickPower,
  getCurrentMarketPrice,
  getGlobalStats,
  updateGlobalState
} from '@/lib/gameLogic';
import { logger } from '@/lib/logger';

interface GlobalStats {
  blockHeight: number;
  difficulty: number;
  globalHashRate: number;
}

interface GameState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  localCoins: number;
  income: number;
  clickPower: number;
  marketPrice: number;
  globalStats: GlobalStats;
  setUser: (user: User) => void;
  updateLocalCoins: (amount: number) => void;
  buyBusiness: (businessType: BusinessType) => void;
  buyUpgrade: (upgradeType: UpgradeType) => void;
  syncWithServer: () => Promise<void>;
  updateGlobalGame: () => void;
  fetchUserData: (telegramId: string, username?: string) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  localCoins: 0,
  income: 0,
  clickPower: 0,
  marketPrice: 1,
  globalStats: {
    blockHeight: 0,
    difficulty: 1,
    globalHashRate: 1000,
  },
  setUser: (user) => {
    const income = calculateIncome(user);
    const clickPower = calculateClickPower(user);
    set({ user, localCoins: user.cryptoCoins, income, clickPower });
    logger.debug('User set in store', { userId: user.id, income, clickPower });
  },
  updateLocalCoins: (amount) => set((state) => ({ 
    localCoins: state.localCoins + amount,
    user: state.user ? { ...state.user, cryptoCoins: state.user.cryptoCoins + amount } : null
  })),
  buyBusiness: (businessType) => {
    const { user, localCoins } = get();
    if (!user) return;

    const existingBusiness = user.businesses.find(b => b.type === businessType);
    const currentCount = existingBusiness?.count || 0;
    const cost = calculateBusinessCost(businessType, currentCount);

    if (localCoins >= cost) {
      set((state) => {
        const updatedBusinesses = existingBusiness
          ? state.user!.businesses.map(b => b.type === businessType ? { ...b, count: b.count + 1 } : b)
          : [...state.user!.businesses, { id: Date.now().toString(), type: businessType, count: 1 }];

        const updatedUser = {
          ...state.user!,
          cryptoCoins: state.localCoins - cost,
          businesses: updatedBusinesses
        };
        const newIncome = calculateIncome(updatedUser);
        const newClickPower = calculateClickPower(updatedUser);
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
        const updatedUpgrades = [
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
    if (!user) {
      logger.debug('No user to sync');
      return;
    }
  
    try {
      logger.debug('Syncing with server', { userId: user.id, localCoins });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sync', 
          data: { userId: user.id, cryptoCoins: Math.floor(localCoins) } 
        }),
      });
  
      if (!response.ok) throw new Error('Failed to sync with server');
  
      const updatedUser = await response.json();
      logger.debug('Sync successful', { updatedUser });
      set({ 
        user: updatedUser,
        localCoins: updatedUser.cryptoCoins,
        income: updatedUser.income,
        clickPower: updatedUser.clickPower
      });
    } catch (error) {
      logger.error('Failed to sync with server:', error);
    }
  },
  updateGlobalGame: () => {
    updateGlobalState();
    const newMarketPrice = getCurrentMarketPrice();
    const newGlobalStats = getGlobalStats();
    set({ marketPrice: newMarketPrice, globalStats: newGlobalStats });
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
  }
}));