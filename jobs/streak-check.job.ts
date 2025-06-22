import { streakService } from "../services/streak.service";
import logger from "../utils/logger";

/**
 * Daily job to check and update streaks for all users
 * This job should run once per day (ideally at midnight)
 * It will reset streaks for users who were not active yesterday
 */
export async function runDailyStreakCheck(): Promise<void> {
  try {
    logger.info("Starting daily streak check job");

    // Get start time for performance tracking
    const startTime = Date.now();

    // Run the streak check for all users
    await streakService.checkAndUpdateAllStreaks();

    // Log completion time
    const duration = Date.now() - startTime;
    logger.info(`Daily streak check job completed in ${duration}ms`);
  } catch (error) {
    logger.error("Error in daily streak check job:", error);
    throw error;
  }
}
