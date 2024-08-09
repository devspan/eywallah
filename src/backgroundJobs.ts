import { scheduleRemoveExpiredUpgrades } from './jobs/removeExpiredUpgrades';

export function startBackgroundJobs() {
  scheduleRemoveExpiredUpgrades();
}