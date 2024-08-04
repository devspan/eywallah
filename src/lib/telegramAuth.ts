import { logger } from './logger';
import { WebAppUser, Telegram } from '@/types/telegram';

declare global {
  interface Window {
    Telegram?: Telegram;
  }
}

export const initTelegramAuth = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    logger.debug('Initializing Telegram Auth');
    if (typeof window === 'undefined') {
      logger.error('Window is not defined');
      reject(new Error('Window is not defined'));
      return;
    }

    if (!window.Telegram || !window.Telegram.WebApp) {
      logger.error('Telegram WebApp is not available');
      reject(new Error('Telegram WebApp is not available'));
      return;
    }

    try {
      window.Telegram.WebApp.ready();
      logger.debug('Telegram WebApp ready called');

      const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
      logger.debug('Init data unsafe:', initDataUnsafe);

      window.Telegram.WebApp.onEvent('viewportChanged', () => {
        logger.debug('Viewport changed');
      });

      resolve();
    } catch (error) {
      logger.error('Error during Telegram WebApp initialization', error);
      reject(error);
    }
  });
};

export const getTelegramUser = (): WebAppUser | null => {
  logger.debug('Entering getTelegramUser function');
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available', { 
      window: typeof window, 
      Telegram: !!window.Telegram, 
      WebApp: !!window.Telegram?.WebApp 
    });
    return null;
  }
  logger.debug('WebApp object:', window.Telegram.WebApp);
  const user = window.Telegram.WebApp.initDataUnsafe.user;
  logger.debug('Retrieved user data:', user);
  return user || null;
};

export const getStartParam = (): string => {
  logger.debug('Getting start parameter');
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return '';
  }
  const startParam = window.Telegram.WebApp.initDataUnsafe.start_param || '';
  logger.debug('Start parameter:', startParam);
  return startParam;
};

export const getInitData = (): string => {
  logger.debug('Getting init data');
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return '';
  }
  const initData = window.Telegram.WebApp.initData || '';
  logger.debug('Init data:', initData);
  return initData;
};

export const getColorScheme = (): 'light' | 'dark' => {
  logger.debug('Getting color scheme');
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return 'light';
  }
  const colorScheme = window.Telegram.WebApp.colorScheme;
  logger.debug('Color scheme:', colorScheme);
  return colorScheme;
};

export const getThemeParams = (): Telegram['WebApp']['themeParams'] => {
  logger.debug('Getting theme params');
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return {};
  }
  const themeParams = window.Telegram.WebApp.themeParams;
  logger.debug('Theme params:', themeParams);
  return themeParams;
};

export const isExpanded = (): boolean => {
  logger.debug('Checking if WebApp is expanded');
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return false;
  }
  const expanded = window.Telegram.WebApp.isExpanded;
  logger.debug('Is expanded:', expanded);
  return expanded;
};

export const expand = (): void => {
  logger.debug('Expanding WebApp');
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.expand();
  logger.debug('WebApp expanded');
};

export const close = (): void => {
  logger.debug('Closing WebApp');
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.close();
  logger.debug('WebApp closed');
};

export const sendData = (data: string): void => {
  logger.debug('Sending data', { data });
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.sendData(data);
  logger.debug('Data sent');
};

export const readTextFromClipboard = (callback: (text: string) => void): void => {
  logger.debug('Reading text from clipboard');
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.readTextFromClipboard(callback);
  logger.debug('Clipboard read initiated');
};

export const showAlert = (message: string, callback?: () => void): void => {
  logger.debug('Showing alert', { message });
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.showAlert(message, callback);
  logger.debug('Alert shown');
};

export const showConfirm = (message: string, callback?: (confirmed: boolean) => void): void => {
  logger.debug('Showing confirmation', { message });
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.showConfirm(message, callback);
  logger.debug('Confirmation shown');
};

export const showPopup = (params: Telegram['WebApp']['showPopup'] extends (params: infer P, callback?: any) => any ? P : never, callback?: (id: string) => void): void => {
  logger.debug('Showing popup', { params });
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.showPopup(params, callback);
  logger.debug('Popup shown');
};

export const requestContact = (callback?: (shared: boolean) => void): void => {
  logger.debug('Requesting contact');
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    logger.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.requestContact(callback);
  logger.debug('Contact request initiated');
};