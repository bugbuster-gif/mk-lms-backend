import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./user.schema";
import { achievements } from "./achievements.schema";
import { relations } from "drizzle-orm";

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    achievementId: text("achievement_id")
      .references(() => achievements.id)
      .notNull(),
    earnedAt: timestamp("earned_at").defaultNow().notNull(),
    notified: boolean("notified").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_achievements_user_id_idx").on(table.userId),
    achievementIdIdx: index("user_achievements_achievement_id_idx").on(table.achievementId),
    uniqueUserAchievement: unique().on(table.userId, table.achievementId), // Each user can earn an achievement only once
  })
);

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

// Schema for inserting/updating user achievements
export const upsertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
