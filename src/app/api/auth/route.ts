// src/app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { getUserByTelegramId, createUser } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { telegramId, username } = await request.json();
    logger.debug('Authenticating user', { telegramId, username });

    let user = await getUserByTelegramId(telegramId);
    if (!user) {
      logger.debug('Creating new user', { telegramId, username });
      user = await createUser(telegramId, username);
    }

    logger.debug('User authenticated successfully', { userId: user.id, telegramId, username });
    return NextResponse.json({ id: user.id, telegramId, username });
  } catch (error) {
    logger.error('Error authenticating user', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}