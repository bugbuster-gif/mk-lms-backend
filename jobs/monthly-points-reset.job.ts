import { db } from "../db/db";
import { userStats } from "../db/schemas/user-stats.schema";
import logger from "../utils/logger";

/**
 * Monthly job to reset monthly points for all users
 * This job should run once per month (ideally on the 1st day of the month at midnight)
 */
export async function runMonthlyPointsReset(): Promise<void> {
  try {
    logger.info("Starting monthly points reset job");

    // Get start time for performance tracking
    const startTime = Date.now();

    // Reset monthly points for all users
    const result = await db
      .update(userStats)
      .set({
        monthlyPoints: 0,
        updatedAt: new Date(),
      })
      .returning({ userId: userStats.userId });

    // Log completion time and number of users affected
    const duration = Date.now() - startTime;
    logger.info(`Monthly points reset job completed in ${duration}ms`);
    logger.info(`Reset monthly points for ${result.length} users`);

    return;
  } catch (error) {
    logger.error("Error in monthly points reset job:", error);
    throw error;
  }
}
