// src/components/GameComponent.tsx

"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from 'react-hot-toast';
import { useTelegramAuth } from "@/components/TelegramAuthProvider";
import { useGameStore } from '@/lib/store';
import NavBar from './NavBar';
import { PRESTIGE_COST, calculateRank, formatLargeNumber } from '@/lib/gameLogic';
import type { BusinessType, UpgradeType } from '@/types';
import { logger } from '@/lib/logger';
import { debounce } from 'lodash';

const CLICK_COOLDOWN = 100; // 0.1 seconds 
const SYNC_INTERVAL = 30000; // 30 seconds
const GLOBAL_UPDATE_INTERVAL = 60000; // 60 seconds
const INIT_COOLDOWN = 5000; // 5 seconds cooldown for initialization attempts

const GameComponent: React.FC = () => {
  const { user: telegramUser, isAuthenticated } = useTelegramAuth();
  const { 
    user, income, clickPower, globalStats,
    isLoading, error, updateCoins, syncWithServer, updateGlobalGame, fetchUserData, mineBlock,
    buyBusiness, buyUpgrade
  } = useGameStore();

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const lastClickTimeRef = useRef(0);
  const coinRef = useRef<HTMLDivElement>(null);
  const initializationAttemptRef = useRef(0);
  const isInitializingRef = useRef(false);

  const debouncedUpdateCoins = useCallback(
    debounce((amount: bigint) => {
      updateCoins(amount);
    }, 1000),
    [updateCoins]
  );

  const debouncedSyncWithServer = useCallback(
    debounce(() => syncWithServer(), 5000),
    [syncWithServer]
  );

  const initializeUser = useCallback(async () => {
    if (isInitializingRef.current) return;
    if (Date.now() - initializationAttemptRef.current < INIT_COOLDOWN) return;

    isInitializingRef.current = true;
    initializationAttemptRef.current = Date.now();

    try {
      logger.debug('Initializing user data', { telegramId: telegramUser?.id });
      await fetchUserData(telegramUser!.id.toString(), telegramUser?.username);
    } catch (error) {
      logger.error('Error fetching user data', error);
      toast.error('Failed to fetch user data');
    } finally {
      isInitializingRef.current = false;
    }
  }, [telegramUser, fetchUserData]);

  useEffect(() => {
    if (isAuthenticated && telegramUser && !user) {
      initializeUser();
    }
  }, [isAuthenticated, telegramUser, user, initializeUser]);

  useEffect(() => {
    if (error) {
      logger.error('Error in GameComponent', { error });
      toast.error(`Error: ${error}`);
    }
  }, [error]);

  useEffect(() => {
    if (user) {
      const incomeTimer = setInterval(() => {
        const earnedCoins = income / BigInt(10);
        debouncedUpdateCoins(earnedCoins);
      }, 100);

      return () => clearInterval(incomeTimer);
    }
  }, [user, income, debouncedUpdateCoins]);

  useEffect(() => {
    const syncTimer = setInterval(() => {
      debouncedSyncWithServer();
    }, SYNC_INTERVAL);

    const globalUpdateTimer = setInterval(() => {
      updateGlobalGame();
    }, GLOBAL_UPDATE_INTERVAL);

    return () => {
      clearInterval(syncTimer);
      clearInterval(globalUpdateTimer);
    };
  }, [debouncedSyncWithServer, updateGlobalGame]);

  const handleCoinClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < CLICK_COOLDOWN) return;
    lastClickTimeRef.current = now;
    mineBlock();
    logger.debug('Coin clicked, mining block');

    if (coinRef.current) {
      coinRef.current.classList.add('animate-bounce');
      setTimeout(() => coinRef.current?.classList.remove('animate-bounce'), 300);

      const floatingText = document.createElement('div');
      floatingText.textContent = `+${formatLargeNumber(clickPower)}`;
      floatingText.className = 'absolute text-purple-400 font-bold text-2xl animate-float-up';
      floatingText.style.left = `${Math.random() * 80 + 10}%`;
      coinRef.current.appendChild(floatingText);
      setTimeout(() => floatingText.remove(), 1000);
    }
  }, [mineBlock, clickPower]);

  const handleBuyBusiness = useCallback((businessType: BusinessType) => {
    buyBusiness(businessType);
    toast.success(`Purchased ${businessType}`);
  }, [buyBusiness]);

  const handleBuyUpgrade = useCallback((upgradeType: UpgradeType) => {
    buyUpgrade(upgradeType);
    toast.success(`Purchased ${upgradeType} upgrade`);
  }, [buyUpgrade]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-gray-900">
        <div className="relative w-full h-full">
          <Image
            src="/splash.png"
            alt="Loading..."
            layout="fill"
            objectFit="cover"
            priority
            className="animate-pulse"
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1a2035] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Loading User Data</h1>
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const userRank = calculateRank(user.cryptoCoins);
  logger.debug('Rendering game component', { userId: user.id, rank: userRank, coins: user.cryptoCoins.toString() });

  return (
    <div className="min-h-screen bg-[#1a2035] text-white flex flex-col">
      <div className="flex-grow w-full p-4 flex flex-col">
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="bg-[#2c3e50] rounded-full p-1 mr-2 w-10 h-10 flex items-center justify-center overflow-hidden">
              {profilePhoto ? (
                <Image src={profilePhoto} alt="Profile" width={40} height={40} className="rounded-full" />
              ) : (
                <Image src="/splash.png" alt="Crypto Capitalist" width={24} height={24} className="rounded-full" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-sm">{user.username || 'Crypto Capitalist'}</h1>
              <p className="text-xs text-purple-400">{userRank}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-purple-400">Prestige Points</p>
            <p className="font-bold text-sm">{user.prestigePoints}</p>
          </div>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center">
          <div 
            ref={coinRef}
            onClick={handleCoinClick}
            className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-full w-64 h-64 mb-4 cursor-pointer transition-transform duration-100 active:scale-95 relative overflow-hidden shadow-lg hover:shadow-2xl animate-spectrum-pulse-glow"
          >
            <Image
              src="/splash.png"
              alt="Crypto Capitalist"
              layout="fill"
              objectFit="cover"
              className="p-4 rounded-full"
            />
          </div>
          <p className="text-5xl font-bold text-purple-400 mb-1">{formatLargeNumber(user.cryptoCoins)}</p>
          <p className="text-xl text-gray-400 mb-2">Crypto Coins</p>
          <p className="text-sm text-green-400 mb-6">Market Price: ${globalStats.coinMarketPrice.toFixed(2)}</p>

          <div className="flex gap-4 mb-6 w-full max-w-md">
            <Card className="flex-1 bg-gradient-to-br from-blue-600 to-purple-600 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <p className="text-gray-200 text-sm">Income</p>
                <p className="text-lg font-bold">{formatLargeNumber(income)}/s</p>
              </CardContent>
            </Card>
            <Card className="flex-1 bg-gradient-to-br from-pink-600 to-red-600 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <p className="text-gray-200 text-sm">Click Power</p>
                <p className="text-lg font-bold">{formatLargeNumber(clickPower)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="w-full max-w-md mb-6">
            <Card className="bg-gradient-to-br from-indigo-600 to-blue-600 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <h3 className="text-lg font-bold mb-2">Global Stats</h3>
                <p className="text-sm">Block Height: {globalStats.blockHeight.toLocaleString()}</p>
                <p className="text-sm">Difficulty: {globalStats.difficulty.toFixed(2)}</p>
                <p className="text-sm">Global Hash Rate: {globalStats.globalHashRate.toExponential(2)} H/s</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-full mb-2">
          <p className="text-xs text-purple-400 mb-1">Progress to Next Prestige</p>
          <Progress 
            value={Math.min((Number(user.cryptoCoins) / Number(PRESTIGE_COST)) * 100, 100)} 
            className="h-2 bg-gray-700"
          />
        </div>
      </div>

      <NavBar />
    </div>
  );
};

export default React.memo(GameComponent);