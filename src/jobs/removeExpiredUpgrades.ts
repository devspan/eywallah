import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export function scheduleRemoveExpiredUpgrades() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running remove expired upgrades job');
    const currentTime = new Date();
    
    try {
      const result = await prisma.activeUpgrade.deleteMany({
        where: {
          expirationTime: {
            lt: currentTime
          }
        }
      });
      logger.info(`Removed ${result.count} expired upgrades`);
    } catch (error) {
      logger.error('Error removing expired upgrades:', error);
    }
  });
}