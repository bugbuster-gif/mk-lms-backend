import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, sql, inArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../db/db";
import {
  lessonProgress,
  LessonStatus,
} from "../db/schemas/lesson-progress.schema";
import { questionProgress } from "../db/schemas/question-progress.schema";
import { questions } from "../db/schemas/question.schema";
import { lessons } from "../db/schemas/lesson.schema";

const app = new Hono()
  // Get progress for a specific lesson
  .get(
    "/lessons/:lessonId",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        lessonId: z.string(),
      }),
    ),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { lessonId } = c.req.valid("param");

      // Get lesson progress
      const progress = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.lessonId, lessonId),
            eq(lessonProgress.userId, auth.userId),
          ),
        )
        .execute();

      if (!progress.length) {
        // Create initial progress record
        const [newProgress] = await db
          .insert(lessonProgress)
          .values({
            id: createId(),
            userId: auth.userId,
            lessonId,
            status: LessonStatus.NOT_STARTED,
            contentProgress: 0,
            timeSpent: 0,
          })
          .returning();

        return c.json({ data: newProgress });
      }

      return c.json({ data: progress[0] });
    },
  )
  // Update lesson progress
  .post(
    "/lessons/:lessonId/progress",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        lessonId: z.string(),
      }),
    ),
    zValidator(
      "json",
      z.object({
        contentProgress: z.number().min(0).max(100),
        timeSpent: z.number().optional(),
      }),
    ),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { lessonId } = c.req.valid("param");
      const { contentProgress, timeSpent } = c.req.valid("json");

      // Get lesson to check if it has questions
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .execute();

      if (!lesson) {
        return c.json({ error: "Lesson not found" }, 404);
      }

      let status = LessonStatus.IN_PROGRESS;
      let completedAt = null;

      // If lesson has no questions, mark as completed when content is finished
      if (!lesson.hasQuestions && contentProgress === 100) {
        status = LessonStatus.COMPLETED;
        completedAt = new Date();
      }
      // If lesson has questions, check question progress
      else if (lesson.hasQuestions && contentProgress === 100) {
        // Get all questions for this lesson
        const lessonQuestions = await db
          .select()
          .from(questions)
          .where(eq(questions.lessonId, lessonId))
          .execute();

        // Get completed questions
        const completedQuestions = await db
          .select()
          .from(questionProgress)
          .where(
            and(
              eq(questionProgress.userId, auth.userId),
              eq(questionProgress.isCorrect, true),
              inArray(
                questionProgress.questionId,
                lessonQuestions.map((q) => q.id),
              ),
            ),
          )
          .execute();

        // If all questions are completed, mark lesson as completed
        if (
          completedQuestions.length === lessonQuestions.length &&
          lessonQuestions.length > 0
        ) {
          status = LessonStatus.COMPLETED;
          completedAt = new Date();
        }
      }

      // Update progress
      const [progress] = await db
        .insert(lessonProgress)
        .values({
          id: createId(),
          userId: auth.userId,
          lessonId,
          status,
          contentProgress,
          timeSpent: timeSpent || 0,
          completedAt,
        })
        .onConflictDoUpdate({
          target: [lessonProgress.userId, lessonProgress.lessonId],
          set: {
            status,
            contentProgress,
            timeSpent: 0,
            completedAt,
            updatedAt: new Date(),
          },
        })
        .returning();

      return c.json({ data: progress });
    },
  )
  // Get question progress for a lesson
  .get(
    "/lessons/:lessonId/questions",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        lessonId: z.string(),
      }),
    ),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { lessonId } = c.req.valid("param");

      // Get all questions for the lesson
      const lessonQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.lessonId, lessonId))
        .orderBy(questions.order)
        .execute();

      // Get progress for these questions
      const questionProgressData = await db
        .select()
        .from(questionProgress)
        .where(
          and(
            eq(questionProgress.userId, auth.userId),
            eq(questionProgress.isCorrect, true),
          ),
        )
        .execute();

      // Map questions with their progress
      const data = lessonQuestions.map((question) => {
        const progress = questionProgressData.find(
          (p) => p.questionId === question.id,
        );

        return {
          questionId: question.id,
          order: question.order,
          completed: !!progress,
          attempts: progress?.attemptCount || 0,
          completedAt: progress?.completedAt || null,
        };
      });

      return c.json({ data });
    },
  )
  .get(
    "/courses/:courseId/lessons",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        courseId: z.string(),
      }),
    ),
    async (c) => {
      const auth = getAuth(c);
      const { courseId } = c.req.valid("param");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        // Get all lessons for the course with their progress
        const courseLessonsWithProgress = await db.query.lessons.findMany({
          where: eq(lessons.courseId, courseId),
          orderBy: lessons.order,
          with: {
            progress: {
              where: eq(lessonProgress.userId, auth.userId),
            },
            questions: true,
          },
        });

        if (courseLessonsWithProgress.length === 0) {
          return c.json({ error: "Course not found or has no lessons" }, 404);
        }

        // Get completed questions count for each lesson
        const completedQuestions = await db
          .select({
            lessonId: questions.lessonId,
            completedCount: sql<number>`count(*)`,
          })
          .from(questionProgress)
          .innerJoin(questions, eq(questions.id, questionProgress.questionId))
          .where(
            and(
              eq(questionProgress.userId, auth.userId),
              eq(questionProgress.isCorrect, true),
            ),
          )
          .groupBy(questions.lessonId);

        const completedQuestionsMap = new Map(
          completedQuestions.map((q) => [q.lessonId, q.completedCount]),
        );

        // Build response data
        const progressData: Record<
          string,
          {
            status: LessonStatus;
            contentProgress: number;
            questionProgress: { total: number; completed: number } | null;
            timeSpent: number;
          }
        > = {};

        for (const lesson of courseLessonsWithProgress) {
          const progress = lesson.progress[0];
          const totalQuestions = lesson.questions.length;
          const completedCount = completedQuestionsMap.get(lesson.id) ?? 0;

          if (!progress) {
            // Create new progress record if it doesn't exist
            const newProgress = await db
              .insert(lessonProgress)
              .values({
                id: createId(),
                userId: auth.userId,
                lessonId: lesson.id,
                status: LessonStatus.NOT_STARTED,
                contentProgress: 0,
                timeSpent: 0,
                lastAccessedAt: new Date(),
              })
              .returning();

            progressData[lesson.id] = {
              status: newProgress[0].status,
              contentProgress: newProgress[0].contentProgress,
              questionProgress: lesson.hasQuestions
                ? { total: totalQuestions, completed: 0 }
                : null,
              timeSpent: newProgress[0].timeSpent,
            };
          } else {
            progressData[lesson.id] = {
              status: progress.status,
              contentProgress: progress.contentProgress,
              questionProgress: lesson.hasQuestions
                ? {
                    total: totalQuestions,
                    completed: completedCount,
                  }
                : null,
              timeSpent: progress.timeSpent,
            };
          }
        }

        return c.json({ data: progressData });
      } catch (error) {
        console.error("Error fetching course lesson progress:", error);
        return c.json({ error: "Failed to fetch course lesson progress" }, 500);
      }
    },
  );

export default app;
