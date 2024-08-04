// src/types/telegram.ts
export interface WebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

export interface WebAppChat {
  id: number;
  type: string;
  title: string;
  username?: string;
  photo_url?: string;
}

export interface Telegram {
  WebApp: {
    initData: string;
    initDataUnsafe: {
      user: WebAppUser;
      query_id?: string;
      receiver?: WebAppUser;
      chat?: WebAppChat;
      chat_type?: string;
      chat_instance?: string;
      start_param?: string;
    };
    ready: () => void;
    expand: () => void;
    close: () => void;
    MainButton: {
      setText: (text: string) => void;
      onClick: (callback: () => void) => void;
      show: () => void;
      hide: () => void;
    };
    onEvent: (eventType: string, callback: (...args: any[]) => void) => void;
    offEvent: (eventType: string, callback: (...args: any[]) => void) => void;
    sendData: (data: string) => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback?: (isConfirmed: boolean) => void) => void;
    showPopup: (params: PopupParams, callback?: (id: string) => void) => void;
    requestContact: (callback?: (shared: boolean) => void) => void;
    readTextFromClipboard: (callback: (text: string) => void) => void;
    isExpanded: boolean;
    colorScheme: 'light' | 'dark';
    themeParams: ThemeParams;
  };
}

interface PopupParams {
  title?: string;
  message: string;
  buttons?: PopupButton[];
}

interface PopupButton {
  id?: string;
  type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
  text: string;
}

interface ThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}