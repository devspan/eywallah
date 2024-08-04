"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initTelegramAuth, getTelegramUser, getStartParam } from '@/lib/telegramAuth';
import { logger } from '@/lib/logger';

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        logger.debug('Starting Telegram auth initialization');
        await initTelegramAuth();
        logger.debug('Telegram auth initialized successfully');

        const user = getTelegramUser();
        const startParam = getStartParam();

        logger.debug('Telegram user', { user });
        logger.debug('Start param', { startParam });
        
        if (user) {
          logger.debug('User authenticated, redirecting to game page');
          router.push('/game');
        } else {
          logger.warn('User not authenticated');
          setError('User not authenticated');
          // Uncomment the following line to redirect to the landing page
          // router.push('/landing');
        }
      } catch (error) {
        logger.error('Failed to initialize Telegram auth', error as Error);
        setError((error as Error).message || 'An unknown error occurred');
      }
    };

    initialize();
  }, [router]);

  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>Loading...</div>
  );
}