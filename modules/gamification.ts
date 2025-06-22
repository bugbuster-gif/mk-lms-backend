import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";

import { statsService } from "../services/stats.service";
import { streakService } from "../services/streak.service";
import { achievementService } from "../services/achievement.service";
import { activityService } from "../services/activity.service";

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
      // Get current user's activity history
      .get(
        "/",
        async ({ auth: getAuth, query }) => {
          const auth = getAuth();

          if (!auth?.userId) {
            throw new Error("Unauthorized");
          }

          const limit = query.limit ? parseInt(query.limit) : 10;
          const offset = query.offset ? parseInt(query.offset) : 0;

          return await activityService.getUserActivityHistory(
            auth.userId,
            limit,
            offset,
          );
        },
        {
          query: t.Object({
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
          }),
          detail: {
            summary: "Get current user's activity history",
            tags: ["Gamification"],
          },
        },
      )

      // Get recent activities across all users
      .get(
        "/recent",
        async ({ query }) => {
          const limit = query.limit ? parseInt(query.limit) : 20;
          return await activityService.getRecentActivities(limit);
        },
        {
          query: t.Object({
            limit: t.Optional(t.String()),
          }),
          detail: {
            summary: "Get recent activities across all users",
            tags: ["Gamification"],
          },
        },
      ),
  );
