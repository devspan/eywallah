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
    };
  }