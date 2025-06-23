import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import { Resend } from "resend";
import axios from "axios";
import { db } from "../db/db";
import { enrollments } from "../db/schemas/enrollment.schema";
import { courses } from "../db/schemas/course.schema";
import { users } from "../db/schemas/user.schema";
import { lessons } from "../db/schemas/lesson.schema";
import {
  lessonProgress,
  LessonStatus,
} from "../db/schemas/lesson-progress.schema";
import { EnrollmentStatus, PaymentStatus } from "../utils/enums";
import { EnrollEmail } from "../components/enroll-email";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const resend = new Resend(process.env.RESEND_API_KEY);

export const enroll = new Elysia({ prefix: "/enroll" })
  .use(clerkPlugin())
  .get("/", async ({ set, auth: getAuth }) => {
    const auth = getAuth();

    if (!auth?.userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const data = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, auth.userId));

    return { data };
  })
  .get(
    "/:courseId",
    async ({ params: { courseId }, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

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
        return {
          data: {
            status: EnrollmentStatus.WITHDRAWN,
          },
        };
      }

      const result = data?.[0];

      return { data: result };
    },
    {
      params: t.Object({
        courseId: t.String(),
      }),
    },
  )
  .get("/user", async ({ set, auth: getAuth }) => {
    const auth = getAuth();

    if (!auth?.userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const [data] = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, auth.userId));

    if (!data) {
      set.status = 404;
      return { error: "Enrollment not found" };
    }

    return { data };
  })
  .post(
    "/",
    async ({ body, set, auth: getAuth }) => {
      try {
        const auth = getAuth();

        if (!auth?.userId) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const { courseId, reference } = body;

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
          set.status = 400;
          return {
            error: "Payment verification failed or payment not successful",
          };
        }

        const [course] = await db
          .select()
          .from(courses)
          .where(eq(courses.id, courseId));

        if (!course) {
          set.status = 404;
          return { error: "Course not found" };
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, auth.userId));

        if (!user) {
          set.status = 404;
          return { error: "User not found" };
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
            from: "Ecobank Elevate <noreply@communication.devprodtest.services>",
            to: user.email,
            subject: `You've been enrolled in ${course.title}`,
            html: htmlContent,
          });
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
          return {
            data,
            warning: "Enrollment succeeded but failed to send email",
          };
        }

        return { data };
      } catch (error) {
        console.error("Error during enrollment process:", error);
        set.status = 500;
        return {
          error: "An unexpected error occurred. Please try again later.",
        };
      }
    },
    {
      body: t.Object({
        courseId: t.String(),
        reference: t.String(),
      }),
    },
  )
  .patch(
    "/status/:id",
    async ({ params: { id }, body, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const { status } = body;

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

      return { data };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        status: t.Enum(EnrollmentStatus),
      }),
    },
  );
