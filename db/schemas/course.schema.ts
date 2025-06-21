import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { lessons } from "./lesson.schema";
import { CourseLevel, CourseStatus } from "../../utils/enums";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./user.schema";

export const courses = pgTable(
  "courses",
  {
    id: text("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull().unique(),
    description: text("description").notNull(),
    instructorId: text("instructor_id")
      .references(() => users.id)
      .notNull(),
    instructorName: varchar("instructor_name", { length: 100 }).notNull(),
    instructorAvatarUrl: varchar("instructor_avatar_url", {
      length: 255,
    }).notNull(),
    level: varchar("course_level", {
      enum: [
        CourseLevel.BEGINNER,
        CourseLevel.INTERMEDIATE,
        CourseLevel.ADVANCED,
      ],
    })
      .default(CourseLevel.BEGINNER)
      .notNull(),
    tags: jsonb("tags").notNull().default("[]"),
    status: varchar("status", {
      enum: [CourseStatus.DRAFT, CourseStatus.PUBLISHED, CourseStatus.ARCHIVED],
    })
      .default(CourseStatus.DRAFT)
      .notNull(),
    price: integer("price").default(0).notNull(),
    discount: integer("discount").default(0).notNull(),
    imageUrl: varchar("image_url", { length: 255 }).default("").notNull(),
    isCertified: boolean("is_certified").default(false).notNull(),
    length: integer("length").default(0).notNull(),
    lessonsCount: integer("lessons_count").default(0).notNull(),
    enrollmentsCount: integer("enrollments_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    titleIdx: index("title_idx").on(table.title),
    statusIdx: index("status_idx").on(table.status),
    levelIdx: index("level_idx").on(table.level),
  }),
);

export const courseRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
}));

export const insertCourseSchema = createInsertSchema(courses);

export const requestCourseSchema = insertCourseSchema.pick({
  title: true,
  description: true,
  level: true,
  price: true,
  discount: true,
  imageUrl: true,
  tags: true,
});
