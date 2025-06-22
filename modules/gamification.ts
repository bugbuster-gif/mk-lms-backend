import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { statsService } from "../services/stats.service";
import { streakService } from "../services/streak.service";
import { achievementService } from "../services/achievement.service";
import { activityService } from "../services/activity.service";
import { activityLog, ActivityType } from "../db/schemas/activity-log.schema";
import { db } from "../db/db";
import { and, eq, sql } from "drizzle-orm";

/**
 * Gamification module providing endpoints for leaderboards, achievements, streaks, and user stats
 */
export const gamification = new Elysia({ prefix: "/gamification" })
  .use(clerkPlugin())

  // Leaderboard endpoints
  .group("/leaderboard", (app) =>
    app
      // Get global leaderboard
      .get(
        "/",
        async ({ query }) => {
          const limit = query.limit ? parseInt(query.limit) : 10;
          const offset = query.offset ? parseInt(query.offset) : 0;
          return await statsService.getLeaderboard(limit, offset);
        },
        {
          query: t.Object({
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
          }),
          detail: {
            summary: "Get global leaderboard",
            tags: ["Gamification"],
          },
        },
      )

      // Get weekly leaderboard
      .get(
        "/weekly",
        async ({ query }) => {
          const limit = query.limit ? parseInt(query.limit) : 10;
          const offset = query.offset ? parseInt(query.offset) : 0;
          return await statsService.getWeeklyLeaderboard(limit, offset);
        },
        {
          query: t.Object({
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
          }),
          detail: {
            summary: "Get weekly leaderboard",
            tags: ["Gamification"],
          },
        },
      )

      // Get monthly leaderboard
      .get(
        "/monthly",
        async ({ query }) => {
          const limit = query.limit ? parseInt(query.limit) : 10;
          const offset = query.offset ? parseInt(query.offset) : 0;
          return await statsService.getMonthlyLeaderboard(limit, offset);
        },
        {
          query: t.Object({
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
          }),
          detail: {
            summary: "Get monthly leaderboard",
            tags: ["Gamification"],
          },
        },
      )

      // Get course-specific leaderboard
      .get(
        "/:courseId",
        async ({ params, query }) => {
          const { courseId } = params;
          const limit = query.limit ? parseInt(query.limit) : 10;
          const offset = query.offset ? parseInt(query.offset) : 0;
          return await statsService.getCourseLeaderboard(
            courseId,
            limit,
            offset,
          );
        },
        {
          params: t.Object({
            courseId: t.String(),
          }),
          query: t.Object({
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
          }),
          detail: {
            summary: "Get course-specific leaderboard",
            tags: ["Gamification"],
          },
        },
      ),
  )

  // User stats endpoints
  .group("/stats", (app) =>
    app
      // Get current user's stats
      .get(
        "/",
        async ({ auth: getAuth }) => {
          const auth = getAuth();

          if (!auth?.userId) {
            throw new Error("Unauthorized");
          }
          return await statsService.getUserStats(auth.userId);
        },
        {
          detail: {
            summary: "Get current user's stats",
            tags: ["Gamification"],
          },
        },
      )

      // Get specific user's stats (admin only)
      .get(
        "/:userId",
        async ({ params, auth: getAuth }) => {
          const auth = getAuth();

          if (!auth?.userId) {
            throw new Error("Unauthorized");
          }

          // TODO: Add admin check here

          return await statsService.getUserStats(params.userId);
        },
        {
          params: t.Object({
            userId: t.String(),
          }),
          detail: {
            summary: "Get specific user's stats (admin only)",
            tags: ["Gamification"],
          },
        },
      ),
  )

  // User achievements endpoints
  .group("/achievements", (app) =>
    app
      // Get all available achievements
      .get(
        "/",
        async () => {
          return await achievementService.getAllAchievements();
        },
        {
          detail: {
            summary: "Get all available achievements",
            tags: ["Gamification"],
          },
        },
      )

      // Get current user's achievements
      .get(
        "/user",
        async ({ auth: getAuth }) => {
          const auth = getAuth();

          if (!auth?.userId) {
            throw new Error("Unauthorized");
          }
          return await achievementService.getUserAchievements(auth.userId);
        },
        {
          detail: {
            summary: "Get current user's achievements",
            tags: ["Gamification"],
          },
        },
      ),
  )

  // User streak endpoints
  .group("/streaks", (app) =>
    app
      // Get current user's streak
      .get(
        "/",
        async ({ auth: getAuth }) => {
          const auth = getAuth();

          if (!auth?.userId) {
            throw new Error("Unauthorized");
          }
          return await streakService.getUserStreak(auth.userId);
        },
        {
          detail: {
            summary: "Get current user's streak",
            tags: ["Gamification"],
          },
        },
      )

      // Get top streaks
      .get(
        "/top",
        async ({ query }) => {
          const limit = query.limit ? parseInt(query.limit) : 10;
          return await streakService.getTopStreaks(limit);
        },
        {
          query: t.Object({
            limit: t.Optional(t.String()),
          }),
          detail: {
            summary: "Get top streaks",
            tags: ["Gamification"],
          },
        },
      ),
  )

  // User activity endpoints
  .group("/activity", (app) =>
    app
      .get(
        "/history",
        async ({ query, set, auth: getAuth }) => {
          const auth = getAuth();

          if (!auth?.userId) {
            set.status = 401;
            return { error: "Unauthorized" };
          }

          try {
            const { page = 1, limit = 10 } = query;
            const history = await activityService.getUserActivityHistory(
              auth.userId,
              Number(page),
              Number(limit)
            );
            return { data: history };
          } catch (error) {
            console.error("Error fetching activity history:", error);
            set.status = 500;
            return { error: "Failed to fetch activity history" };
          }
        },
        {
          query: t.Object({
            page: t.Optional(t.String()),
            limit: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Gamification"],
          },
        },
      )
      .get(
        "/recent",
        async ({ query, set, auth: getAuth }) => {
          const auth = getAuth();

          if (!auth?.userId) {
            set.status = 401;
            return { error: "Unauthorized" };
          }

          try {
            const { limit = 5 } = query;
            const activities = await activityService.getRecentActivities(
              Number(limit)
            );
            return { data: activities };
          } catch (error) {
            console.error("Error fetching recent activities:", error);
            set.status = 500;
            return { error: "Failed to fetch recent activities" };
          }
        },
        {
          query: t.Object({
            limit: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Gamification"],
          },
        },
      )
      .post(
        "/record",
        async ({ body, set, auth: getAuth }) => {
          const auth = getAuth();

          if (!auth?.userId) {
            set.status = 401;
            return { error: "Unauthorized" };
          }

          try {
            const { type, entityId } = body;
            
            // Record the activity
            const activity = await activityService.logActivity(
              auth.userId,
              type,
              entityId
            );

            return { data: activity };
          } catch (error) {
            console.error("Error recording activity:", error);
            set.status = 500;
            return { error: "Failed to record activity" };
          }
        },
        {
          body: t.Object({
            type: t.Enum(ActivityType),
            entityId: t.Optional(t.String()),
          }),
        },
      )
      .post(
        "/check-in",
        async ({ set, auth: getAuth }) => {
          const auth = getAuth();

          if (!auth?.userId) {
            set.status = 401;
            return { error: "Unauthorized" };
          }

          try {
            // Check if user already checked in today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const existingCheckin = await db
              .select()
              .from(activityLog)
              .where(
                and(
                  eq(activityLog.userId, auth.userId),
                  eq(activityLog.type, ActivityType.LOGIN),
                  sql`DATE(${activityLog.createdAt}) = DATE(NOW())`
                )
              )
              .execute();

            let isFirstLoginToday = existingCheckin.length === 0;
            let streakData = null;

            // If this is the first login today, update streak
            if (isFirstLoginToday) {
              // Log the login activity
              await activityService.logActivity(
                auth.userId,
                ActivityType.LOGIN
              );
              
              // Update streak and get updated streak data
              streakData = await streakService.recordActivity(auth.userId);
              
              // Award points for maintaining streak
              if (streakData.currentStreak > 1) {
                await statsService.addPoints(
                  auth.userId,
                  5, // 5 points per day for maintaining streak
                  ActivityType.MAINTAIN_STREAK
                );
              }
              
              // Check for achievements (like streak milestones)
              await achievementService.checkAndAwardAchievements(auth.userId);
            }

            return { 
              data: { 
                checkedIn: true,
                isFirstLoginToday,
                streak: streakData
              } 
            };
          } catch (error) {
            console.error("Error during check-in:", error);
            set.status = 500;
            return { error: "Failed to process check-in" };
          }
        }
      )
  );
