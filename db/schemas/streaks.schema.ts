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

export const streaks = pgTable(
  "streaks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    currentStreak: integer("current_streak").default(0).notNull(),
    longestStreak: integer("longest_streak").default(0).notNull(),
    lastActivityDate: timestamp("last_activity_date").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("streaks_user_id_idx").on(table.userId),
    userIdUnique: unique().on(table.userId), // Each user can only have one streak record
  })
);

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
}));

// Schema for inserting/updating streaks
export const upsertStreaksSchema = createInsertSchema(streaks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
