import { userStats } from "../db/schemas/user-stats.schema";
import { activityLog, ActivityType } from "../db/schemas/activity-log.schema";
import { desc, eq, sql, and, or, inArray } from "drizzle-orm";
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
   * @param limit Maximum number of entries to return
   * @param offset Pagination offset
   * @returns Leaderboard entries with rank information
   */
  async getLeaderboard(
    limit = 10,
    offset = 0
  ): Promise<LeaderboardEntry[]> {
    return this.getLeaderboardInternal({
      limit,
      offset,
      timeframe: "all"
    });
  }

  /**
   * Get weekly leaderboard
   * @param limit Maximum number of entries to return
   * @param offset Pagination offset
   * @returns Weekly leaderboard entries with rank information
   */
  async getWeeklyLeaderboard(
    limit = 10,
    offset = 0
  ): Promise<LeaderboardEntry[]> {
    return this.getLeaderboardInternal({
      limit,
      offset,
      timeframe: "weekly"
    });
  }

  /**
   * Get monthly leaderboard
   * @param limit Maximum number of entries to return
   * @param offset Pagination offset
   * @returns Monthly leaderboard entries with rank information
   */
  async getMonthlyLeaderboard(
    limit = 10,
    offset = 0
  ): Promise<LeaderboardEntry[]> {
    return this.getLeaderboardInternal({
      limit,
      offset,
      timeframe: "monthly"
    });
  }

  /**
   * Get course-specific leaderboard
   * @param courseId Course ID to get leaderboard for
   * @param limit Maximum number of entries to return
   * @param offset Pagination offset
   * @returns Course-specific leaderboard entries with rank information
   */
  async getCourseLeaderboard(
    courseId: string,
    limit = 10,
    offset = 0
  ): Promise<LeaderboardEntry[]> {
    // Get all activities related to this course
    const courseActivities = await db
      .select({
        userId: activityLog.userId,
        totalPoints: sql<number>`SUM(${activityLog.points})`,
      })
      .from(activityLog)
      .where(
        and(
          eq(activityLog.entityId, courseId),
          or(
            eq(activityLog.type, ActivityType.LESSON_PROGRESS),
            eq(activityLog.type, ActivityType.LESSON_COMPLETED),
            eq(activityLog.type, ActivityType.COURSE_COMPLETED)
          )
        )
      )
      .groupBy(activityLog.userId)
      .orderBy(desc(sql`SUM(${activityLog.points})`))
      .limit(limit)
      .offset(offset);

    // If no activities found for this course, return empty array
    if (courseActivities.length === 0) {
      return [];
    }

    // Get user details for the leaderboard
    const userIds = courseActivities.map(activity => activity.userId);
    
    const userDetails = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(inArray(users.id, userIds));

    // Create a map of user details for quick lookup
    const userMap = new Map(
      userDetails.map(user => [user.id, { name: user.name, avatarUrl: user.avatarUrl }])
    );

    // Combine course activities with user details to create leaderboard entries
    return courseActivities.map((activity, index) => {
      const user = userMap.get(activity.userId);
      return {
        userId: activity.userId,
        name: user?.name || "Unknown User",
        avatarUrl: user?.avatarUrl || undefined,
        rank: offset + index + 1,
        points: Number(activity.totalPoints),
      };
    });
  }

  /**
   * Get user statistics
   * @param userId User ID to get statistics for
   * @returns User statistics including points, ranks, and completion counts
   */
  async getUserStats(userId: string): Promise<{
    totalPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
    rank: number;
    lessonsCompleted: number;
    coursesCompleted: number;
    totalTimeSpent: number;
    updatedAt: Date;
  } | null> {
    const stats = await db
      .select({
        totalPoints: userStats.totalPoints,
        weeklyPoints: userStats.weeklyPoints,
        monthlyPoints: userStats.monthlyPoints,
        lessonsCompleted: userStats.lessonsCompleted,
        coursesCompleted: userStats.coursesCompleted,
        totalTimeSpent: userStats.totalTimeSpent,
        updatedAt: userStats.updatedAt,
      })
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);

    if (stats.length === 0) {
      return null;
    }

    // Get user's rank
    const rank = await this.getUserRank(userId);

    return {
      ...stats[0],
      rank,
      totalPoints: Number(stats[0].totalPoints),
      weeklyPoints: Number(stats[0].weeklyPoints),
      monthlyPoints: Number(stats[0].monthlyPoints),
      lessonsCompleted: Number(stats[0].lessonsCompleted),
      coursesCompleted: Number(stats[0].coursesCompleted),
      totalTimeSpent: Number(stats[0].totalTimeSpent),
      updatedAt: new Date(stats[0].updatedAt),
    };
  }

  /**
   * Get a user's rank based on total points
   * @param userId User ID to get rank for
   * @returns User's current rank
   */
  private async getUserRank(userId: string): Promise<number> {
    // Count how many users have more points than this user
    const result = await db
      .select({
        rank: sql<number>`COUNT(*) + 1`,
      })
      .from(userStats)
      .where(
        sql`${userStats.totalPoints} > (
          SELECT ${userStats.totalPoints} 
          FROM ${userStats} 
          WHERE ${userStats.userId} = ${userId}
        )`
      );

    return Number(result[0]?.rank || 1);
  }

  /**
   * Internal method to get leaderboard with various filtering options
   */
  private async getLeaderboardInternal(
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
}

// Create and export a singleton instance
export const statsService = new StatsService();
