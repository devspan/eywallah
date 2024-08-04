declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        colorScheme?: string;
        themeParams?: any;
        isExpanded?: boolean;
        sendData?: (data: string) => void;
        readTextFromClipboard?: (callback: (text: string) => void) => void;
        showAlert?: (message: string, callback?: () => void) => void;
      };
    };
  }
}

export {};