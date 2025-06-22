import { userStats } from "../db/schemas/user-stats.schema";
import { activityLog, ActivityType } from "../db/schemas/activity-log.schema";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/db";
import { createId } from "@paralleldrive/cuid2";
import { users } from "../db/schemas/user.schema";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl?: string;
  rank: number;
  points: number;
}

export interface LeaderboardOptions {
  limit?: number;
  offset?: number;
  timeframe?: "all" | "weekly" | "monthly";
  courseId?: string;
}

export class StatsService {
  /**
   * Add points to a user's stats and log the activity
   */
  async addPoints(
    userId: string,
    points: number,
    activityType: ActivityType,
    entityId?: string,
  ): Promise<void> {
    // First, log the activity
    await db.insert(activityLog).values({
      id: createId(),
      userId,
      type: activityType,
      entityId,
      points,
    });

    // Then update the user stats - use upsert to reduce queries
    await db
      .insert(userStats)
      .values({
        id: createId(),
        userId,
        totalPoints: points,
        weeklyPoints: points,
        monthlyPoints: points,
      })
      .onConflictDoUpdate({
        target: userStats.userId,
        set: {
          totalPoints: sql`${userStats.totalPoints} + ${points}`,
          weeklyPoints: sql`${userStats.weeklyPoints} + ${points}`,
          monthlyPoints: sql`${userStats.monthlyPoints} + ${points}`,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Increment a user's lesson completion count
   */
  async incrementLessonsCompleted(userId: string): Promise<void> {
    // Use upsert to reduce queries
    await db
      .insert(userStats)
      .values({
        id: createId(),
        userId,
        lessonsCompleted: 1,
      })
      .onConflictDoUpdate({
        target: userStats.userId,
        set: {
          lessonsCompleted: sql`${userStats.lessonsCompleted} + 1`,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Increment a user's course completion count
   */
  async incrementCoursesCompleted(userId: string): Promise<void> {
    // Use upsert to reduce queries
    await db
      .insert(userStats)
      .values({
        id: createId(),
        userId,
        coursesCompleted: 1,
      })
      .onConflictDoUpdate({
        target: userStats.userId,
        set: {
          coursesCompleted: sql`${userStats.coursesCompleted} + 1`,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Add time spent to a user's total time spent
   */
  async addTimeSpent(userId: string, seconds: number): Promise<void> {
    // Use upsert to reduce queries
    await db
      .insert(userStats)
      .values({
        id: createId(),
        userId,
        totalTimeSpent: seconds,
      })
      .onConflictDoUpdate({
        target: userStats.userId,
        set: {
          totalTimeSpent: sql`${userStats.totalTimeSpent} + ${seconds}`,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Get global leaderboard
   */
  async getLeaderboard(
    options: LeaderboardOptions = {},
  ): Promise<LeaderboardEntry[]> {
    const { limit = 10, offset = 0, timeframe = "all", courseId } = options;

    // Select the appropriate points column based on timeframe
    const pointsColumn =
      timeframe === "weekly"
        ? userStats.weeklyPoints
        : timeframe === "monthly"
          ? userStats.monthlyPoints
          : userStats.totalPoints;

    // Join with users table to get names and avatars
    const leaderboard = await db
      .select({
        userId: userStats.userId,
        name: sql<string>`users.name`,
        avatarUrl: sql<string | null>`users.avatar_url`,
        points: pointsColumn,
      })
      .from(userStats)
      .innerJoin(users, eq(userStats.userId, sql`users.id`))
      .orderBy(desc(pointsColumn))
      .limit(limit)
      .offset(offset);

    // Add rank to each entry
    return leaderboard.map((entry, index) => {
      return {
        userId: entry.userId,
        name: entry.name,
        avatarUrl: entry.avatarUrl || undefined,
        rank: offset + index + 1,
        points: Number(entry.points),
      };
    });
  }

  /**
   * Reset weekly points for all users
   */
  async resetWeeklyPoints(): Promise<void> {
    await db.update(userStats).set({
      weeklyPoints: 0,
      updatedAt: new Date(),
    });
  }

  /**
   * Reset monthly points for all users
   */
  async resetMonthlyPoints(): Promise<void> {
    await db.update(userStats).set({
      monthlyPoints: 0,
      updatedAt: new Date(),
    });
  }

  /**
   * Recalculate and update user ranks
   */
  async updateRanks(): Promise<void> {
    // This operation is inefficient with individual updates
    // Consider using a database function or batch update if available
    
    // Get all users ordered by total points
    const rankedUsers = await db
      .select({
        id: userStats.id,
        totalPoints: userStats.totalPoints,
      })
      .from(userStats)
      .orderBy(desc(userStats.totalPoints));

    // Use a transaction for batch updates
    await db.transaction(async (tx) => {
      for (let i = 0; i < rankedUsers.length; i++) {
        await tx
          .update(userStats)
          .set({
            rank: i + 1,
            updatedAt: new Date(),
          })
          .where(eq(userStats.id, rankedUsers[i].id));
      }
    });
  }

  /**
   * Get a user's stats
   */
  async getUserStats(userId: string) {
    const stats = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);

    return stats[0] || null;
  }
}

// Create and export a singleton instance
export const statsService = new StatsService();
