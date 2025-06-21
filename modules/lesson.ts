import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { and, eq, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

import { db } from "../db/db";
import { lessons } from "../db/schemas/lesson.schema";
import { courses } from "../db/schemas/course.schema";
import { Roles } from "../utils/enums";

export const lesson = new Elysia({ prefix: "/lessons" })
  .use(clerkPlugin())
  .get(
    "/:courseId",
    async ({ params: { courseId }, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      if (!courseId) {
        set.status = 400;
        return { error: "Course ID is required" };
      }

      const data = await db
        .select()
        .from(lessons)
        .where(eq(lessons.courseId, courseId));

      return { data };
    },
    {
      params: t.Object({
        courseId: t.String(),
      }),
    },
  )
  .get(
    "/lesson/:id",
    async ({ params: { id }, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const [data] = await db.select().from(lessons).where(eq(lessons.id, id));

      if (!data) {
        set.status = 404;
        return { error: "Lesson not found" };
      }

      return { data };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    "/",
    async ({ body, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN) {
        set.status = 403;
        return { error: "Unauthorized" };
      }

      const {
        courseId,
        title,
        description,
        videoUrl,
        files,
        gallery,
        duration,
      } = body;

      if (!courseId) {
        set.status = 400;
        return { error: "Course ID is required" };
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

        return { data: result };
      } catch (error) {
        console.error("Error during transaction:", error);
        set.status = 500;
        return { error: "An error occurred while adding the lesson" };
      }
    },
    {
      body: t.Object({
        courseId: t.String(),
        title: t.String(),
        description: t.String(),
        videoUrl: t.String(),
        files: t.Optional(t.Array(t.Object({
          name: t.String(),
          url: t.String(),
          type: t.String(),
        }))),
        gallery: t.Optional(t.Array(t.String())),
        duration: t.Number(),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params: { id }, body, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN) {
        set.status = 403;
        return { error: "Unauthorized" };
      }

      const { title, description, videoUrl, files, duration } = body;

      const [existingLesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, id));

      if (!existingLesson) {
        set.status = 404;
        return { error: "Lesson not found" };
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

        return { data: updatedLesson };
      } catch (error) {
        console.error("Error during transaction:", error);
        set.status = 500;
        return { error: "An error occurred while updating the lesson" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        title: t.String(),
        description: t.String(),
        videoUrl: t.String(),
        files: t.Optional(t.Array(t.Object({
          name: t.String(),
          url: t.String(),
          type: t.String(),
        }))),
        duration: t.Number(),
      }),
    },
  )
  .patch(
    "/reorder",
    async ({ body, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN) {
        set.status = 403;
        return { error: "Unauthorized" };
      }

      const { lessonsList, courseId } = body;

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

      return { data: flattenedUpdatedLessons };
    },
    {
      body: t.Object({
        courseId: t.String(),
        lessonsList: t.Array(
          t.Object({
            id: t.String(),
            order: t.Number(),
          }),
        ),
      }),
    },
  );
