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
import type { BusinessType, UpgradeType, User } from '@/types';
import { logger } from '@/lib/logger';
import { debounce } from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon } from 'lucide-react';

const CLICK_COOLDOWN = 100; // 0.1 seconds 
const SYNC_INTERVAL = 30000; // 30 seconds
const GAME_UPDATE_INTERVAL = 1000; // 1 second for updates
const INIT_COOLDOWN = 5000; // 5 seconds cooldown for initialization attempts

// Predefined playlist (you can expand this)
const playlist = [
  { title: "Crypto Beats", src: "/music/moroder.mp3" },
  { title: "Blockchain Groove", src: "/music/moroder.mp3" },
  { title: "Mining Melodies", src: "/music/moroder.mp3" },
];

const GameComponent: React.FC = () => {
  const { user: telegramUser, isAuthenticated } = useTelegramAuth();
  const { 
    user, income, clickPower,
    isLoading, error, syncWithServer, fetchUserData, performClick
  } = useGameStore();

  const [currentCoins, setCurrentCoins] = useState<bigint>(BigInt(0));
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const coinRef = useRef<HTMLDivElement>(null);
  const initializationAttemptRef = useRef<number>(0);
  const isInitializingRef = useRef<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const debouncedSyncWithServer = useCallback(
    debounce(() => syncWithServer(), 5000),
    [syncWithServer]
  );

  const initializeUser = useCallback(async () => {
    if (isInitializingRef.current || Date.now() - initializationAttemptRef.current < INIT_COOLDOWN) return;

    isInitializingRef.current = true;
    initializationAttemptRef.current = Date.now();

    try {
      logger.debug('Initializing user data', { telegramId: telegramUser?.id });
      await fetchUserData(telegramUser!.id.toString(), telegramUser?.username);
    } catch (error) {
      logger.error('Error fetching user data', error);
      toast.error('Failed to fetch user data. Please try again.');
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
      toast.error(`An error occurred: ${error}`);
    }
  }, [error]);

  useEffect(() => {
    if (user) {
      setCurrentCoins(BigInt(user.cryptoCoins));
      const gameUpdateTimer = setInterval(() => {
        setCurrentCoins(prevCoins => {
          const newCoins = prevCoins + (income * BigInt(GAME_UPDATE_INTERVAL)) / BigInt(60000); // Convert to per-minute
          return newCoins;
        });
      }, GAME_UPDATE_INTERVAL);

      return () => clearInterval(gameUpdateTimer);
    }
  }, [user, income]);

  useEffect(() => {
    const syncTimer = setInterval(debouncedSyncWithServer, SYNC_INTERVAL);
    return () => clearInterval(syncTimer);
  }, [debouncedSyncWithServer]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      if (user && user.photo_url) {
        setProfilePhoto(user.photo_url);
      }
    }
  }, []);

  const createFloatingTexts = useCallback(() => {
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
      coinRef.current!.appendChild(floatingText);

      setTimeout(() => {
        floatingText.style.transition = 'all 0.3s ease-out';
        floatingText.style.opacity = '1';
        floatingText.style.transform = 'scale(1)';
      }, 50);

      setTimeout(() => {
        floatingText.style.transition = 'all 0.7s ease-out';
        floatingText.style.opacity = '0';
        floatingText.style.transform = 'translateY(-100px) scale(0.8)';
      }, 300);

      setTimeout(() => floatingText.remove(), 1000);
    }
  }, [clickPower]);

  const createParticleBurst = useCallback(() => {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-2 h-2 rounded-full';
      particle.style.backgroundColor = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'][Math.floor(Math.random() * 4)];
      particle.style.left = '50%';
      particle.style.top = '50%';
      coinRef.current!.appendChild(particle);

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
  }, []);

  const createRippleEffect = useCallback(() => {
    const ripple = document.createElement('div');
    ripple.className = 'absolute inset-0 rounded-full bg-white opacity-30 scale-0';
    coinRef.current!.appendChild(ripple);

    ripple.animate([
      { transform: 'scale(0)', opacity: 0.3 },
      { transform: 'scale(2)', opacity: 0 }
    ], {
      duration: 600,
      easing: 'cubic-bezier(0,0,0.2,1)'
    }).onfinish = () => ripple.remove();
  }, []);

  const handleCoinClick = useCallback(async () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < CLICK_COOLDOWN) return;
    lastClickTimeRef.current = now;
    await performClick();
    setCurrentCoins(prevCoins => prevCoins + clickPower);
    logger.debug('Coin clicked');

    if (coinRef.current) {
      coinRef.current.classList.add('animate-bounce');
      setTimeout(() => coinRef.current?.classList.remove('animate-bounce'), 300);

      createFloatingTexts();
      createParticleBurst();
      createRippleEffect();
    }
  }, [performClick, clickPower, createFloatingTexts, createParticleBurst, createRippleEffect]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    setCurrentTrack((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
  }, []);

  const prevTrack = useCallback(() => {
    setCurrentTrack((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoadingUserData />;
  }

  const userRank = calculateRank(currentCoins);
  logger.debug('Rendering game component', { userId: user.id, rank: userRank, coins: currentCoins.toString() });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a2035] to-[#2c3e50] text-white flex flex-col">
      <div className="flex-grow w-full p-4 flex flex-col">
        <UserHeader user={user} userRank={userRank} profilePhoto={profilePhoto} />
        <GameContent
          currentCoins={currentCoins}
          income={income}
          clickPower={clickPower}
          handleCoinClick={handleCoinClick}
          coinRef={coinRef}
        />
        <PrestigeProgress currentCoins={currentCoins} />
      </div>
      <NavBar />
      <MusicPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        nextTrack={nextTrack}
        prevTrack={prevTrack}
        audioRef={audioRef}
      />
    </div>
  );
};

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-gradient-to-b from-[#1a2035] to-[#2c3e50]">
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
};

const LoadingUserData: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a2035] to-[#2c3e50] text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Loading User Data</h1>
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
};

interface UserHeaderProps {
  user: User;
  userRank: string;
  profilePhoto: string | null;
}

const UserHeader: React.FC<UserHeaderProps> = ({ user, userRank, profilePhoto }) => {
  return (
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
  );
};

interface GameContentProps {
  currentCoins: bigint;
  income: bigint;
  clickPower: bigint;
  handleCoinClick: () => void;
  coinRef: React.RefObject<HTMLDivElement>;
}

const GameContent: React.FC<GameContentProps> = ({ currentCoins, income, clickPower, handleCoinClick, coinRef }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center">
      <motion.div 
        ref={coinRef}
        onClick={handleCoinClick}
        className="coin-container bg-gradient-to-br from-purple-600 to-pink-500 rounded-full w-64 h-64 mb-4 cursor-pointer transition-transform duration-100 active:scale-95 relative overflow-hidden shadow-lg hover:shadow-2xl animate-spectrum-pulse-glow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Image
          src="/splash.png"
          alt="Crypto Capitalist"
          layout="fill"
          objectFit="cover"
          className="coin-image p-4 rounded-full"
        />
      </motion.div>
      <motion.p 
        className="text-5xl font-bold text-purple-400 mb-1"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      >
        {formatLargeNumber(currentCoins)}
      </motion.p>
      <p className="text-xl text-gray-400 mb-2">Crypto Coins</p>

      <div className="flex gap-4 mb-6 w-full max-w-md">
      <Card className="flex-1 bg-gradient-to-br from-blue-600 to-purple-600 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-3">
            <p className="text-gray-200 text-sm">Income</p>
            <p className="text-lg font-bold">{formatLargeNumber(income)}/min</p>
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
  );
};

interface PrestigeProgressProps {
  currentCoins: bigint;
}

const PrestigeProgress: React.FC<PrestigeProgressProps> = ({ currentCoins }) => {
  const progress = Math.min((Number(currentCoins) / Number(PRESTIGE_COST)) * 100, 100);
  
  return (
    <div className="w-full mb-2">
      <p className="text-xs text-purple-400 mb-1">Progress to Next Prestige</p>
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
              {progress.toFixed(2)}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-purple-600">
              {formatLargeNumber(currentCoins)} / {formatLargeNumber(PRESTIGE_COST)}
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
          <motion.div 
            style={{ width: `${progress}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};

interface MusicPlayerProps {
  currentTrack: number;
  isPlaying: boolean;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentTrack,
  isPlaying,
  togglePlay,
  nextTrack,
  prevTrack,
  audioRef,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-2 flex items-center justify-between">
      <audio
        ref={audioRef}
        src={playlist[currentTrack].src}
        onEnded={nextTrack}
        autoPlay={isPlaying}
      />
      <div className="flex items-center">
        <Button onClick={prevTrack} variant="ghost" size="icon">
          <SkipBackIcon className="h-4 w-4" />
        </Button>
        <Button onClick={togglePlay} variant="ghost" size="icon">
          {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
        </Button>
        <Button onClick={nextTrack} variant="ghost" size="icon">
          <SkipForwardIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-sm truncate">{playlist[currentTrack].title}</div>
    </div>
  );
};

export default React.memo(GameComponent);