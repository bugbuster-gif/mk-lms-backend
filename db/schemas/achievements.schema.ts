import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Define achievement types as an enum
export enum AchievementType {
  LESSON_COMPLETION = "lesson_completion",
  COURSE_COMPLETION = "course_completion",
  STREAK = "streak",
  TIME_SPENT = "time_spent",
  PERFECT_SCORE = "perfect_score",
}

// Create a PostgreSQL enum for achievement types
export const achievementTypeEnum = pgEnum("achievement_type", [
  AchievementType.LESSON_COMPLETION,
  AchievementType.COURSE_COMPLETION,
  AchievementType.STREAK,
  AchievementType.TIME_SPENT,
  AchievementType.PERFECT_SCORE,
]);

export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  type: achievementTypeEnum("type").notNull(),
  threshold: integer("threshold").notNull(), // e.g., 5 for "Complete 5 lessons"
  pointsAwarded: integer("points_awarded").default(0).notNull(),
  iconUrl: varchar("icon_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema for inserting/updating achievements
export const upsertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
