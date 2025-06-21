import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./user.schema";
import { lessons } from "./lesson.schema";
import { z } from "zod";
import { relations } from "drizzle-orm";

export enum LessonStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

// Define the lesson status enum
export const lessonStatusEnum = pgEnum("lesson_status", [
  LessonStatus.NOT_STARTED,
  LessonStatus.IN_PROGRESS,
  LessonStatus.COMPLETED,
]);

// Define the question progress type
const questionProgressSchema = z.object({
  total: z.number(),
  completed: z.number(),
});

export type QuestionProgress = z.infer<typeof questionProgressSchema>;

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    lessonId: text("lesson_id")
      .references(() => lessons.id)
      .notNull(),
    status: lessonStatusEnum("status")
      .default(LessonStatus.NOT_STARTED)
      .notNull(),
    contentProgress: integer("content_progress").default(0).notNull(),
    questionProgress: jsonb("question_progress")
      .$type<QuestionProgress>()
      .default({ total: 0, completed: 0 })
      .notNull(),
    attempts: integer("attempts").default(0).notNull(),
    timeSpent: integer("time_spent").default(0).notNull(), // in seconds
    completedAt: timestamp("completed_at"),
    lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdLessonIdUnique: unique().on(table.userId, table.lessonId),
    userIdIdx: index("lesson_progress_user_id_idx").on(table.userId),
    lessonIdIdx: index("lesson_progress_lesson_id_idx").on(table.lessonId),
  }),
);

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(users, {
    fields: [lessonProgress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
}));

// Schema for inserting/updating lesson progress
export const upsertLessonProgressSchema = createInsertSchema(lessonProgress, {
  questionProgress: questionProgressSchema,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
