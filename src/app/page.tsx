"use client"
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegramAuth } from '@/components/TelegramAuthProvider';
import { useGameStore } from '@/lib/store';
import { logger } from '@/lib/logger';
import GameComponent from '@/components/GameComponent';

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { user: telegramUser, isAuthenticated, isInitializing } = useTelegramAuth();
  const { isLoading, user, fetchUserData } = useGameStore();

  const initializeGame = useCallback(async () => {
    if (isAuthenticated && telegramUser) {
      try {
        await fetchUserData(telegramUser.id.toString(), telegramUser.username);
        logger.debug('Game initialized');
      } catch (error) {
        logger.error('Game initialization failed', error);
        setError('Failed to initialize game data');
      }
    }
  }, [isAuthenticated, telegramUser, fetchUserData]);

  useEffect(() => {
    // Set viewport meta tag
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(meta);

    // Initialize game when auth is not initializing
    if (!isInitializing) {
      initializeGame();
    }

    // Clean up function to remove the meta tag when component unmounts
    return () => {
      document.getElementsByTagName('head')[0].removeChild(meta);
    };
  }, [isInitializing, initializeGame]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setError('Loading timed out. Please refresh the page.');
      }
    }, 30000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a2035] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isInitializing || isLoading) {
    return (
      <div className="min-h-screen bg-[#1a2035] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1a2035] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">No User Data</h1>
        <p className="mb-4">Unable to load user data. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return <GameComponent />;
}