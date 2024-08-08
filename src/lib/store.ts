// src/lib/store.ts

import { create } from 'zustand';
import { User, BusinessType, UpgradeType } from '@/types';
import { 
  calculateIncome, 
  calculateClickPower,
  calculateBusinessCost,
  calculateUpgradeCost,
  UPGRADES,
  simulateGameTick,
  addBusiness,
  addUpgrade,
  mineBlock
} from '@/lib/gameLogic';
import { logger } from '@/lib/logger';

interface GameState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  income: bigint;
  clickPower: bigint;
  setUser: (user: User) => void;
  updateCoins: (amount: bigint) => void;
  buyBusiness: (businessType: BusinessType) => void;
  buyUpgrade: (upgradeType: UpgradeType) => void;
  syncWithServer: () => Promise<void>;
  updateGame: (timeDifference: number) => void;
  fetchUserData: (telegramId: string, username?: string) => Promise<void>;
  performClick: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  income: BigInt(0),
  clickPower: BigInt(1),
  
  setUser: (user) => {
    try {
      const income = calculateIncome(user);
      const clickPower = calculateClickPower(user);
      set({ user, income, clickPower });
      logger.debug('User set in store', { 
        userId: user.id, 
        income: income.toString(), 
        clickPower: clickPower.toString(),
        cryptoCoins: user.cryptoCoins.toString(),
        businesses: user.businesses,
        upgrades: user.upgrades
      });
    } catch (error) {
      logger.error('Error in setUser', { error, user: JSON.stringify(user) });
      set({ error: 'Failed to set user data.' });
    }
  },

  updateCoins: (amount: bigint) => {
    try {
      set((state) => {
        if (!state.user) return state;
        const newCoins = state.user.cryptoCoins + amount;
        logger.debug('Updating coins', { 
          userId: state.user.id, 
          oldCoins: state.user.cryptoCoins.toString(), 
          newCoins: newCoins.toString(),
          amount: amount.toString()
        });
        const updatedUser = { ...state.user, cryptoCoins: newCoins };
        const newIncome = calculateIncome(updatedUser);
        const newClickPower = calculateClickPower(updatedUser);
        return { 
          user: updatedUser,
          income: newIncome,
          clickPower: newClickPower
        };
      });
      get().syncWithServer();
    } catch (error) {
      logger.error('Error in updateCoins', { error, amount: amount.toString() });
      set({ error: 'Failed to update coins.' });
    }
  },
  

  buyBusiness: (businessType) => {
    try {
      const { user } = get();
      if (!user) return;

      const existingBusiness = user.businesses.find(b => b.type === businessType);
      const currentCount = existingBusiness?.count || 0;
      const cost = calculateBusinessCost(businessType, currentCount);

      if (user.cryptoCoins >= cost) {
        set((state) => {
          if (!state.user) return state;
          const updatedUser = addBusiness(state.user, businessType);
          updatedUser.cryptoCoins -= cost;
          const newIncome = calculateIncome(updatedUser);
          const newClickPower = calculateClickPower(updatedUser);
          logger.debug('Business purchased', { 
            userId: updatedUser.id, 
            businessType, 
            cost: cost.toString(), 
            newCoins: updatedUser.cryptoCoins.toString(),
            newBusinessCount: updatedUser.businesses.find(b => b.type === businessType)?.count
          });
          return {
            user: updatedUser,
            income: newIncome,
            clickPower: newClickPower
          };
        });
        get().syncWithServer();
      } else {
        logger.debug('Insufficient funds for business purchase', { 
          userId: user.id, 
          businessType, 
          cost: cost.toString(), 
          userCoins: user.cryptoCoins.toString() 
        });
      }
    } catch (error) {
      logger.error('Error in buyBusiness', { error, businessType });
      set({ error: 'Failed to purchase business.' });
    }
  },

  buyUpgrade: (upgradeType) => {
    try {
      const { user } = get();
      if (!user) return;

      const upgradeCost = calculateUpgradeCost(upgradeType, user.upgrades);

      if (user.cryptoCoins >= upgradeCost && !user.upgrades.includes(upgradeType)) {
        set((state) => {
          if (!state.user) return state;
          const updatedUser = addUpgrade(state.user, upgradeType);
          updatedUser.cryptoCoins -= upgradeCost;
          const newIncome = calculateIncome(updatedUser);
          const newClickPower = calculateClickPower(updatedUser);
          logger.debug('Upgrade purchased', { 
            userId: updatedUser.id, 
            upgradeType, 
            cost: upgradeCost.toString(), 
            newCoins: updatedUser.cryptoCoins.toString(),
            upgrades: updatedUser.upgrades
          });
          return {
            user: updatedUser,
            income: newIncome,
            clickPower: newClickPower
          };
        });
        get().syncWithServer();
      } else {
        logger.debug('Unable to purchase upgrade', { 
          userId: user.id, 
          upgradeType, 
          cost: upgradeCost.toString(), 
          userCoins: user.cryptoCoins.toString(),
          alreadyOwned: user.upgrades.includes(upgradeType)
        });
      }
    } catch (error) {
      logger.error('Error in buyUpgrade', { error, upgradeType });
      set({ error: 'Failed to purchase upgrade.' });
    }
  },


  syncWithServer: async () => {
    const { user } = get();
    if (!user) {
      logger.debug('No user to sync');
      return;
    }
  
    try {
      logger.debug('Syncing with server', { 
        userId: user.id, 
        coins: user.cryptoCoins.toString(),
        businesses: user.businesses,
        upgrades: user.upgrades
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sync', 
          data: { 
            userId: user.id, 
            cryptoCoins: user.cryptoCoins.toString(),
            businesses: user.businesses,
            upgrades: user.upgrades
          } 
        }),
      });
  
      if (!response.ok) throw new Error('Failed to sync with server');
  
      const updatedUser = await response.json();
      logger.debug('Sync successful', { 
        userId: updatedUser.id, 
        coins: updatedUser.cryptoCoins,
        businesses: updatedUser.businesses,
        upgrades: updatedUser.upgrades
      });
      set((state) => {
        try {
          const newUser = {
            ...updatedUser,
            cryptoCoins: BigInt(updatedUser.cryptoCoins),
            lastActive: new Date(updatedUser.lastActive)
          };
          return { 
            user: newUser,
            income: calculateIncome(newUser),
            clickPower: calculateClickPower(newUser)
          };
        } catch (error) {
          logger.error('Error processing updated user', { error, updatedUser: JSON.stringify(updatedUser) });
          return state;
        }
      });
    } catch (error) {
      logger.error('Failed to sync with server:', error);
      set({ error: 'Failed to sync with server. Please try again.' });
    }
  },

  updateGame: (timeDifference: number) => {
    try {
      set((state) => {
        if (!state.user) return state;
        const updatedUser = simulateGameTick(state.user, new Date(Date.now() - timeDifference));
        logger.debug('Game updated', { 
          userId: updatedUser.id, 
          timeDifference, 
          newCoins: updatedUser.cryptoCoins.toString(),
          businesses: updatedUser.businesses,
          upgrades: updatedUser.upgrades
        });
        return { 
          user: {
            ...updatedUser,
            lastActive: new Date()
          },
          income: calculateIncome(updatedUser),
          clickPower: calculateClickPower(updatedUser)
        };
      });
    } catch (error) {
      logger.error('Error in updateGame', { error, timeDifference });
      set({ error: 'Failed to update game state.' });
    }
  },

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
      logger.debug('User data received', { 
        userId: userData.id, 
        coins: userData.cryptoCoins,
        businesses: userData.businesses,
        upgrades: userData.upgrades
      });
      const user = {
        ...userData,
        cryptoCoins: BigInt(userData.cryptoCoins),
        lastActive: new Date(userData.lastActive)
      };
      set(state => ({
        user,
        income: calculateIncome(user),
        clickPower: calculateClickPower(user),
        isLoading: false
      }));
    } catch (error) {
      logger.error('Error fetching user data', error as Error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  performClick: () => {
    try {
      const { user, clickPower } = get();
      if (!user) return;

      const { updatedUser } = mineBlock(user, clickPower);
      logger.debug('Click performed', { 
        userId: updatedUser.id, 
        clickPower: clickPower.toString(), 
        newCoins: updatedUser.cryptoCoins.toString() 
      });
      set((state) => ({
        user: updatedUser,
        income: calculateIncome(updatedUser),
        clickPower: calculateClickPower(updatedUser)
      }));
      get().syncWithServer();
    } catch (error) {
      logger.error('Error in performClick', { error });
      set({ error: 'Failed to process click.' });
    }
  }
}));