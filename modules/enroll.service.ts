import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import { Resend } from "resend";
import axios from "axios";
import { config } from "dotenv";
import { db } from "../db/db";
import { enrollments } from "../db/schemas/enrollment.schema";
import { courses } from "../db/schemas/course.schema";
import { users } from "../db/schemas/user.schema";
import { EnrollmentStatus, PaymentStatus } from "../utils/enums";
import { lessons } from "../db/schemas/lesson.schema";
import { lessonProgress, LessonStatus } from "../db/schemas/lesson-progress.schema";
import { EnrollEmail } from "../components/enroll-email";

config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const resend = new Resend(process.env.RESEND_API_KEY);

const app = new Hono()
  .get("/", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const data = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, auth.userId));

    return c.json({ data });
  })
  .get(
    "/:courseId",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        courseId: z.string(),
      }),
    ),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { courseId } = c.req.valid("param");

      const data = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, auth.userId),
            eq(enrollments.courseId, courseId),
          ),
        );

      if (data.length === 0) {
        return c.json({
          data: {
            status: EnrollmentStatus.WITHDRAWN,
          },
        });
      }

      const result = data?.[0];

      return c.json({ data: result });
    },
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        courseId: z.string(),
        reference: z.string(),
      }),
    ),
    async (c) => {
      try {
        const auth = getAuth(c);

        if (!auth?.userId) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const { courseId, reference } = c.req.valid("json");

        const response = await axios.get(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
          },
        );

        const paymentData = response.data?.data;

        if (!paymentData || paymentData.status !== "success") {
          return c.json(
            { error: "Payment verification failed or payment not successful" },
            400,
          );
        }

        const [course] = await db
          .select()
          .from(courses)
          .where(eq(courses.id, courseId));

        if (!course) {
          return c.json({ error: "Course not found" }, 404);
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, auth.userId));

        if (!user) {
          return c.json({ error: "User not found" }, 404);
        }

        // Start a transaction to handle enrollment and initial lesson progress
        const data = await db.transaction(async (trx) => {
          // Create enrollment
          const [enrollment] = await trx
            .insert(enrollments)
            .values({
              id: createId(),
              userId: auth.userId,
              courseId,
              status: EnrollmentStatus.ENROLLED,
              paymentStatus: PaymentStatus.PAID,
            })
            .returning();

          // Get all lessons for the course
          const courseLessons = await trx
            .select()
            .from(lessons)
            .where(eq(lessons.courseId, courseId))
            .orderBy(lessons.order);

          // Initialize lesson progress for all lessons
          await Promise.all(
            courseLessons.map((lesson) =>
              trx.insert(lessonProgress).values({
                id: createId(),
                userId: auth.userId,
                lessonId: lesson.id,
                status: LessonStatus.NOT_STARTED,
                contentProgress: 0,
                timeSpent: 0,
              }),
            ),
          );

          return enrollment;
        });

        try {
          const htmlContent = EnrollEmail({
            courseLength: course.length,
            instructorName: course.instructorName,
            courseDescription: course.description,
            courseName: course.title,
            courseLevel: course.level,
            lessonCount: course.lessonsCount,
            studentName: user.name,
            courseId: course.id,
          });

          await resend.emails.send({
            from: "Law Tech University <noreply@trainings.lawyershub.org>",
            to: user.email,
            subject: `You've been enrolled in ${course.title}`,
            html: htmlContent,
          });
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
          return c.json({
            data,
            warning: "Enrollment succeeded but failed to send email",
          });
        }

        return c.json({ data });
      } catch (error) {
        console.error("Error during enrollment process:", error);
        return c.json(
          { error: "An unexpected error occurred. Please try again later." },
          500,
        );
      }
    },
  )
  .patch(
    "/status/:id",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        status: z.nativeEnum(EnrollmentStatus),
        id: z.string(),
      }),
    ),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { status, id } = c.req.valid("json");

      const [data] = await db
        .update(enrollments)
        .set({
          status,
        })
        .where(eq(enrollments.id, id))
        .returning({
          id: enrollments.id,
          userId: enrollments.userId,
          courseId: enrollments.courseId,
          status: enrollments.status,
        });

      return c.json({ data });
    },
  )
  .get("/user", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [data] = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, auth.userId));

    if (!data) return c.json({ error: "Enrollment not found" }, 404);

    return c.json({ data });
  });

export default app;
