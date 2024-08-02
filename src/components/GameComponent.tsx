// src/components/GameComponent.tsx
"use client"
import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BUSINESSES, UPGRADES, PRESTIGE_COST, calculateIncome, calculateBusinessCost } from '@/lib/gameLogic';
import { User, BusinessType, UpgradeType, GameData } from '@/types';
import { Coins, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { initTelegramAuth, authenticateUser, getColorScheme, getThemeParams, isExpanded, expand } from '@/lib/telegramAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SYNC_INTERVAL = 10000; // 10 seconds
const CLICK_COOLDOWN = 500; // 0.5 seconds

const GameComponent: React.FC = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [localCoins, setLocalCoins] = useState(0);
  const [income, setIncome] = useState(0);
  const [offlineEarnings, setOfflineEarnings] = useState(0);
  const lastClickTimeRef = useRef(0);
  const lastSyncTimeRef = useRef(0);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await initTelegramAuth();
        const user = await authenticateUser();
        setUserId(user.id);
        setTelegramUsername(user.username);

        // Apply Telegram theme
        const colorScheme = getColorScheme();
        const themeParams = getThemeParams();
        document.documentElement.setAttribute('data-theme', colorScheme);
        // Apply theme params to your CSS variables or styling logic here

        // Expand the app if it's not already expanded
        if (!isExpanded()) {
          expand();
        }
      } catch (error) {
        console.error('Failed to initialize Telegram auth:', error);
        toast.error('Failed to initialize Telegram authentication');
      }
    };

    initAuth();
  }, []);

  const { data: user, isLoading: isUserLoading, refetch: refetchUserData } = useQuery<User & { income: number }>({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      const response = await fetch(`${API_URL}/game/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    },
    enabled: !!userId,
  });

  const { data: gameData, isLoading: isGameDataLoading } = useQuery<GameData>({
    queryKey: ['gameData'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/game/data`);
      if (!response.ok) throw new Error('Failed to fetch game data');
      return response.json();
    },
  });

  useEffect(() => {
    if (user) {
      setLocalCoins(user.cryptoCoins);
      setIncome(user.income);
      setOfflineEarnings(user.offlineEarnings);
      if (user.offlineEarnings > 0) {
        toast.success(`Welcome back! You earned ${user.offlineEarnings.toFixed(2)} coins while away.`);
      }
    }
  }, [user]);

  const syncWithServer = useMutation<User & { income: number }, Error, number>({
    mutationFn: async (newCoinBalance: number) => {
      if (!userId) throw new Error('No user ID');
      const response = await fetch(`${API_URL}/game/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, cryptoCoins: newCoinBalance }),
      });
      if (!response.ok) throw new Error('Failed to sync with server');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user', userId], data);
      setIncome(data.income);
      setOfflineEarnings(0); // Reset offline earnings after sync
    },
    onError: () => {
      toast.error("Failed to sync game progress. Please check your connection.");
    },
  });

  useEffect(() => {
    if (user) {
      const incomeTimer = setInterval(() => {
        setLocalCoins(prev => {
          const newCoins = prev + income / 10;
          return Math.round(newCoins * 100) / 100; // Round to 2 decimal places
        });
      }, 100);

      const syncTimer = setInterval(() => {
        const now = Date.now();
        if (now - lastSyncTimeRef.current >= SYNC_INTERVAL) {
          lastSyncTimeRef.current = now;
          syncWithServer.mutate(localCoins);
        }
      }, 1000); // Check every second, but only sync if SYNC_INTERVAL has passed

      return () => {
        clearInterval(incomeTimer);
        clearInterval(syncTimer);
      };
    }
  }, [user, income, localCoins, syncWithServer]);

  const clickMutation = useMutation<User & { income: number }, Error, void>({
    mutationFn: async () => {
      if (!userId) throw new Error('No user ID');
      const response = await fetch(`${API_URL}/game/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to process click');
      return response.json();
    },
    onSuccess: (data) => {
      setLocalCoins(data.cryptoCoins);
      setIncome(data.income);
      queryClient.setQueryData(['user', userId], data);
    },
    onError: () => {
      toast.error("Failed to process click. Please try again.");
    },
  });

  const buyBusinessMutation = useMutation<User & { income: number }, Error, BusinessType>({
    mutationFn: async (businessType: BusinessType) => {
      if (!userId) throw new Error('No user ID');
      const response = await fetch(`${API_URL}/game/buy-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, businessType }),
      });
      if (!response.ok) throw new Error('Failed to buy business');
      return response.json();
    },
    onSuccess: (data) => {
      setLocalCoins(data.cryptoCoins);
      setIncome(data.income);
      queryClient.setQueryData(['user', userId], data);
      toast.success(`Successfully purchased ${data.businesses[data.businesses.length - 1].type}`);
    },
    onError: () => {
      toast.error("Failed to buy business. Please try again.");
    },
  });

  const buyUpgradeMutation = useMutation<User & { income: number }, Error, UpgradeType>({
    mutationFn: async (upgradeId: UpgradeType) => {
      if (!userId) throw new Error('No user ID');
      const response = await fetch(`${API_URL}/game/buy-upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, upgradeId }),
      });
      if (!response.ok) throw new Error('Failed to buy upgrade');
      return response.json();
    },
    onSuccess: (data) => {
      setLocalCoins(data.cryptoCoins);
      setIncome(data.income);
      queryClient.setQueryData(['user', userId], data);
      toast.success(`Successfully purchased ${data.upgrades[data.upgrades.length - 1].type} upgrade`);
    },
    onError: () => {
      toast.error("Failed to buy upgrade. Please try again.");
    },
  });

  const handleButtonClick = () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < CLICK_COOLDOWN) return;
    lastClickTimeRef.current = now;
    clickMutation.mutate();
  };

  if (isUserLoading || isGameDataLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      {telegramUsername && (
        <Card className="mb-6">
          <CardContent>
            <p className="text-lg font-semibold">Welcome, {telegramUsername}!</p>
          </CardContent>
        </Card>
      )}
      <Card className="mb-6">
        <CardContent>
          <p className="text-2xl font-semibold">Crypto Coins: {localCoins.toFixed(2)}</p>
          <p>Income: {income.toFixed(2)} / s</p>
          {offlineEarnings > 0 && (
            <p className="text-green-500">Offline Earnings: +{offlineEarnings.toFixed(2)}</p>
          )}
          <Progress value={Math.min((localCoins / PRESTIGE_COST) * 100, 100)} className="mt-4" />
          <Button onClick={handleButtonClick} className="mt-6 w-full">
            <Coins className="mr-2 h-5 w-5" /> Click for Coins
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="businesses" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
        </TabsList>
        <TabsContent value="businesses">
          <Card>
            <CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(gameData?.BUSINESSES || {}).map(([type, business]) => {
                const ownedCount = user?.businesses.find(b => b.type === type)?.count || 0;
                const cost = calculateBusinessCost(type as BusinessType, ownedCount);
                return (
                  <div key={type} className="flex flex-col justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">{business.name}</p>
                      <p className="text-sm text-gray-400">Owned: {ownedCount}</p>
                    </div>
                    <Button 
                      onClick={() => buyBusinessMutation.mutate(type as BusinessType)}
                      disabled={localCoins < cost}
                      size="sm"
                      className="mt-2"
                    >
                      Buy ({cost.toFixed(0)})
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upgrades">
          <Card>
            <CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(gameData?.UPGRADES || {}).map(([id, upgrade]) => (
                <div key={id} className="flex flex-col justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">{upgrade.name}</p>
                    <p className="text-sm text-gray-400">Effect: x{upgrade.effect}</p>
                  </div>
                  <Button 
                    onClick={() => buyUpgradeMutation.mutate(id as UpgradeType)}
                    disabled={localCoins < upgrade.cost || user?.upgrades.some(u => u.type === id)}
                    size="sm"
                    className="mt-2"
                  >
                    Buy ({upgrade.cost})
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="mt-6 grid grid-cols-2 gap-4">
        <Button variant="outline" className="w-full">
          <TrendingUp className="h-4 w-4 mr-2" />
          Stats
        </Button>
        <Button variant="outline" className="w-full">
          <Zap className="h-4 w-4 mr-2" />
          Prestige
        </Button>
      </footer>
    </div>
  );
};

export default GameComponent;