import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./user.schema";
import { relations } from "drizzle-orm";

// Define activity types as an enum
export enum ActivityType {
  LESSON_PROGRESS = "lesson_progress",
  COURSE_ENROLLED = "course_enrolled",
  COURSE_COMPLETED = "course_completed",
  LOGIN = "login",
}

// Create a PostgreSQL enum for activity types
export const activityTypeEnum = pgEnum("activity_type", [
  ActivityType.LESSON_PROGRESS,
  ActivityType.COURSE_ENROLLED,
  ActivityType.COURSE_COMPLETED,
  ActivityType.LOGIN,
]);

export const activityLog = pgTable(
  "activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    type: activityTypeEnum("type").notNull(),
    entityId: text("entity_id"), // ID of related entity (lesson, course)
    points: integer("points").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("activity_log_user_id_idx").on(table.userId),
    createdAtIdx: index("activity_log_created_at_idx").on(table.createdAt),
    userCreatedAtIdx: index("activity_log_user_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

// Schema for inserting activity logs
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});
