import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import logger from "../utils/logger";
import { runDailyStreakCheck } from "../jobs/streak-check.job";
import { runWeeklyPointsReset } from "../jobs/weekly-points-reset.job";
import { runMonthlyPointsReset } from "../jobs/monthly-points-reset.job";
import { runLeaderboardCalculation } from "../jobs/leaderboard-calculation.job";

/**
 * Cron module for scheduling gamification background jobs
 */
export const cronJobs = new Elysia({ name: "cron-jobs" })
  .use(
    cron({
      name: "daily-streak-check",
      pattern: "0 0 * * *", // Run at midnight every day
      run: async () => {
        try {
          logger.info("Running daily streak check job");
          await runDailyStreakCheck();
          logger.info("Daily streak check job completed");
        } catch (error) {
          logger.error("Error in daily streak check job:", error);
        }
      },
    }),
  )
  .use(
    cron({
      name: "weekly-points-reset",
      pattern: "0 0 * * 0", // Run at midnight every Sunday
      run: async () => {
        try {
          logger.info("Running weekly points reset job");
          await runWeeklyPointsReset();
          logger.info("Weekly points reset job completed");
        } catch (error) {
          logger.error("Error in weekly points reset job:", error);
        }
      },
    }),
  )
  .use(
    cron({
      name: "monthly-points-reset",
      pattern: "0 0 1 * *", // Run at midnight on the 1st day of each month
      run: async () => {
        try {
          logger.info("Running monthly points reset job");
          await runMonthlyPointsReset();
          logger.info("Monthly points reset job completed");
        } catch (error) {
          logger.error("Error in monthly points reset job:", error);
        }
      },
    }),
  )
  .use(
    cron({
      name: "leaderboard-calculation",
      pattern: "0 * * * *", // Run at the beginning of every hour
      run: async () => {
        try {
          logger.info("Running leaderboard calculation job");
          await runLeaderboardCalculation();
          logger.info("Leaderboard calculation job completed");
        } catch (error) {
          logger.error("Error in leaderboard calculation job:", error);
        }
      },
    }),
  );
