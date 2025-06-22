import { db } from "../db/db";
import { statsService } from "../services/stats.service";
import logger from "../utils/logger";
import { eq, not } from "drizzle-orm";
import { courses } from "../db/schemas/course.schema";
import { CourseStatus } from "../utils/enums";

/**
 * Job to pre-calculate leaderboards and cache them for faster retrieval
 * This job can run periodically (e.g., hourly or daily) to update cached leaderboards
 */
export async function runLeaderboardCalculation(): Promise<void> {
  try {
    logger.info("Starting leaderboard calculation job");

    // Get start time for performance tracking
    const startTime = Date.now();

    // Calculate and cache global leaderboard
    const globalLeaderboard = await statsService.getLeaderboard(100);

    // Calculate and cache weekly leaderboard
    const weeklyLeaderboard = await statsService.getWeeklyLeaderboard(100);

    // Calculate and cache monthly leaderboard
    const monthlyLeaderboard = await statsService.getMonthlyLeaderboard(100);

    // Get all non-draft courses (published or archived) to calculate course-specific leaderboards
    const activeCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(not(eq(courses.status, CourseStatus.DRAFT)))
      .execute();

    // Calculate and cache leaderboards for each active course
    for (const course of activeCourses) {
      await statsService.getCourseLeaderboard(course.id, 50);
    }

    // Log completion time
    const duration = Date.now() - startTime;
    logger.info(`Leaderboard calculation job completed in ${duration}ms`);
    logger.info(
      `Calculated leaderboards: global, weekly, monthly, and ${activeCourses.length} course-specific leaderboards`,
    );

    return;
  } catch (error) {
    logger.error("Error in leaderboard calculation job:", error);
    throw error;
  }
}
