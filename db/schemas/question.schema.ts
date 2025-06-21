import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { lessons } from "./lesson.schema";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { questionProgress } from "./question-progress.schema";

// Define the answer type
const answerSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

export type Answer = z.infer<typeof answerSchema>;

export const questions = pgTable(
  "questions",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .references(() => lessons.id)
      .notNull(),
    questionText: text("question_text").notNull(),
    answers: jsonb("answers").$type<Answer[]>().notNull(),
    order: integer("order").notNull().default(0),
    explanation: text("explanation"),
    hints: jsonb("hints").$type<string[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
  },
  (table) => ({
    lessonIdIdx: index("question_lesson_id_idx").on(table.lessonId),
    orderIdx: index("question_order_idx").on(table.order),
  }),
);

export const questionRelations = relations(questions, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [questions.lessonId],
    references: [lessons.id],
  }),
  progress: many(questionProgress),
}));

// Schema for inserting questions
export const insertQuestionSchema = createInsertSchema(questions, {
  answers: answerSchema.array(),
  hints: z.string().array().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  lessonId: true,
});

// Schema for validating answers
export const validateAnswerSchema = z.object({
  questionId: z.string(),
  answerId: z.string(),
});
