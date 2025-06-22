import { db } from "../db/db";
import { activityLog, ActivityType } from "../db/schemas/activity-log.schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { startOfDay, subDays } from "date-fns";
import { statsService } from "./stats.service";
import { streakService } from "./streak.service";
import { users } from "../db/schemas/user.schema";

/**
 * Service for managing user activity logs and points
 * Handles recording activities, calculating points, and retrieving activity history
 */
export class ActivityService {
  /**
   * Log a user activity and award points
   * @param userId The user ID
   * @param type The activity type
   * @param entityId Optional ID of the related entity (lesson, course, etc.)
   * @returns The activity log entry ID
   */
  async logActivity(
    userId: string,
    type: ActivityType,
    entityId?: string,
  ): Promise<string> {
    // Calculate points based on activity type
    const points = this.calculatePoints(type);
    
    // Generate activity ID
    const activityId = createId();
    
    // Use a transaction to ensure all operations succeed or fail together
    await db.transaction(async (tx) => {
      // Log the activity
      await tx.insert(activityLog).values({
        id: activityId,
        userId,
        type,
        entityId,
        points,
      });
      
      // Update user stats with points
      await statsService.addPoints(userId, points, type, entityId);
      
      // Update user streak
      await streakService.recordActivity(userId);
    });
    
    return activityId;
  }
  
  /**
   * Calculate points for an activity type
   * @param type The activity type
   * @returns The points awarded for this activity
   */
  private calculatePoints(type: ActivityType): number {
    switch (type) {
      case ActivityType.LESSON_PROGRESS:
        return 5; // Base points for lesson progress
        
      case ActivityType.LESSON_COMPLETED:
        return 10; // Points for completing a lesson
      
      case ActivityType.COURSE_COMPLETED:
        return 100; // Base points for completing a course
      
      case ActivityType.COURSE_ENROLLED:
        return 5; // Points for enrolling in a course
        
      case ActivityType.LOGIN:
        return 1; // Points for logging in
        
      case ActivityType.EARN_ACHIEVEMENT:
        return 20; // Base points for earning an achievement
        
      case ActivityType.MAINTAIN_STREAK:
        return 5; // Points for maintaining a streak
        
      default:
        return 0;
    }
  }
  
  /**
   * Get user activity history
   * @param userId The user ID
   * @param limit Maximum number of activities to return
   * @param offset Pagination offset
   * @returns User activity history with timestamps converted to Date objects
   */
  async getUserActivityHistory(
    userId: string,
    limit = 10,
    offset = 0,
  ): Promise<
    {
      id: string;
      type: ActivityType;
      entityId?: string;
      points: number;
      createdAt: Date;
    }[]
  > {
    const activities = await db
      .select({
        id: activityLog.id,
        type: activityLog.type,
        entityId: activityLog.entityId,
        points: activityLog.points,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
      .offset(offset);
    
    return activities.map((activity) => ({
      ...activity,
      entityId: activity.entityId || undefined,
      createdAt: new Date(activity.createdAt),
    }));
  }
  
  /**
   * Get recent activities across all users
   * @param limit Maximum number of activities to return
   * @returns Recent activities with user information and timestamps converted to Date objects
   */
  async getRecentActivities(limit = 20): Promise<
    {
      id: string;
      userId: string;
      userName: string;
      userAvatarUrl?: string;
      type: ActivityType;
      points: number;
      createdAt: Date;
    }[]
  > {
    const activities = await db
      .select({
        id: activityLog.id,
        userId: activityLog.userId,
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
        type: activityLog.type,
        points: activityLog.points,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .innerJoin(users, eq(activityLog.userId, users.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
    
    return activities.map((activity) => ({
      ...activity,
      userAvatarUrl: activity.userAvatarUrl || undefined,
      createdAt: new Date(activity.createdAt),
    }));
  }
  
  /**
   * Award daily login points
   * This should be run once per day for users who log in
   * @param userId The user ID
   * @returns Whether points were awarded (false if already awarded today)
   */
  async awardLoginPoints(userId: string): Promise<boolean> {
    const today = new Date();
    
    // Check if the user has already received login points today
    const existingPoints = await db
      .select({ id: activityLog.id })
      .from(activityLog)
      .where(
        and(
          eq(activityLog.userId, userId),
          eq(activityLog.type, ActivityType.LOGIN),
          gte(activityLog.createdAt, startOfDay(today)),
        ),
      )
      .limit(1);
    
    // If user hasn't received login points today, award them
    if (existingPoints.length === 0) {
      const activityId = createId();
      const loginPoints = this.calculatePoints(ActivityType.LOGIN);
      
      await db.transaction(async (tx) => {
        // Log the login activity
        await tx.insert(activityLog).values({
          id: activityId,
          userId,
          type: ActivityType.LOGIN,
          points: loginPoints,
        });
        
        // Update user stats
        await statsService.addPoints(
          userId, 
          loginPoints, 
          ActivityType.LOGIN
        );
        
        // Update user streak
        await streakService.recordActivity(userId);
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Award streak maintenance points
   * This should be run once per day for users who maintain their streaks
   * @returns The number of users who were awarded streak points
   */
  async awardStreakPoints(): Promise<number> {
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    // Get users who were active yesterday
    const activeUsers = await db
      .select({
        userId: activityLog.userId,
      })
      .from(activityLog)
      .where(
        and(
          gte(activityLog.createdAt, startOfDay(yesterday)),
          sql`${activityLog.createdAt} < ${startOfDay(today)}`,
        ),
      )
      .groupBy(activityLog.userId);
    
    let awardedCount = 0;
    
    // Award streak points to each active user
    await db.transaction(async (tx) => {
      for (const user of activeUsers) {
        // Check if the user has already received streak points today
        const existingPoints = await tx
          .select({ id: activityLog.id })
          .from(activityLog)
          .where(
            and(
              eq(activityLog.userId, user.userId),
              eq(activityLog.type, ActivityType.MAINTAIN_STREAK),
              gte(activityLog.createdAt, startOfDay(today)),
            ),
          )
          .limit(1);
        
        // If user hasn't received streak points today, award them
        if (existingPoints.length === 0) {
          const activityId = createId();
          const streakPoints = this.calculatePoints(ActivityType.MAINTAIN_STREAK);
          
          // Log the streak maintenance activity
          await tx.insert(activityLog).values({
            id: activityId,
            userId: user.userId,
            type: ActivityType.MAINTAIN_STREAK,
            points: streakPoints,
          });
          
          // Update user stats
          await statsService.addPoints(
            user.userId, 
            streakPoints, 
            ActivityType.MAINTAIN_STREAK
          );
          
          awardedCount++;
        }
      }
    });
    
    return awardedCount;
  }
}

// Create and export a singleton instance
export const activityService = new ActivityService();
