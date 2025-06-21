import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { courses } from "./course.schema";
import { questions } from "./question.schema";
import { lessonProgress } from "./lesson-progress.schema";

export const lessons = pgTable(
  "lessons",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .references(() => courses.id)
      .notNull(),
    title: varchar("title", { length: 200 }).notNull().unique(),
    description: text("description").notNull(),
    videoUrl: varchar("video_url", { length: 255 }).notNull().default(""),
    duration: integer("duration").notNull().default(0),
    files: json("files").default([]),
    gallery: json("gallery").default([]),
    order: integer("order").notNull().default(0),
    hasQuestions: boolean("has_questions").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    courseIdIdx: index("course_id_idx").on(table.courseId),
    orderIdx: index("lesson_order_idx").on(table.order),
  }),
);

export const lessonRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  questions: many(questions),
  progress: many(lessonProgress),
}));

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const requestLessonSchema = insertLessonSchema.pick({
  title: true,
  description: true,
  videoUrl: true,
  files: true,
  duration: true,
  gallery: true,
  order: true,
});
