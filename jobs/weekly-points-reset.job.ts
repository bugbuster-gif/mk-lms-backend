import { db } from "../db/db";
import { userStats } from "../db/schemas/user-stats.schema";
import logger from "../utils/logger";

/**
 * Weekly job to reset weekly points for all users
 * This job should run once per week (ideally Sunday at midnight)
 */
export async function runWeeklyPointsReset(): Promise<void> {
  try {
    logger.info("Starting weekly points reset job");

    // Get start time for performance tracking
    const startTime = Date.now();

    // Reset weekly points for all users
    const result = await db
      .update(userStats)
      .set({
        weeklyPoints: 0,
        updatedAt: new Date(),
      })
      .returning({ userId: userStats.userId });

    // Log completion time and number of users affected
    const duration = Date.now() - startTime;
    logger.info(`Weekly points reset job completed in ${duration}ms`);
    logger.info(`Reset weekly points for ${result.length} users`);

    return;
  } catch (error) {
    logger.error("Error in weekly points reset job:", error);
    throw error;
  }
}
