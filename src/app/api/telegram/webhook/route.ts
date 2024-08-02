// src/app/api/telegram/webhook/route.ts
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BOT_TOKEN = process.env.NEXT_PUBLIC_BOT_TOKEN;
const WEBAPP_URL = process.env.NEXT_PUBLIC_WEBAPP_URL;

export async function POST(request: Request) {
  try {
    const update = await request.json();
    logger.debug('Received Telegram update', { update });

    if (!BOT_TOKEN) {
      throw new Error('BOT_TOKEN is not set');
    }

    if (!WEBAPP_URL) {
      throw new Error('WEBAPP_URL is not set');
    }

    if (update.message && update.message.text === '/start') {
      const chatId = update.message.chat.id;
      const messageText = 'Welcome to Crypto Capitalist!';
      const keyboard = {
        keyboard: [[{ text: 'Launch Game', web_app: { url: WEBAPP_URL } }]],
        resize_keyboard: true
      };

      logger.debug('Sending welcome message', { chatId, keyboard });

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          reply_markup: keyboard,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        logger.error('Failed to send Telegram message', { status: response.status, response: responseText });
        throw new Error(`Failed to send Telegram message: ${response.status} ${responseText}`);
      }

      logger.debug('Start command processed successfully', { chatId });
      return NextResponse.json({ status: 'ok' });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    logger.error('Error processing Telegram webhook', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}