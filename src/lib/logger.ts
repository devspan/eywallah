// src/lib/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info'; // Default log level

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (this.shouldLog(level)) {
      const timestamp = new Date().toISOString();
      const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, ...args);
          break;
        case 'info':
          console.info(formattedMessage, ...args);
          break;
        case 'warn':
          console.warn(formattedMessage, ...args);
          break;
        case 'error':
          console.error(formattedMessage, ...args);
          break;
      }
    }
  }

  public debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  public error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }
}

const logger = Logger.getInstance();

// Set the log level based on the environment
if (process.env.NODE_ENV === 'development') {
  logger.setLogLevel('debug');
} else {
  logger.setLogLevel('info');
}

export { logger };