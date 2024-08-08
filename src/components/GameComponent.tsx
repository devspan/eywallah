// src/components/GameComponent.tsx

"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
const GAME_UPDATE_INTERVAL = 1000; // 1 second
const INIT_COOLDOWN = 5000; // 5 seconds cooldown for initialization attempts

const GameComponent: React.FC = () => {
  const { user: telegramUser, isAuthenticated } = useTelegramAuth();
  const { 
    user, income, clickPower,
    isLoading, error, updateCoins, syncWithServer, updateGame, fetchUserData, performClick,
    buyBusiness, buyUpgrade
  } = useGameStore();

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const lastClickTimeRef = useRef(0);
  const coinRef = useRef<HTMLDivElement>(null);
  const initializationAttemptRef = useRef(0);
  const isInitializingRef = useRef(false);

  const debouncedUpdateCoinsRef = useRef(debounce((amount: bigint) => {
    updateCoins(amount);
  }, 1000));

  const debouncedSyncWithServerRef = useRef(debounce(() => syncWithServer(), 5000));

  useEffect(() => {
    debouncedUpdateCoinsRef.current = debounce((amount: bigint) => {
      updateCoins(amount);
    }, 1000);
  }, [updateCoins]);

  useEffect(() => {
    debouncedSyncWithServerRef.current = debounce(() => syncWithServer(), 5000);
  }, [syncWithServer]);

  const debouncedUpdateCoins = useCallback((amount: bigint) => {
    debouncedUpdateCoinsRef.current(amount);
  }, []);

  const debouncedSyncWithServer = useCallback(() => {
    debouncedSyncWithServerRef.current();
  }, []);

  const getLastActiveTime = useCallback(() => {
    if (user && user.lastActive) {
      if (user.lastActive instanceof Date) {
        return user.lastActive.getTime();
      }
      if (typeof user.lastActive === 'string') {
        return new Date(user.lastActive).getTime();
      }
      if (typeof user.lastActive === 'number') {
        return user.lastActive;
      }
    }
    return Date.now();
  }, [user]);

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
      const gameUpdateTimer = setInterval(() => {
        const lastActiveTime = getLastActiveTime();
        const currentTime = Date.now();
        const timeDifference = currentTime - lastActiveTime;
        
        updateGame(timeDifference);
      }, GAME_UPDATE_INTERVAL);

      return () => clearInterval(gameUpdateTimer);
    }
  }, [user, updateGame, getLastActiveTime]);

  useEffect(() => {
    const syncTimer = setInterval(() => {
      debouncedSyncWithServer();
    }, SYNC_INTERVAL);

    return () => clearInterval(syncTimer);
  }, [debouncedSyncWithServer]);

  const handleCoinClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < CLICK_COOLDOWN) return;
    lastClickTimeRef.current = now;
    performClick();
    logger.debug('Coin clicked');

    if (coinRef.current) {
      // Coin bounce animation
      coinRef.current.classList.add('animate-bounce');
      setTimeout(() => coinRef.current?.classList.remove('animate-bounce'), 300);

      // Create multiple floating texts with different colors and sizes
      const colors = ['text-purple-400', 'text-pink-400', 'text-blue-400', 'text-green-400'];
      const sizes = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

      for (let i = 0; i < 5; i++) {
        const floatingText = document.createElement('div');
        floatingText.textContent = `+${formatLargeNumber(clickPower)}`;
        floatingText.className = `absolute font-bold ${colors[i % colors.length]} ${sizes[i % sizes.length]} animate-float-up`;
        floatingText.style.left = `${Math.random() * 80 + 10}%`;
        floatingText.style.top = `${Math.random() * 50 + 25}%`;
        floatingText.style.opacity = '0';
        floatingText.style.transform = 'scale(0.5)';
        coinRef.current.appendChild(floatingText);

        // Fade in and scale up
        setTimeout(() => {
          floatingText.style.transition = 'all 0.3s ease-out';
          floatingText.style.opacity = '1';
          floatingText.style.transform = 'scale(1)';
        }, 50);

        // Float up and fade out
        setTimeout(() => {
          floatingText.style.transition = 'all 0.7s ease-out';
          floatingText.style.opacity = '0';
          floatingText.style.transform = 'translateY(-100px) scale(0.8)';
        }, 300);

        setTimeout(() => floatingText.remove(), 1000);
      }

      // Add particle burst effect
      const particleCount = 20;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute w-2 h-2 rounded-full';
        particle.style.backgroundColor = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'][Math.floor(Math.random() * 4)];
        particle.style.left = '50%';
        particle.style.top = '50%';
        coinRef.current.appendChild(particle);

        const angle = (i / particleCount) * 360;
        const radius = Math.random() * 100 + 50;
        const duration = Math.random() * 0.5 + 0.5;

        particle.animate([
          { transform: 'translate(-50%, -50%) rotate(0deg) translateY(0) scale(1)', opacity: 1 },
          { transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(${radius}px) scale(0)`, opacity: 0 }
        ], {
          duration: duration * 1000,
          easing: 'cubic-bezier(0,0,0.2,1)'
        }).onfinish = () => particle.remove();
      }

      // Add a ripple effect
      const ripple = document.createElement('div');
      ripple.className = 'absolute inset-0 rounded-full bg-white opacity-30 scale-0';
      coinRef.current.appendChild(ripple);

      ripple.animate([
        { transform: 'scale(0)', opacity: 0.3 },
        { transform: 'scale(2)', opacity: 0 }
      ], {
        duration: 600,
        easing: 'cubic-bezier(0,0,0.2,1)'
      }).onfinish = () => ripple.remove();
    }
  }, [performClick, clickPower]);

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
            className="coin-container bg-gradient-to-br from-purple-600 to-pink-500 rounded-full w-64 h-64 mb-4 cursor-pointer transition-transform duration-100 active:scale-95 relative overflow-hidden shadow-lg hover:shadow-2xl animate-spectrum-pulse-glow"
          >
            <Image
              src="/splash.png"
              alt="Crypto Capitalist"
              layout="fill"
              objectFit="cover"
              className="coin-image p-4 rounded-full"
            />
          </div>
          <p className="text-5xl font-bold text-purple-400 mb-1">{formatLargeNumber(user.cryptoCoins)}</p>
          <p className="text-xl text-gray-400 mb-2">Crypto Coins</p>

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