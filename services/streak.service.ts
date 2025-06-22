import { db } from "../db/db";
import { streaks } from "../db/schemas/streaks.schema";
import { activityLog } from "../db/schemas/activity-log.schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { isSameDay, startOfDay, subDays } from "date-fns";
import { sql } from "drizzle-orm/sql";
import { users } from "../db/schemas/user.schema";

export class StreakService {
  /**
   * Record user activity and update streak
   * @param userId The user ID
   * @returns The updated streak information
   */
  async recordActivity(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    streakUpdated: boolean;
  }> {
    const today = new Date();
    const yesterday = subDays(today, 1);

    // Get the user's streak record
    const userStreak = await db
      .select({
        id: streaks.id,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        lastActivityDate: streaks.lastActivityDate,
      })
      .from(streaks)
      .where(eq(streaks.userId, userId))
      .limit(1);

    // If no streak record exists, create one with a streak of 1
    if (userStreak.length === 0) {
      // Use upsert to handle potential race conditions
      await db
        .insert(streaks)
        .values({
          id: createId(),
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
        })
        .onConflictDoUpdate({
          target: streaks.userId,
          set: {
            // If there's a conflict, we'll just update the lastActivityDate
            lastActivityDate: today,
            updatedAt: today,
          },
        });

      // Fetch the record again to get accurate values in case of concurrent operations
      const newStreak = await db
        .select({
          currentStreak: streaks.currentStreak,
          longestStreak: streaks.longestStreak,
        })
        .from(streaks)
        .where(eq(streaks.userId, userId))
        .limit(1);

      return {
        currentStreak: newStreak[0]?.currentStreak || 1,
        longestStreak: newStreak[0]?.longestStreak || 1,
        streakUpdated: true,
      };
    }

    const streak = userStreak[0];
    const lastActivityDate = new Date(streak.lastActivityDate);

    // If the user already logged activity today, no streak update needed
    if (isSameDay(lastActivityDate, today)) {
      return {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        streakUpdated: false,
      };
    }

    // If the user was active yesterday, increment the streak
    if (isSameDay(lastActivityDate, yesterday)) {
      const currentStreak = streak.currentStreak + 1;
      const longestStreak = Math.max(currentStreak, streak.longestStreak);

      await db
        .update(streaks)
        .set({
          currentStreak,
          longestStreak,
          lastActivityDate: today,
          updatedAt: today,
        })
        .where(eq(streaks.id, streak.id));

      return {
        currentStreak,
        longestStreak,
        streakUpdated: true,
      };
    }

    // If more than a day has passed, reset the streak to 1
    await db
      .update(streaks)
      .set({
        currentStreak: 1,
        lastActivityDate: today,
        updatedAt: today,
      })
      .where(eq(streaks.id, streak.id));

    return {
      currentStreak: 1,
      longestStreak: streak.longestStreak,
      streakUpdated: true,
    };
  }

  /**
   * Check if a user has been active today
   * @param userId The user ID
   * @returns Whether the user has been active today
   */
  async hasActivityToday(userId: string): Promise<boolean> {
    const today = startOfDay(new Date());

    const todayActivity = await db
      .select({ id: activityLog.id })
      .from(activityLog)
      .where(
        and(eq(activityLog.userId, userId), gte(activityLog.createdAt, today)),
      )
      .limit(1);

    return todayActivity.length > 0;
  }

  /**
   * Get a user's current streak information
   * @param userId The user ID
   * @returns The user's streak information
   */
  async getUserStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
  } | null> {
    const userStreak = await db
      .select({
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        lastActivityDate: streaks.lastActivityDate,
      })
      .from(streaks)
      .where(eq(streaks.userId, userId))
      .limit(1);

    if (userStreak.length === 0) {
      return null;
    }

    return {
      currentStreak: userStreak[0].currentStreak,
      longestStreak: userStreak[0].longestStreak,
      lastActivityDate: new Date(userStreak[0].lastActivityDate),
    };
  }

  /**
   * Check and update streaks for all users
   * This should be run once per day to reset streaks for inactive users
   */
  async checkAndUpdateAllStreaks(): Promise<void> {
    const today = new Date();
    const yesterday = subDays(today, 1);

    // Get all users with streaks
    const allStreaks = await db
      .select({
        id: streaks.id,
        lastActivityDate: streaks.lastActivityDate,
      })
      .from(streaks);

    // Use a transaction for batch updates
    await db.transaction(async (tx) => {
      for (const streak of allStreaks) {
        const lastActivityDate = new Date(streak.lastActivityDate);

        // If the user wasn't active yesterday, reset their streak
        if (
          !isSameDay(lastActivityDate, yesterday) &&
          !isSameDay(lastActivityDate, today)
        ) {
          await tx
            .update(streaks)
            .set({
              currentStreak: 0, // Reset to 0 since they haven't been active today yet
              lastActivityDate: today,
              updatedAt: today,
            })
            .where(eq(streaks.id, streak.id));
        }
      }
    });
  }

  /**
   * Get users with the longest current streaks
   * @param limit Maximum number of users to return
   * @returns Users with the longest streaks
   */
  async getTopStreaks(limit = 10): Promise<
    {
      userId: string;
      name: string;
      avatarUrl?: string;
      currentStreak: number;
      longestStreak: number;
    }[]
  > {
    // Join with users table to get names and avatars for better display
    const topStreaks = await db
      .select({
        userId: streaks.userId,
        name: sql<string>`users.name`,
        avatarUrl: sql<string | null>`users.avatar_url`,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
      })
      .from(streaks)
      .innerJoin(users, eq(streaks.userId, sql`users.id`))
      .orderBy(desc(streaks.currentStreak))
      .limit(limit);
      
    // Convert null avatarUrl to undefined to match the return type
    return topStreaks.map(streak => ({
      ...streak,
      avatarUrl: streak.avatarUrl || undefined,
    }));
  }
}

// Create and export a singleton instance
export const streakService = new StreakService();
