import { createClient } from 'redis';
import { User } from '@/types';

const redisClient = createClient({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

await redisClient.connect();

export async function getGameState(userId: string): Promise<User | null> {
  const gameState = await redisClient.get(userId);
  if (!gameState) return null;
  return JSON.parse(gameState);
}

export async function saveGameState(user: User): Promise<void> {
  await redisClient.set(user.id, JSON.stringify(user));
}

export function createNewUser(userId: string): User {
  const newUser: User = {
    id: userId,
    telegramId: '',
    username: null,
    cryptoCoins: 0,
    lastActive: new Date(),
    prestigePoints: 0,
    incomeMultiplier: 1,
    offlineEarnings: 0,
    businesses: [],
    upgrades: [],
    achievements: [],
  };
  return newUser;
}