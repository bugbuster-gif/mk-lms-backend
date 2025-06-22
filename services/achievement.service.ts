import { db } from "../db/db";
import {
  achievements,
  AchievementType,
} from "../db/schemas/achievements.schema";
import { userAchievements } from "../db/schemas/user-achievements.schema";
import { userStats } from "../db/schemas/user-stats.schema";
import { streaks } from "../db/schemas/streaks.schema";
import { eq, and, gte, not, inArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { statsService } from "./stats.service";
import { activityLog, ActivityType } from "../db/schemas/activity-log.schema";

/**
 * Service for managing user achievements
 * Handles checking, awarding, and retrieving achievements
 */
export class AchievementService {
  /**
   * Check and award achievements for a user
   * @param userId The user ID
   * @returns Newly awarded achievements
   */
  async checkAndAwardAchievements(userId: string): Promise<{
    newAchievements: Array<{
      id: string;
      name: string;
      description: string;
      pointsAwarded: number;
    }>;
  }> {
    // Get user stats
    const userStat = await statsService.getUserStats(userId);
    if (!userStat) {
      return { newAchievements: [] };
    }

    // Get user's current achievements
    const userAchievementRecords = await db
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    const userAchievementIds = userAchievementRecords.map(
      (record) => record.achievementId,
    );

    // Get all achievements the user doesn't have yet
    const availableAchievements = await db
      .select()
      .from(achievements)
      .where(
        userAchievementIds.length > 0
          ? not(inArray(achievements.id, userAchievementIds))
          : undefined,
      );

    const newAchievements: {
      id: string;
      name: string;
      description: string;
      pointsAwarded: number;
    }[] = [];

    // Use a transaction for awarding achievements
    await db.transaction(async (tx) => {
      // Check each achievement
      for (const achievement of availableAchievements) {
        let isEarned = false;

        switch (achievement.type) {
          case AchievementType.LESSON_COMPLETION:
            isEarned = userStat.lessonsCompleted >= achievement.threshold;
            break;

          case AchievementType.COURSE_COMPLETION:
            isEarned = userStat.coursesCompleted >= achievement.threshold;
            break;

          case AchievementType.STREAK: {
            // Get user streak
            const userStreak = await tx
              .select({
                currentStreak: streaks.currentStreak,
              })
              .from(streaks)
              .where(eq(streaks.userId, userId))
              .limit(1);

            if (userStreak.length > 0) {
              isEarned = userStreak[0].currentStreak >= achievement.threshold;
            }
            break;
          }

          case AchievementType.TIME_SPENT:
            isEarned = userStat.totalTimeSpent >= achievement.threshold;
            break;

          case AchievementType.PERFECT_SCORE:
            // This would require additional logic to check for perfect course completion
            // For now, we'll skip this type
            break;
        }

        // If the achievement is earned, award it
        if (isEarned) {
          const achievementId = createId();

          await tx.insert(userAchievements).values({
            id: achievementId,
            userId,
            achievementId: achievement.id,
            earnedAt: new Date(),
            notified: false,
          });

          // Log the activity using the EARN_ACHIEVEMENT activity type
          await tx.insert(activityLog).values({
            id: createId(),
            userId,
            type: ActivityType.EARN_ACHIEVEMENT,
            entityId: achievement.id,
            points: achievement.pointsAwarded,
          });

          // Add achievement points to user stats
          await statsService.addPoints(
            userId,
            achievement.pointsAwarded,
            ActivityType.EARN_ACHIEVEMENT,
            achievement.id,
          );

          newAchievements.push({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            pointsAwarded: achievement.pointsAwarded,
          });
        }
      }
    });

    return { newAchievements };
  }

  /**
   * Get all available achievements
   * @returns List of all achievements
   */
  async getAllAchievements() {
    return db.select().from(achievements);
  }

  /**
   * Get achievements earned by a user
   * @param userId The user ID
   * @returns User's earned achievements with details
   */
  async getUserAchievements(userId: string) {
    return db
      .select({
        id: achievements.id,
        name: achievements.name,
        description: achievements.description,
        type: achievements.type,
        iconUrl: achievements.iconUrl,
        earnedAt: userAchievements.earnedAt,
      })
      .from(userAchievements)
      .innerJoin(
        achievements,
        eq(userAchievements.achievementId, achievements.id),
      )
      .where(eq(userAchievements.userId, userId));
  }

  /**
   * Get unnotified achievements for a user and mark them as notified
   * @param userId The user ID
   * @returns Unnotified achievements
   */
  async getUnnotifiedAchievements(userId: string) {
    const unnotified = await db
      .select({
        id: achievements.id,
        name: achievements.name,
        description: achievements.description,
        type: achievements.type,
        iconUrl: achievements.iconUrl,
        earnedAt: userAchievements.earnedAt,
        userAchievementId: userAchievements.id,
      })
      .from(userAchievements)
      .innerJoin(
        achievements,
        eq(userAchievements.achievementId, achievements.id),
      )
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.notified, false),
        ),
      );

    // Use a transaction to mark achievements as notified
    if (unnotified.length > 0) {
      await db.transaction(async (tx) => {
        for (const achievement of unnotified) {
          await tx
            .update(userAchievements)
            .set({ notified: true })
            .where(eq(userAchievements.id, achievement.userAchievementId));
        }
      });
    }

    return unnotified.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      type: a.type,
      iconUrl: a.iconUrl,
      earnedAt: a.earnedAt,
    }));
  }

  /**
   * Create a new achievement
   * @param achievementData The achievement data
   * @returns The created achievement
   */
  async createAchievement(achievementData: {
    name: string;
    description: string;
    type: AchievementType;
    threshold: number;
    pointsAwarded: number;
    iconUrl?: string;
  }) {
    const id = createId();

    await db.insert(achievements).values({
      id,
      ...achievementData,
    });

    return {
      id,
      ...achievementData,
    };
  }
}

// Create and export a singleton instance
export const achievementService = new AchievementService();
