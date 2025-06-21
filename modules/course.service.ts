import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../db/db";
import { enrollments } from "../db/schemas/enrollment.schema";
import { courses } from "../db/schemas/course.schema";
import { lessons } from "../db/schemas/lesson.schema";
import {
  lessonProgress,
  LessonStatus,
} from "../db/schemas/lesson-progress.schema";
import { questions } from "../db/schemas/question.schema";
import { questionProgress } from "../db/schemas/question-progress.schema";
import { Context } from "hono";
import { requestCourseSchema } from "../db/schemas/course.schema";
import {
  CourseStatus,
  EnrollmentStatus,
  PaymentStatus,
  Roles,
} from "../utils/enums";
import { users } from "../db/schemas/user.schema";

// Refactor route handlers into separate functions

// Function to get all courses
async function getAllCoursesHandler(c: Context) {
  try {
    const data = await db.select().from(courses);
    return c.json({ data });
  } catch (error) {
    return c.json({ error: "Failed to fetch courses" }, 500);
  }
}

// Function to get top courses
async function getTopCoursesHandler(c: Context) {
  try {
    const data = await db.select().from(courses).limit(3);
    return c.json({ data });
  } catch (error) {
    return c.json({ error: "Failed to fetch top courses" }, 500);
  }
}

// Function to open a course by ID
async function openCourseByIdHandler(c: Context) {
  try {
    const { id } = c.req.param();
    const data = await db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        lessons: {
          columns: {
            title: true,
            description: true,
            duration: true,
            order: true,
          },
        },
      },
    });
    if (!data) {
      return c.json({ error: "Course not found" }, 404);
    }
    return c.json({ data });
  } catch (error) {
    return c.json({ error: "Failed to open course" }, 500);
  }
}

async function getPurchasedCoursesHandler(c: Context) {
  try {
    const { id: courseId } = c.req.param();
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // First verify if the user is enrolled in this course
    const enrollment = await db
      .select({
        id: enrollments.id,
        paymentStatus: enrollments.paymentStatus,
        status: enrollments.status,
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, auth.userId),
          eq(enrollments.courseId, courseId),
        ),
      )
      .execute();

    if (!enrollment.length) {
      return c.json({ error: "Not enrolled in this course" }, 403);
    }

    // Get course details
    const course = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        imageUrl: courses.imageUrl,
        level: courses.level,
        tags: courses.tags,
        isCertified: courses.isCertified,
        length: courses.length,
        lessonsCount: courses.lessonsCount,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .execute();

    if (!course.length) {
      return c.json({ error: "Course not found" }, 404);
    }

    // Get lessons with their progress and question counts
    const lessonsWithProgress = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        description: lessons.description,
        videoUrl: lessons.videoUrl,
        duration: lessons.duration,
        order: lessons.order,
        files: lessons.files,
        gallery: lessons.gallery,
        hasQuestions: lessons.hasQuestions,
        totalQuestions: sql<number>`(SELECT COUNT(*) FROM ${questions} WHERE ${questions.lessonId} = ${lessons.id})`,
        completedQuestions: sql<number>`(
          SELECT COUNT(DISTINCT ${questionProgress.questionId})
          FROM ${questionProgress}
          INNER JOIN ${questions} ON ${questions.id} = ${questionProgress.questionId}
          WHERE ${questions.lessonId} = ${lessons.id}
          AND ${questionProgress.userId} = ${auth.userId}
          AND ${questionProgress.isCorrect} = true
        )`,
        progress: {
          status: lessonProgress.status,
          contentProgress: lessonProgress.contentProgress,
          timeSpent: lessonProgress.timeSpent,
          completedAt: lessonProgress.completedAt,
        },
      })
      .from(lessons)
      .leftJoin(
        lessonProgress,
        and(
          eq(lessonProgress.lessonId, lessons.id),
          eq(lessonProgress.userId, auth.userId),
        ),
      )
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.order)
      .execute();

    // Format the response
    const formattedCourse = {
      ...course[0],
      enrollmentId: enrollment[0].id,
      paymentStatus: enrollment[0].paymentStatus,
      lessons: lessonsWithProgress.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        order: lesson.order,
        files: lesson.files,
        gallery: lesson.gallery,
        hasQuestions: lesson.hasQuestions,
        progress: {
          ...(lesson.progress || {
            status: LessonStatus.NOT_STARTED,
            contentProgress: 0,
            timeSpent: 0,
            completedAt: null,
          }),
          questionProgress: lesson.hasQuestions
            ? {
                total: Number(lesson.totalQuestions),
                completed: Number(lesson.completedQuestions),
              }
            : null,
        },
      })),
    };

    return c.json({ data: formattedCourse });
  } catch (error) {
    console.error("Error fetching purchased course:", error);
    return c.json(
      { error: "An error occurred while fetching the course" },
      500,
    );
  }
}

// Function to get a course by ID
async function getCourseByIdHandler(c: Context) {
  try {
    const { id } = c.req.param();
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthenticated" }, 401);
    }

    const isAdmin = [Roles.ADMIN, Roles.MODERATOR].includes(
      auth.sessionClaims?.metadata?.role as Roles,
    );

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        lessons: true,
      },
    });

    if (!course) {
      return c.json({ error: "Course not found" }, 404);
    }

    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.courseId, id),
        eq(enrollments.userId, auth.userId),
      ),
    });

    const isPurchased = enrollment?.paymentStatus === PaymentStatus.PAID;

    let responseData = isPurchased
      ? {
          ...course,
          isPurchased,
        }
      : {
          ...course,
          isPurchased,
          lessons:
            isAdmin || isPurchased
              ? course.lessons
              : course.lessons.map(
                  ({ title, description, order, id, videoUrl }) => ({
                    title,
                    description,
                    order,
                    id,
                    videoUrl,
                  }),
                ),
        };

    return c.json({ data: responseData });
  } catch (error) {
    return c.json({ error: "Failed to fetch course" }, 500);
  }
}

// Function to get a course by ID for admin
async function getCourseByIdForAdminHandler(c: Context) {
  try {
    const { id } = c.req.param();
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthenticated" }, 401);
    }

    const isAdmin = [Roles.ADMIN, Roles.MODERATOR].includes(
      auth.sessionClaims?.metadata?.role as Roles,
    );

    if (!isAdmin) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        lessons: true,
      },
    });

    return c.json({ data: course });
  } catch (error) {
    return c.json({ error: "Failed to fetch course for admin" }, 500);
  }
}

// Function to create a course
async function createCourseHandler(c: Context) {
  try {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthenticated" }, 401);
    }

    if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN) {
      return c.json({ error: "Only Admins can create courses" }, 403);
    }

    // Use the defined schema for validation
    const { title, description, level, price, discount, imageUrl, tags } =
      await c.req.json();

    const [instructor] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.userId));

    if (!instructor) return c.json({ error: "No user found" }, 404);

    const { name, avatarUrl, id } = instructor;

    const [data] = await db
      .insert(courses)
      .values({
        id: createId(),
        title,
        description,
        instructorId: id,
        instructorName: name,
        instructorAvatarUrl: avatarUrl ?? "",
        level,
        price,
        discount,
        imageUrl,
        tags,
      })
      .returning({
        id: courses.id,
        title: courses.title,
      });

    return c.json({ data });
  } catch (error) {
    return c.json({ error: "Failed to create course" }, 500);
  }
}

// Function to update a course
async function updateCourseHandler(c: Context) {
  try {
    const auth = getAuth(c);

    if (!auth?.userId) return c.json({ error: "Unauthenticated" }, 401);

    if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN)
      return c.json({ error: "Unauthorized" }, 403);

    // Use the defined schema for validation
    const { id, title, description, level, price, discount, imageUrl, tags } =
      await c.req.json();

    const [data] = await db.select().from(courses).where(eq(courses.id, id));

    if (!data) return c.json({ error: "Course not found" }, 404);

    const [updatedCourse] = await db
      .update(courses)
      .set({
        title,
        description,
        level,
        price,
        discount,
        imageUrl,
        tags,
      })
      .where(eq(courses.id, id))
      .returning({
        id: courses.id,
        title: courses.title,
      });

    return c.json({ data: updatedCourse });
  } catch (error) {
    return c.json({ error: "Failed to update course" }, 500);
  }
}

// Function to update a course status
async function updateCourseStatusHandler(c: Context) {
  try {
    const auth = getAuth(c);

    if (!auth?.userId) return c.json({ error: "Unauthenticated" }, 401);

    if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN)
      return c.json({ error: "Unauthorized" }, 403);

    const { id, status } = await c.req.json<{
      id: string;
      status: CourseStatus;
    }>();

    const [data] = await db.select().from(courses).where(eq(courses.id, id));

    if (!data) return c.json({ error: "Course not found" }, 404);

    const [updatedCourse] = await db
      .update(courses)
      .set({
        status,
      })
      .where(eq(courses.id, id))
      .returning({
        id: courses.id,
        title: courses.title,
      });

    return c.json({ data: updatedCourse });
  } catch (error) {
    return c.json({ error: "Failed to update course status" }, 500);
  }
}

// Update app routes to use the new handler functions
const app = new Hono()
  .get("/", getAllCoursesHandler)
  .get("/top", getTopCoursesHandler)
  .get(
    "/open/:id",
    zValidator("param", z.object({ id: z.string() })),
    openCourseByIdHandler,
  )
  .get(
    "/purchased/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string() })),
    getPurchasedCoursesHandler,
  )
  .get(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string() })),
    getCourseByIdHandler,
  )
  .get(
    "/admin/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string() })),
    getCourseByIdForAdminHandler,
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", requestCourseSchema),
    createCourseHandler,
  )
  .post(
    "/update",
    clerkMiddleware(),
    zValidator("json", requestCourseSchema.extend({ id: z.string() })),
    updateCourseHandler,
  );

export default app;
