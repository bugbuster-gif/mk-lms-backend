import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { and, eq, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { lessons, requestLessonSchema } from "../db/schemas/lesson.schema";
import { db } from "../db/db";
import { Roles } from "../utils/enums";
import { courses } from "../db/schemas/course.schema";

const app = new Hono()
  .get("/:courseId", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const courseId = c.req.param("courseId");

    if (!courseId) {
      return c.json({ error: "Course ID is required" }, 400);
    }

    const data = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    return c.json({ data });
  })
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", requestLessonSchema.extend({ courseId: z.string() })),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      const {
        courseId,
        title,
        description,
        videoUrl,
        files,
        gallery,
        duration,
      } = c.req.valid("json");

      if (!courseId) {
        return c.json({ error: "Course ID is required" }, 400);
      }

      try {
        const result = await db.transaction(async (trx) => {
          const [newLesson] = await trx
            .insert(lessons)
            .values({
              id: createId(),
              courseId,
              title,
              description,
              videoUrl,
              files,
              gallery,
              duration,
            })
            .returning({
              id: lessons.id,
              title: lessons.title,
              duration: lessons.duration,
              courseId: lessons.courseId,
            });

          await trx
            .update(courses)
            .set({
              lessonsCount: sql`${courses.lessonsCount} + 1`,
              length: sql`${courses.length} + ${newLesson.duration}`,
            })
            .where(eq(courses.id, courseId));

          return newLesson;
        });

        return c.json({ data: result });
      } catch (error) {
        console.error("Error during transaction:", error);
        return c.json(
          { error: "An error occurred while adding the lesson" },
          500,
        );
      }
    },
  )
  .put(
    "/:id",
    clerkMiddleware(),
    zValidator("json", requestLessonSchema.extend({ id: z.string() })),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      const { id, title, description, videoUrl, files, duration } =
        c.req.valid("json");

      const [existingLesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, id));

      if (!existingLesson) {
        return c.json({ error: "Lesson not found" }, 404);
      }

      try {
        const updatedLesson = await db.transaction(async (trx) => {
          const [updatedLesson] = await trx
            .update(lessons)
            .set({
              title,
              description,
              videoUrl,
              files,
              duration,
            })
            .where(eq(lessons.id, id))
            .returning({
              id: lessons.id,
              title: lessons.title,
              duration: lessons.duration,
              courseId: lessons.courseId,
            });

          if (existingLesson.duration !== updatedLesson.duration) {
            const durationDifference =
              updatedLesson.duration - existingLesson.duration;

            await trx
              .update(courses)
              .set({
                length: sql`${courses.length} + ${durationDifference}`,
              })
              .where(eq(courses.id, updatedLesson.courseId));
          }

          return updatedLesson;
        });

        return c.json({ data: updatedLesson });
      } catch (error) {
        console.error("Error during transaction:", error);
        return c.json(
          { error: "An error occurred while updating the lesson" },
          500,
        );
      }
    },
  )
  .get(
    "/lesson/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { id } = c.req.param();

      const [data] = await db.select().from(lessons).where(eq(lessons.id, id));

      if (!data) {
        return c.json({ error: "Lesson not found" }, 404);
      }

      return c.json({ data });
    },
  )
  .patch(
    "/reorder",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        courseId: z.string(),
        lessonsList: z.array(
          z.object({ id: z.string(), order: z.coerce.number() }),
        ),
      }),
    ),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      const { lessonsList, courseId } = c.req.valid("json");

      const updatedLessons = await db.transaction(async (tx) => {
        const updates = lessonsList.map((lesson) =>
          tx
            .update(lessons)
            .set({ order: lesson.order })
            .where(
              and(eq(lessons.id, lesson.id), eq(lessons.courseId, courseId)),
            )
            .returning({
              id: lessons.id,
              title: lessons.title,
              duration: lessons.duration,
              order: lessons.order,
              courseId: lessons.courseId,
            }),
        );

        return Promise.all(updates);
      });

      const flattenedUpdatedLessons = updatedLessons.flat();

      return c.json({ data: flattenedUpdatedLessons });
    },
  );

export default app;
