import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./user.schema";
import { relations } from "drizzle-orm";

export const userStats = pgTable(
  "user_stats",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    totalPoints: integer("total_points").default(0).notNull(),
    weeklyPoints: integer("weekly_points").default(0).notNull(),
    monthlyPoints: integer("monthly_points").default(0).notNull(),
    rank: integer("rank"),
    lessonsCompleted: integer("lessons_completed").default(0).notNull(),
    coursesCompleted: integer("courses_completed").default(0).notNull(),
    totalTimeSpent: integer("total_time_spent").default(0).notNull(), // in seconds
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_stats_user_id_idx").on(table.userId),
    userIdUnique: unique().on(table.userId), // Each user can only have one stats record
  })
);

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

// Schema for inserting/updating user stats
export const upsertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
