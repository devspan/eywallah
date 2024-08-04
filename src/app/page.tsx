"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initTelegramAuth, getTelegramUser, getStartParam } from '@/lib/telegramAuth';
import { logger } from '@/lib/logger';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      try {
        await initTelegramAuth();
        const user = getTelegramUser();
        const startParam = getStartParam();

        logger.debug('Telegram user', { user });
        logger.debug('Start param', { startParam });
        
        if (user) {
          // User is authenticated, redirect to game page
          router.push('/game');
        } else {
          // Commented out logic for redirecting to landing page
          // router.push('/landing');
          logger.debug('User not authenticated');
        }
      } catch (error) {
        logger.error('Failed to initialize Telegram auth', error as Error);
        // Handle initialization error
      }
    };

    initialize();
  }, [router]);

  return (
    // Render your home page content here
    <div>Loading...</div>
  );
}
