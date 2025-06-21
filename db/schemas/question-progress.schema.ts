import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./user.schema";
import { questions } from "./question.schema";
import { relations } from "drizzle-orm";

export const questionProgress = pgTable(
  "question_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    questionId: text("question_id")
      .references(() => questions.id)
      .notNull(),
    selectedAnswerId: text("selected_answer_id").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    attemptCount: integer("attempt_count").default(1).notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdQuestionIdUnique: unique().on(table.userId, table.questionId),
    userIdIdx: index("question_progress_user_id_idx").on(table.userId),
    questionIdIdx: index("question_progress_question_id_idx").on(
      table.questionId,
    ),
  }),
);

export const questionProgressRelations = relations(
  questionProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [questionProgress.userId],
      references: [users.id],
    }),
    question: one(questions, {
      fields: [questionProgress.questionId],
      references: [questions.id],
    }),
  }),
);

// Schema for inserting/updating question progress
export const upsertQuestionProgressSchema = createInsertSchema(
  questionProgress,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
