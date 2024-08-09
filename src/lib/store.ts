// src/lib/store.ts

import { create } from 'zustand';
import { User, BusinessType, UpgradeType } from '@/types';
import { 
  calculateIncome, 
  calculateClickPower,
  calculateBusinessCost,
  calculateUpgradeCost,
  UPGRADES,
  formatLargeNumber
} from '@/lib/gameLogic';
import { logger } from '@/lib/logger';

interface GameState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  income: bigint;
  clickPower: bigint;
  setUser: (user: User) => void;
  syncWithServer: () => Promise<void>;
  fetchUserData: (telegramId: string, username?: string) => Promise<void>;
  performClick: () => Promise<void>;
  buyBusiness: (businessType: BusinessType) => Promise<void>;
  buyUpgrade: (upgradeType: UpgradeType) => Promise<void>;
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
          data: { userId: user.id } 
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
            income: BigInt(updatedUser.income),
            clickPower: BigInt(updatedUser.clickPower)
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
      set({
        user,
        income: BigInt(userData.income),
        clickPower: BigInt(userData.clickPower),
        isLoading: false
      });
    } catch (error) {
      logger.error('Error fetching user data', error as Error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  performClick: async () => {
    try {
      const { user } = get();
      if (!user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'mineBlock', 
          data: { userId: user.id } 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform click');
      }

      const updatedUser = await response.json();
      logger.debug('Click performed', { 
        userId: updatedUser.id, 
        clickPower: updatedUser.clickPower, 
        newCoins: updatedUser.cryptoCoins 
      });
      set({
        user: {
          ...updatedUser,
          cryptoCoins: BigInt(updatedUser.cryptoCoins),
          lastActive: new Date(updatedUser.lastActive)
        },
        income: BigInt(updatedUser.income),
        clickPower: BigInt(updatedUser.clickPower)
      });
    } catch (error) {
      logger.error('Error in performClick', { error });
      set({ error: 'Failed to process click.' });
    }
  },

  buyBusiness: async (businessType: BusinessType) => {
    try {
      const { user } = get();
      if (!user) {
        logger.error('Cannot buy business: User is null');
        return;
      }

      logger.debug('Initiating business purchase', { userId: user.id, businessType });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'buyBusiness', 
          data: { 
            userId: user.id, 
            businessType 
          } 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to purchase business');
      }

      const updatedUser = await response.json();
      logger.debug('Business purchase successful', { 
        userId: updatedUser.id, 
        businessType, 
        newCoins: updatedUser.cryptoCoins,
        newBusinessCount: updatedUser.businesses.find((b: any) => b.type === businessType)?.count
      });

      set({
        user: {
          ...updatedUser,
          cryptoCoins: BigInt(updatedUser.cryptoCoins),
          offlineEarnings: BigInt(updatedUser.offlineEarnings)
        },
        income: BigInt(updatedUser.income),
        clickPower: BigInt(updatedUser.clickPower)
      });
    } catch (error) {
      logger.error('Error in buyBusiness', { error, businessType });
      set({ error: 'Failed to purchase business.' });
    }
  },
  
  buyUpgrade: async (upgradeType: UpgradeType) => {
    try {
      const { user } = get();
      if (!user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'buyUpgrade', 
          data: { 
            userId: user.id, 
            upgradeType 
          } 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to purchase upgrade');
      }

      const updatedUser = await response.json();
      logger.debug('Upgrade purchased', { 
        userId: updatedUser.id, 
        upgradeType, 
        newCoins: updatedUser.cryptoCoins,
        upgrades: updatedUser.upgrades
      });
      set({
        user: {
          ...updatedUser,
          cryptoCoins: BigInt(updatedUser.cryptoCoins),
          offlineEarnings: BigInt(updatedUser.offlineEarnings)
        },
        income: BigInt(updatedUser.income),
        clickPower: BigInt(updatedUser.clickPower)
      });
    } catch (error) {
      logger.error('Error in buyUpgrade', { error, upgradeType });
      set({ error: 'Failed to purchase upgrade.' });
    }
  },
}));