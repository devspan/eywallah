// src/lib/telegramAuth.ts
import { logger } from './logger';

declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const BOT_TOKEN = process.env.NEXT_PUBLIC_BOT_TOKEN;

export const initTelegramAuth = async (): Promise<void> => {
  try {
    logger.debug('Initializing Telegram Web App');
    await window.Telegram.WebApp.ready();
    logger.debug('Telegram Web App initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Telegram Web App', error as Error);
    throw error;
  }
};

export const getTelegramUser = (): any => {
  const user = window.Telegram.WebApp.initDataUnsafe.user;
  logger.debug('Retrieved Telegram user', { user });
  return user || null;
};

export const authenticateUser = async (): Promise<{ id: string; telegramId: string; username: string | null }> => {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    logger.error('No Telegram user found');
    throw new Error('No Telegram user found');
  }

  try {
    logger.debug('Authenticating user', { telegramId: telegramUser.id });
    
    const response = await fetch(`${API_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${BOT_TOKEN}`
      },
      body: JSON.stringify({
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username || null,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to authenticate with the server', { status: response.status, error: errorText });
      throw new Error(`Failed to authenticate with the server: ${response.status} ${errorText}`);
    }

    const userData = await response.json();
    logger.debug('User authenticated successfully', { userId: userData.id, telegramId: userData.telegramId });

    return {
      id: userData.id,
      telegramId: userData.telegramId,
      username: userData.username,
    };
  } catch (error) {
    logger.error('Failed to authenticate user', error as Error);
    throw error;
  }
};

export const getInitData = (): string => {
  return window.Telegram.WebApp.initData || '';
};

export const getColorScheme = (): string => {
  return window.Telegram.WebApp.colorScheme;
};

export const getThemeParams = (): any => {
  return window.Telegram.WebApp.themeParams;
};

export const isExpanded = (): boolean => {
  return window.Telegram.WebApp.isExpanded;
};

export const expand = (): void => {
  window.Telegram.WebApp.expand();
};

export const close = (): void => {
  window.Telegram.WebApp.close();
};

export const sendData = (data: string): void => {
  window.Telegram.WebApp.sendData(data);
};

export const readTextFromClipboard = (callback: (text: string) => void): void => {
  window.Telegram.WebApp.readTextFromClipboard(callback);
};

export const showAlert = (message: string, callback?: () => void): void => {
  window.Telegram.WebApp.showAlert(message, callback);
};