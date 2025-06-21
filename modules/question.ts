import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { and, eq, sql, or } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

import { db } from "../db/db";
import { questions, Answer } from "../db/schemas/question.schema";
import { lessons } from "../db/schemas/lesson.schema";
import { questionProgress } from "../db/schemas/question-progress.schema";

export const question = new Elysia({ prefix: "/questions" })
  .use(clerkPlugin())
  // Get questions for a lesson
  .get(
    "/lesson/:lessonId",
    async ({ params: { lessonId }, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const data = await db
        .select()
        .from(questions)
        .where(
          and(eq(questions.lessonId, lessonId), eq(questions.isDeleted, false)),
        )
        .orderBy(questions.order);

      // Don't expose correct answers in the response
      return {
        data: data.map((question) => ({
          id: question.id,
          questionText: question.questionText,
          answers: question.answers.map((answer: Answer) => ({
            id: answer.id,
            text: answer.text,
            isCorrect: answer.isCorrect,
          })),
          explanation: question.explanation,
          hints: question.hints,
          order: question.order,
          lessonId: question.lessonId,
        })),
      };
    },
    {
      params: t.Object({
        lessonId: t.String(),
      }),
    },
  )
  // Create a new question for a lesson
  .post(
    "/lesson/:lessonId",
    async ({ params: { lessonId }, body, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      // Verify lesson exists
      const lessonExists = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .execute();

      if (!lessonExists.length) {
        set.status = 404;
        return { error: "Lesson not found" };
      }

      // Get highest order number for this lesson
      const maxOrder = await db
        .select({ maxOrder: sql<number>`MAX(${questions.order})` })
        .from(questions)
        .where(eq(questions.lessonId, lessonId))
        .execute();

      const nextOrder = Number(maxOrder[0]?.maxOrder ?? 0) + 1;

      const [question] = await db
        .insert(questions)
        .values({
          id: createId(),
          lessonId,
          ...body,
          order: nextOrder,
        })
        .returning();

      // Update lesson to indicate it has questions
      await db
        .update(lessons)
        .set({ hasQuestions: true })
        .where(eq(lessons.id, lessonId));

      return { data: question };
    },
    {
      params: t.Object({
        lessonId: t.String(),
      }),
      body: t.Object({
        questionText: t.String(),
        answers: t.Array(
          t.Object({
            id: t.String(),
            text: t.String(),
            isCorrect: t.Boolean(),
          }),
        ),
        explanation: t.String(),
        hints: t.Optional(t.Array(t.String())),
      }),
    },
  )
  // Submit an answer to a question
  .post(
    "/:questionId/answer",
    async ({ params: { questionId }, body, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const { answerId } = body;

      // Get question and verify answer
      const question = await db
        .select()
        .from(questions)
        .where(eq(questions.id, questionId))
        .execute();

      if (!question.length) {
        set.status = 404;
        return { error: "Question not found" };
      }

      const correctAnswer = question[0].answers.find(
        (answer: Answer) => answer.isCorrect,
      );
      const isCorrect = answerId === correctAnswer?.id;

      // Record the answer
      await db
        .insert(questionProgress)
        .values({
          id: createId(),
          userId: auth.userId,
          questionId,
          selectedAnswerId: answerId,
          isCorrect,
          completedAt: isCorrect ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: [questionProgress.userId, questionProgress.questionId],
          set: {
            selectedAnswerId: answerId,
            isCorrect,
            attemptCount: sql`${questionProgress.attemptCount} + 1`,
            completedAt: isCorrect ? new Date() : null,
            updatedAt: new Date(),
          },
        });

      return {
        isCorrect,
        explanation: isCorrect ? question[0].explanation : null,
      };
    },
    {
      params: t.Object({
        questionId: t.String(),
      }),
      body: t.Object({
        answerId: t.String(),
      }),
    },
  )
  // Submit multiple answers at once
  .post(
    "/lesson/:lessonId/submit-answers",
    async ({ params: { lessonId }, body, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      try {
        const { answers } = body;

        // Start a transaction to handle all submissions atomically
        const result = await db.transaction(async (trx) => {
          // Get all questions and their correct answers in one query
          const questionsData = await trx
            .select({
              id: questions.id,
              answers: questions.answers,
              lessonId: questions.lessonId,
            })
            .from(questions)
            .where(
              and(
                eq(questions.isDeleted, false),
                or(...answers.map((a) => eq(questions.id, a.questionId))),
              ),
            );

          // Create a map for quick lookup
          const questionsMap = new Map(questionsData.map((q) => [q.id, q]));

          // Get existing progress records for this user and these questions
          const existingProgress = await trx
            .select()
            .from(questionProgress)
            .where(
              and(
                eq(questionProgress.userId, auth.userId),
                or(
                  ...answers.map((a) =>
                    eq(questionProgress.questionId, a.questionId),
                  ),
                ),
              ),
            );

          const existingProgressMap = new Map(
            existingProgress.map((p) => [p.questionId, p]),
          );

          // Separate into updates and inserts
          const updates: { questionId: string; answerId: string }[] = [];
          const inserts: { questionId: string; answerId: string }[] = [];

          answers.forEach((answer) => {
            if (existingProgressMap.has(answer.questionId)) {
              updates.push(answer);
            } else {
              inserts.push(answer);
            }
          });

          // Process updates
          for (const answer of updates) {
            const question = questionsMap.get(answer.questionId);
            if (!question) {
              throw new Error(`Question ${answer.questionId} not found`);
            }

            const isCorrect = question.answers.some(
              (a: Answer) => a.id === answer.answerId && a.isCorrect,
            );

            await trx
              .update(questionProgress)
              .set({
                selectedAnswerId: answer.answerId,
                isCorrect,
                completedAt: new Date(),
              })
              .where(
                and(
                  eq(questionProgress.userId, auth.userId),
                  eq(questionProgress.questionId, answer.questionId),
                ),
              );
          }

          // Process inserts
          if (inserts.length > 0) {
            const insertRecords = inserts.map((answer) => {
              const question = questionsMap.get(answer.questionId);
              if (!question) {
                throw new Error(`Question ${answer.questionId} not found`);
              }

              const isCorrect = question.answers.some(
                (a: Answer) => a.id === answer.answerId && a.isCorrect,
              );

              return {
                id: createId(),
                userId: auth.userId,
                questionId: answer.questionId,
                selectedAnswerId: answer.answerId,
                isCorrect,
                submittedAt: new Date(),
              };
            });

            await trx.insert(questionProgress).values(insertRecords);
          }

          // Return results summary
          return {
            total: answers.length,
            correct: answers.reduce((count, answer) => {
              const question = questionsMap.get(answer.questionId);
              if (!question) return count;
              return (
                count +
                (question.answers.some(
                  (a: Answer) => a.id === answer.answerId && a.isCorrect,
                )
                  ? 1
                  : 0)
              );
            }, 0),
            lessonId: questionsData[0]?.lessonId,
          };
        });

        return { data: result };
      } catch (error) {
        console.error("Error submitting answers:", error);
        set.status =
          error instanceof Error && error.message.includes("not found")
            ? 404
            : 500;
        return { error: "Failed to submit answers" };
      }
    },
    {
      params: t.Object({
        lessonId: t.String(),
      }),
      body: t.Object({
        answers: t.Array(
          t.Object({
            questionId: t.String(),
            answerId: t.String(),
          }),
        ),
      }),
    },
  )
  .put(
    "/reorder",
    async ({ body, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const { order, questionId } = body;

      const [question] = await db
        .update(questions)
        .set({ order })
        .where(eq(questions.id, questionId))
        .returning();

      return { data: question };
    },
    {
      body: t.Object({
        order: t.Number(),
        questionId: t.String(),
      }),
    },
  )
  .delete(
    "/:questionId",
    async ({ params: { questionId }, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      try {
        // Start a transaction to handle both question and progress deletion
        await db.transaction(async (trx) => {
          // Get the question and its lesson first
          const [question] = await trx
            .select({
              id: questions.id,
              lessonId: questions.lessonId,
              order: questions.order,
            })
            .from(questions)
            .where(eq(questions.id, questionId));

          if (!question) {
            throw new Error("Question not found");
          }

          // Delete all progress records for this question
          await trx
            .delete(questionProgress)
            .where(eq(questionProgress.questionId, questionId));

          // Delete the question
          await trx.delete(questions).where(eq(questions.id, questionId));

          // Reorder remaining questions
          await trx
            .update(questions)
            .set({
              order: sql`${questions.order} - 1`,
            })
            .where(
              and(
                eq(questions.lessonId, question.lessonId),
                sql`${questions.order} > ${question.order}`,
              ),
            );

          // Check if this was the last question in the lesson
          const remainingQuestions = await trx
            .select({ count: sql<number>`count(*)` })
            .from(questions)
            .where(eq(questions.lessonId, question.lessonId));

          // If no questions remain, update lesson hasQuestions flag
          if (remainingQuestions[0].count === 0) {
            await trx
              .update(lessons)
              .set({ hasQuestions: false })
              .where(eq(lessons.id, question.lessonId));
          }
        });

        return {
          message: "Question and related progress records deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting question:", error);
        set.status = 500;
        return { error: "Failed to delete question and progress records" };
      }
    },
    {
      params: t.Object({
        questionId: t.String(),
      }),
    },
  );
