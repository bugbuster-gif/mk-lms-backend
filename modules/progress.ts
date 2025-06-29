import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
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
import { statsService } from "../services/stats.service";
import { activityService } from "../services/activity.service";
import { achievementService } from "../services/achievement.service";
import { ActivityType } from "../db/schemas/activity-log.schema";

export const progress = new Elysia({ prefix: "/progress" })
  .use(clerkPlugin())
  .get(
    "/lessons/:lessonId",
    async ({ params: { lessonId }, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

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

        return { data: newProgress };
      }

      return { data: progress[0] };
    },
    {
      params: t.Object({
        lessonId: t.String(),
      }),
    },
  )
  .get(
    "/lessons/:lessonId/questions",
    async ({ params: { lessonId }, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

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

      return { data };
    },
    {
      params: t.Object({
        lessonId: t.String(),
      }),
    },
  )
  .get(
    "/courses/:courseId/lessons",
    async ({ params: { courseId }, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
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
          set.status = 404;
          return { error: "Course not found or has no lessons" };
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

        return { data: progressData };
      } catch (error) {
        console.error("Error fetching course lesson progress:", error);
        set.status = 500;
        return { error: "Failed to fetch course lesson progress" };
      }
    },
    {
      params: t.Object({
        courseId: t.String(),
      }),
    },
  )
  .post(
    "/lessons/:lessonId/progress",
    async ({ params: { lessonId }, body, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const { contentProgress, timeSpent } = body;

      // Get lesson to check if it has questions
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .execute();

      if (!lesson) {
        set.status = 404;
        return { error: "Lesson not found" };
      }

      // Get current progress to check if lesson was already completed
      const [currentProgress] = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.lessonId, lessonId),
            eq(lessonProgress.userId, auth.userId)
          )
        )
        .execute();
      
      const wasAlreadyCompleted = currentProgress?.status === LessonStatus.COMPLETED;

      let status = LessonStatus.IN_PROGRESS;
      let completedAt = null;
      let isNewlyCompleted = false;

      // If lesson has no questions, mark as completed when content is finished
      if (!lesson.hasQuestions && contentProgress === 100) {
        status = LessonStatus.COMPLETED;
        completedAt = new Date();
        isNewlyCompleted = !wasAlreadyCompleted;
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
          isNewlyCompleted = !wasAlreadyCompleted;
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
            timeSpent: timeSpent || sql`${lessonProgress.timeSpent}`,
            completedAt,
            updatedAt: new Date(),
          },
        })
        .returning();

      // If the lesson was newly completed, award points and log activity
      if (isNewlyCompleted) {
        try {
          // Calculate points based on lesson difficulty or length
          // For now, using a simple formula: 10 points + 1 point per minute of lesson duration
          const points = Math.min(50, Math.max(10, 10 + Math.floor(lesson.duration / 60)));
          
          // Award points and log activity
          await statsService.addPoints(
            auth.userId,
            points,
            ActivityType.LESSON_COMPLETED,
            lessonId
          );
          
          // Increment lessons completed count
          await statsService.incrementLessonsCompleted(auth.userId);
          
          // Add time spent to user stats
          if (timeSpent) {
            await statsService.addTimeSpent(auth.userId, timeSpent);
          }
          
          // Check for achievements
          await achievementService.checkAndAwardAchievements(auth.userId);
        } catch (error) {
          console.error("Error updating gamification stats:", error);
          // Don't fail the request if gamification updates fail
        }
      } else if (contentProgress > 0 && status === LessonStatus.IN_PROGRESS) {
        // Log progress activity (with fewer points) for partial completion
        try {
          // Only log progress activity if progress increased significantly (>20%)
          if (!currentProgress || contentProgress - (currentProgress.contentProgress || 0) >= 20) {
            const progressPoints = Math.min(5, Math.max(1, Math.floor(contentProgress / 20)));
            
            await statsService.addPoints(
              auth.userId,
              progressPoints,
              ActivityType.LESSON_PROGRESS,
              lessonId
            );
            
            // Add time spent to user stats
            if (timeSpent) {
              await statsService.addTimeSpent(auth.userId, timeSpent);
            }
          }
        } catch (error) {
          console.error("Error updating progress stats:", error);
        }
      }

      return { data: progress };
    },
    {
      params: t.Object({
        lessonId: t.String(),
      }),
      body: t.Object({
        contentProgress: t.Number({ minimum: 0, maximum: 100 }),
        timeSpent: t.Optional(t.Number()),
      }),
    },
  );
