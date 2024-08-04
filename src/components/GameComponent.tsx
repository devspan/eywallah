"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from 'react-hot-toast';
import { useTelegramAuth } from "@/components/TelegramAuthProvider";
import { useGameStore } from '@/lib/store';
import NavBar from './NavBar';
import { PRESTIGE_COST, calculateClickPower, calculateRank, calculateIncome } from '@/lib/gameLogic';
import { User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SYNC_INTERVAL = 10000; // 10 seconds
const CLICK_COOLDOWN = 100; // 0.1 seconds

const GameComponent: React.FC = () => {
  const { user: telegramUser, isAuthenticated } = useTelegramAuth();
  const { user, localCoins, income, setUser, updateLocalCoins, syncWithServer } = useGameStore();
  const [clickPower, setClickPower] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const lastClickTimeRef = useRef(0);
  const lastSyncTimeRef = useRef(0);
  const coinRef = useRef<HTMLDivElement>(null);

  const { data: userData, error: userError, isLoading: isUserLoading, refetch } = useQuery<User, Error>({
    queryKey: ['user', telegramUser?.id],
    queryFn: async () => {
      if (!telegramUser) {
        console.error('No Telegram user found');
        throw new Error('No Telegram user');
      }
      console.log('Fetching user data', { telegramId: telegramUser.id });
      const response = await fetch(`${API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'init', 
          data: { 
            telegramId: telegramUser.id.toString(), 
            username: telegramUser.username || undefined
          } 
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch user data', { status: response.status, error: errorText });
        throw new Error(`Failed to fetch user data: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('User data fetched', { userData: data });
      return data as User;
    },
    enabled: isAuthenticated && !!telegramUser,
    retry: 3,
  });

  useEffect(() => {
    if (userError) {
      console.error('Error fetching user data:', userError);
      toast.error(`Failed to fetch user data: ${userError.message}`);
    }
  }, [userError]);

  useEffect(() => {
    if (userData) {
      console.log('Setting user data', { userData });
      setUser(userData);
      const calculatedIncome = calculateIncome(userData);
      const calculatedClickPower = calculateClickPower(userData);
      setClickPower(calculatedClickPower);
    }
  }, [userData, setUser]);

  useEffect(() => {
    if (user) {
      const incomeTimer = setInterval(() => {
        updateLocalCoins(income / 10);
      }, 100);

      const syncTimer = setInterval(() => {
        const now = Date.now();
        if (now - lastSyncTimeRef.current >= SYNC_INTERVAL) {
          lastSyncTimeRef.current = now;
          syncWithServer();
        }
      }, 1000);

      return () => {
        clearInterval(incomeTimer);
        clearInterval(syncTimer);
      };
    }
  }, [user, income, updateLocalCoins, syncWithServer]);

  const handleCoinClick = () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < CLICK_COOLDOWN) {
      return;
    }
    lastClickTimeRef.current = now;
    updateLocalCoins(clickPower);

    // Animation
    if (coinRef.current) {
      coinRef.current.classList.add('animate-bounce');
      setTimeout(() => {
        coinRef.current?.classList.remove('animate-bounce');
      }, 300);
    }

    // Floating text animation
    const floatingText = document.createElement('div');
    floatingText.textContent = `+${clickPower.toFixed(2)}`;
    floatingText.className = 'absolute text-purple-400 font-bold text-2xl animate-float-up';
    floatingText.style.left = `${Math.random() * 80 + 10}%`;
    coinRef.current?.appendChild(floatingText);
    setTimeout(() => floatingText.remove(), 1000);
  };

  if (isUserLoading) {
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

  if (userError || !userData) {
    return (
      <div className="min-h-screen bg-[#1a2035] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Error: Unable to load user data</h1>
        <p className="text-red-500 mb-4">{userError?.message || 'Unknown error occurred'}</p>
        <button
          onClick={() => refetch()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  const userRank = calculateRank(userData.cryptoCoins);

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
              <h1 className="font-bold text-sm">{userData.username || 'Crypto Capitalist'}</h1>
              <p className="text-xs text-purple-400">{userRank}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-purple-400">Prestige Points</p>
            <p className="font-bold text-sm">{userData.prestigePoints}</p>
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
          <p className="text-5xl font-bold text-purple-400 mb-1">{Math.floor(localCoins).toLocaleString()}</p>
          <p className="text-xl text-gray-400 mb-6">Crypto Coins</p>

          <div className="flex gap-4 mb-6 w-full max-w-md">
            <Card className="flex-1 bg-gradient-to-br from-blue-600 to-purple-600 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <p className="text-gray-200 text-sm">Income</p>
                <p className="text-lg font-bold">{income.toFixed(2)}/s</p>
              </CardContent>
            </Card>
            <Card className="flex-1 bg-gradient-to-br from-pink-600 to-red-600 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <p className="text-gray-200 text-sm">Click Power</p>
                <p className="text-lg font-bold">{clickPower.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-full mb-2">
          <p className="text-xs text-purple-400 mb-1">Progress to Next Prestige</p>
          <Progress 
            value={Math.min((localCoins / PRESTIGE_COST) * 100, 100)} 
            className="h-2 bg-gray-700"
          />
        </div>
      </div>

      <NavBar />
    </div>
  );
};

export default GameComponent;