"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { initTelegramAuth, authenticateUser, getProfilePhoto } from '@/lib/telegramAuth';
import { useGameStore } from '@/lib/store';
import NavBar from './NavBar';
import { PRESTIGE_COST, MAX_TOTAL_SUPPLY, calculateClickPower, calculateRank, estimateTimeToExhaustSupply, calculateIncome } from '@/lib/gameLogic';
import { User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SYNC_INTERVAL = 10000; // 10 seconds
const CLICK_COOLDOWN = 100; // 0.1 seconds

const GameComponent: React.FC = () => {
  const { user, localCoins, income, setUser, updateLocalCoins, syncWithServer } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [clickPower, setClickPower] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [estimatedExhaustTime, setEstimatedExhaustTime] = useState<string>('');
  const lastClickTimeRef = useRef(0);
  const lastSyncTimeRef = useRef(0);
  const coinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await initTelegramAuth();
        const telegramUser = await authenticateUser();
        setTelegramId(telegramUser.telegramId);
        if (telegramUser.telegramId) {
          const photo = await getProfilePhoto(telegramUser.telegramId);
          setProfilePhoto(photo);
        }
      } catch (error) {
        console.error('Failed to initialize Telegram auth:', error);
        toast.error('Failed to initialize Telegram authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const { data: userData, error: userError, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['user', telegramId],
    queryFn: async () => {
      if (!telegramId) throw new Error('No Telegram ID');
      const response = await fetch(`${API_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init', data: { telegramId } }),
      });
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    },
    enabled: !!telegramId,
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
      const calculatedIncome = calculateIncome(userData);
      const calculatedClickPower = calculateClickPower(userData);
      setClickPower(calculatedClickPower);
      setEstimatedExhaustTime(estimateTimeToExhaustSupply(userData.cryptoCoins, calculatedIncome));
    }
  }, [userData, setUser]);

  useEffect(() => {
    if (userError) {
      console.error('Failed to fetch user data:', userError);
      toast.error('Failed to fetch user data');
    }
  }, [userError]);

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
    floatingText.className = 'absolute text-black-400 font-bold text-lg animate-float-up';
    floatingText.style.left = `${Math.random() * 80 + 10}%`;
    coinRef.current?.appendChild(floatingText);
    setTimeout(() => floatingText.remove(), 1000);
  };

  if (isLoading || isUserLoading) {
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

  if (!user) return <div className="text-center text-lg text-red-500">Error: Unable to load user data</div>;

  const userRank = calculateRank(user.cryptoCoins);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="flex-grow bg-[#1c2333] w-full p-4">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-12 h-12 rounded-full mr-2" />
            ) : (
              <div className="bg-[#2c3e50] rounded-full p-2 mr-2 w-12 h-12 flex items-center justify-center">
                <Image src="/bitcoin.png" alt="Bitcoin" width={32} height={32} />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg">{user.username || 'Crypto Capitalist'}</h1>
              <p className="text-sm text-gray-400">{userRank}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Prestige Points</p>
            <p className="font-bold">{user.prestigePoints}</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center mb-8">
          <div 
            ref={coinRef}
            onClick={handleCoinClick}
            className="bg-yellow-500 rounded-full w-32 h-32 mb-4 cursor-pointer transition-transform duration-100 active:scale-95 relative overflow-hidden"
          >
            <Image
              src="/bitcoin.png"
              alt="Bitcoin"
              layout="fill"
              objectFit="cover"
              className="p-2"
            />
          </div>
          <p className="text-4xl font-bold text-yellow-400">{Math.floor(localCoins).toLocaleString()}</p>
          <p className="text-gray-400">Crypto Coins</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card className="bg-[#2c3e50]">
            <CardContent className="p-4">
              <p className="text-gray-400">Income</p>
              <p className="text-xl font-bold">{income.toFixed(2)}/s</p>
            </CardContent>
          </Card>
          <Card className="bg-[#2c3e50]">
            <CardContent className="p-4">
              <p className="text-gray-400">Click Power</p>
              <p className="text-xl font-bold">{clickPower.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-1">Progress to Next Prestige</p>
          <Progress 
            value={Math.min((localCoins / PRESTIGE_COST) * 100, 100)} 
            className="h-2 bg-gray-700"
          />
        </div>

        <Card className="mt-4 bg-[#2c3e50]">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 mr-2 text-gray-400" />
              <p className="text-sm text-gray-400">Estimated Time to Exhaust Supply</p>
            </div>
            <p className="text-md font-bold">{estimatedExhaustTime}</p>
          </CardContent>
        </Card>

        <div className="mt-4">
          <p className="text-sm text-gray-400">Total Supply: {MAX_TOTAL_SUPPLY.toLocaleString()} coins</p>
          <p className="text-sm text-gray-400">Current Circulation: {localCoins.toLocaleString()} coins</p>
        </div>
      </div>

      <NavBar />
    </div>
  );
};

export default GameComponent;