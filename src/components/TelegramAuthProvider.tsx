"use client";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initTelegramAuth, getTelegramUser } from "@/lib/telegramAuth";
import type { WebAppUser } from "@/types/telegram";
import { logger } from '@/lib/logger';

interface TelegramAuthContextValue {
  user: WebAppUser | null;
  isAuthenticated: boolean;
}

const TelegramAuthContext = createContext<TelegramAuthContextValue>({
  user: null,
  isAuthenticated: false,
});

export const useTelegramAuth = () => useContext(TelegramAuthContext);

interface TelegramAuthProviderProps {
  children: React.ReactNode;
}

export const TelegramAuthProvider: React.FC<TelegramAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<WebAppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      try {
        logger.debug('Initializing Telegram auth...');
        await initTelegramAuth();
        const telegramUser = getTelegramUser();

        if (telegramUser) {
          logger.debug('Telegram user found', telegramUser);
          setUser(telegramUser);
          setIsAuthenticated(true);
        } else {
          logger.warn('No Telegram user found, redirecting to landing page');
          setIsAuthenticated(false);
          router.push("/landing");
        }
      } catch (error) {
        logger.error("Failed to initialize Telegram auth", error);
        setIsAuthenticated(false);
        router.push("/landing");
      }
    };

    initialize();
  }, [router]);

  logger.debug('TelegramAuthProvider state', { user, isAuthenticated });

  return (
    <TelegramAuthContext.Provider value={{ user, isAuthenticated }}>
      {children}
    </TelegramAuthContext.Provider>
  );
};