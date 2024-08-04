import { create } from 'zustand';
import type { User, BusinessType, UpgradeType, UserBusiness, UserUpgrade } from '@/types';
import { BUSINESSES, UPGRADES, calculateIncome, calculateBusinessCost } from '@/lib/gameLogic';

interface GameState {
  user: User | null;
  localCoins: number;
  income: number;
  offlineEarnings: number;
  setUser: (user: User) => void;
  updateLocalCoins: (amount: number) => void;
  buyBusiness: (businessType: BusinessType) => void;
  buyUpgrade: (upgradeType: UpgradeType) => void;
  syncWithServer: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  user: null,
  localCoins: 0,
  income: 0,
  offlineEarnings: 0,
  setUser: (user) => set({ 
    user, 
    localCoins: user.cryptoCoins, 
    income: calculateIncome(user), 
    offlineEarnings: user.offlineEarnings 
  }),
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
        return {
          user: updatedUser,
          localCoins: state.localCoins - cost,
          income: newIncome
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
        return {
          user: updatedUser,
          localCoins: state.localCoins - upgradeCost,
          income: newIncome
        };
      });
    }
  },
  syncWithServer: async () => {
    const { user, localCoins } = get();
    if (!user) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', data: { userId: user.id, cryptoCoins: localCoins } }),
      });

      if (!response.ok) throw new Error('Failed to sync with server');

      const updatedUser = await response.json();
      set({ 
        user: updatedUser, 
        localCoins: updatedUser.cryptoCoins,
        income: calculateIncome(updatedUser) 
      });
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }
}));