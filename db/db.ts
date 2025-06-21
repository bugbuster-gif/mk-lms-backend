import { drizzle } from "drizzle-orm/node-postgres";
import * as courses from "./schemas/course.schema";
import * as enrollments from "./schemas/enrollment.schema";
import * as lessons from "./schemas/lesson.schema";
import * as users from "./schemas/user.schema";
import * as questions from "./schemas/question.schema";
import * as tickets from "./schemas/ticket.schema";
import * as lessonProgress from "./schemas/lesson-progress.schema";
import * as questionProgress from "./schemas/question-progress.schema";

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...courses,
    ...enrollments,
    ...lessons,
    ...users,
    ...questions,
    ...tickets,
    ...lessonProgress,
    ...questionProgress,
  },
});
