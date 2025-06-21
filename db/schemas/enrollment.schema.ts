import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { EnrollmentStatus, PaymentStatus } from "../../utils/enums";
import { users } from "./user.schema";
import { courses } from "./course.schema";

export const enrollments = pgTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    courseId: text("course_id")
      .references(() => courses.id)
      .notNull(),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
    status: varchar("status", {
      enum: [
        EnrollmentStatus.ENROLLED,
        EnrollmentStatus.COMPLETED,
        EnrollmentStatus.WITHDRAWN,
      ],
    }).notNull(),
    paymentStatus: varchar("payment_status", {
      enum: [PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.FAILED],
    })
      .notNull()
      .default(PaymentStatus.PENDING),
    progress: integer("progress").notNull().default(0),
  },
  (table) => ({
    enrollmentUserIdIdx: index("enrollment_user_id_idx").on(table.userId),
    enrollmentCourseIdIdx: index("enrollment_course_id_idx").on(table.courseId),
    unq: unique().on(table.userId, table.courseId),
  }),
);
