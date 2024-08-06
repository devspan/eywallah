import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initTelegramAuth, getTelegramUser } from '@/lib/telegramAuth';
import { logger } from '@/lib/logger';

interface TelegramAuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  error: string | null;
}

const TelegramAuthContext = createContext<TelegramAuthContextType>({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  error: null,
});

export const TelegramAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<TelegramAuthContextType>({
    user: null,
    isAuthenticated: false,
    isInitializing: true,
    error: null,
  });

  const initializeAuth = useCallback(async () => {
    try {
      await initTelegramAuth();
      const user = getTelegramUser();
      setAuthState({
        user,
        isAuthenticated: !!user,
        isInitializing: false,
        error: null,
      });
      logger.debug('TelegramAuth initialized', { user });
    } catch (error) {
      logger.error('TelegramAuth initialization failed', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isInitializing: false,
        error: 'Failed to initialize Telegram authentication',
      });
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <TelegramAuthContext.Provider value={authState}>
      {children}
    </TelegramAuthContext.Provider>
  );
};

export const useTelegramAuth = () => useContext(TelegramAuthContext);