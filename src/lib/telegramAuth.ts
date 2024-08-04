declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export const initTelegramAuth = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    if (!window.Telegram || !window.Telegram.WebApp) {
      reject(new Error('Telegram WebApp is not available'));
      return;
    }

    const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
    console.log('Init data unsafe:', initDataUnsafe);

    window.Telegram.WebApp.ready();
    console.log('Telegram WebApp ready called');

    window.Telegram.WebApp.onEvent('viewportChanged', () => {
      console.log('Viewport changed');
    });

    resolve();
  });
};

export const getTelegramUser = (): any => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return null;
  }
  const user = window.Telegram.WebApp.initDataUnsafe.user;
  console.log('Retrieved Telegram user:', user);
  return user || null;
};

export const getStartParam = (): string => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return '';
  }
  return window.Telegram.WebApp.initDataUnsafe.start_param || '';
};

export const getInitData = (): string => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return '';
  }
  return window.Telegram.WebApp.initData || '';
};

export const getColorScheme = (): string => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return 'light';
  }
  return window.Telegram.WebApp.colorScheme || 'light';
};

export const getThemeParams = (): any => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return {};
  }
  return window.Telegram.WebApp.themeParams || {};
};

export const isExpanded = (): boolean => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return false;
  }
  return window.Telegram.WebApp.isExpanded || false;
};

export const expand = (): void => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.expand();
};

export const close = (): void => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.close();
};

export const sendData = (data: string): void => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.sendData(data);
};

export const readTextFromClipboard = (callback: (text: string) => void): void => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.readTextFromClipboard(callback);
};

export const showAlert = (message: string, callback?: () => void): void => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.showAlert(message, callback);
};

export const showConfirm = (message: string, callback?: (confirmed: boolean) => void): void => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.showConfirm(message, callback);
};

export const showPopup = (params: any, callback?: (id: string) => void): void => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.showPopup(params, callback);
};

export const requestContact = (callback?: (shared: boolean) => void): void => {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp is not available');
    return;
  }
  window.Telegram.WebApp.requestContact(callback);
};