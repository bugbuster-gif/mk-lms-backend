import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/db";
import { courses } from "../db/schemas/course.schema";
import { enrollments } from "../db/schemas/enrollment.schema";
import { lessons } from "../db/schemas/lesson.schema";
import {
  lessonProgress,
  LessonStatus,
} from "../db/schemas/lesson-progress.schema";
import { questions } from "../db/schemas/question.schema";
import { questionProgress } from "../db/schemas/question-progress.schema";
import { users } from "../db/schemas/user.schema";
import { CourseLevel, PaymentStatus, Roles } from "../utils/enums";
import { statsService } from "../services/stats.service";
import { achievementService } from "../services/achievement.service";
import { activityLog, ActivityType } from "../db/schemas/activity-log.schema";

export const course = new Elysia({ prefix: "/courses" })
  .use(clerkPlugin())
  .get("/", async () => {
    const data = await db.select().from(courses);
    return { data };
  })
  .get("/top", async () => {
    const data = await db.select().from(courses).limit(3);
    return { data };
  })
  .get(
    "/open/:id",
    async ({ params: { id } }) => {
      try {
        const data = await openCourseByIdHandler(id);
        return { data };
      } catch (error) {
        return { error: "Failed to open course" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .get(
    "/purchased/:id",
    async ({ params: { id }, set, auth: getAuth }) => {
      const auth = getAuth();

      try {
        if (!auth?.userId) {
          set.status = 401;
          return { error: "Unauthorized" };
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
              eq(enrollments.courseId, id),
            ),
          )
          .execute();

        if (!enrollment.length) {
          set.status = 403;
          return { error: "Not enrolled in this course" };
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
          .where(eq(courses.id, id))
          .execute();

        if (!course.length) {
          set.status = 404;
          return { error: "Course not found" };
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
            completedQuestions: sql<number>`(SELECT COUNT(DISTINCT ${questionProgress.questionId})
                                           FROM ${questionProgress}
                                                  INNER JOIN ${questions} ON ${questions.id} = ${questionProgress.questionId}
                                           WHERE ${questions.lessonId} = ${lessons.id}
                                             AND ${questionProgress.userId} = ${auth.userId}
                                             AND ${questionProgress.isCorrect} = true)`,
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
          .where(eq(lessons.courseId, id))
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

        return { data: formattedCourse };
      } catch (error) {
        console.error("Error fetching purchased course:", error);
        set.status = 500;
        return { error: "An error occurred while fetching the course" };
      }
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

      try {
        if (!auth?.userId) {
          set.status = 401;
          return { error: "Unauthenticated" };
        }

        if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN) {
          set.status = 403;
          return { error: "Only Admins can create courses" };
        }

        const { title, description, level, price, discount, imageUrl, tags } =
          body;

        const [instructor] = await db
          .select()
          .from(users)
          .where(eq(users.id, auth.userId));

        if (!instructor) {
          set.status = 404;
          return { error: "No user found" };
        }

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

        return { data };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to create course" };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        description: t.String(),
        level: t.Enum(CourseLevel),
        price: t.Number(),
        discount: t.Optional(t.Number()),
        imageUrl: t.String(),
        tags: t.Array(t.String()),
      }),
    },
  )
  .post(
    "/update",
    async ({ body, set, auth: getAuth }) => {
      const auth = getAuth();

      try {
        if (!auth?.userId) {
          set.status = 401;
          return { error: "Unauthenticated" };
        }

        if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN) {
          set.status = 403;
          return { error: "Unauthorized" };
        }

        const {
          id,
          title,
          description,
          level,
          price,
          discount,
          imageUrl,
          tags,
        } = body;

        const [data] = await db
          .select()
          .from(courses)
          .where(eq(courses.id, id));

        if (!data) {
          set.status = 404;
          return { error: "Course not found" };
        }

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

        return { data: updatedCourse };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to update course" };
      }
    },
    {
      body: t.Object({
        id: t.String(),
        title: t.String(),
        description: t.String(),
        level: t.Enum(CourseLevel),
        price: t.Number(),
        discount: t.Optional(t.Number()),
        imageUrl: t.String(),
        tags: t.Array(t.String()),
      }),
    },
  )
  .get(
    "/admin/:id",
    async ({ params: { id }, set, auth: getAuth }) => {
      const auth = getAuth();

      try {
        if (!auth?.userId) {
          set.status = 401;
          return { error: "Unauthenticated" };
        }

        const isAdmin = [Roles.ADMIN, Roles.MODERATOR].includes(
          auth.sessionClaims?.metadata?.role as Roles,
        );

        if (!isAdmin) {
          set.status = 403;
          return { error: "Unauthorized" };
        }

        const course = await db.query.courses.findFirst({
          where: eq(courses.id, id),
          with: {
            lessons: true,
          },
        });

        if (!course) {
          set.status = 404;
          return { error: "Course not found" };
        }

        return { data: course };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to fetch course for admin" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, set, auth: getAuth }) => {
      const auth = getAuth();

      try {
        if (!auth?.userId) {
          set.status = 401;
          return { error: "Unauthenticated" };
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
          set.status = 404;
          return { error: "Course not found" };
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

        return { data: responseData };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to fetch course" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    "/:id/check-completion",
    async ({ params: { id }, set, auth: getAuth }) => {
      const auth = getAuth();

      try {
        if (!auth?.userId) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        // Check if the user is enrolled in this course
        const [enrollment] = await db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.courseId, id),
              eq(enrollments.userId, auth.userId),
              eq(enrollments.paymentStatus, PaymentStatus.PAID),
            ),
          )
          .execute();

        if (!enrollment) {
          set.status = 403;
          return { error: "You are not enrolled in this course" };
        }

        // Get the course details
        const [course] = await db
          .select()
          .from(courses)
          .where(eq(courses.id, id))
          .execute();

        if (!course) {
          set.status = 404;
          return { error: "Course not found" };
        }

        // Get all lessons for this course
        const courseLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.courseId, id))
          .execute();

        if (courseLessons.length === 0) {
          set.status = 400;
          return { error: "This course has no lessons" };
        }

        // Get completed lessons for this user and course
        const completedLessons = await db
          .select()
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, auth.userId),
              eq(lessonProgress.status, LessonStatus.COMPLETED),
              inArray(
                lessonProgress.lessonId,
                courseLessons.map((lesson) => lesson.id),
              ),
            ),
          )
          .execute();

        // Check if all lessons are completed
        const isCompleted = completedLessons.length === courseLessons.length;

        // If the course is completed, award points and update stats
        if (isCompleted) {
          // Check if we've already awarded points for this course completion
          const existingActivity = await db
            .select()
            .from(activityLog)
            .where(
              and(
                eq(activityLog.userId, auth.userId),
                eq(activityLog.type, ActivityType.COURSE_COMPLETED),
                eq(activityLog.entityId, id),
              ),
            )
            .execute();

          // Only award points if this is the first time completing the course
          if (existingActivity.length === 0) {
            try {
              // Calculate points based on course level, length, etc.
              // For now, using a simple formula based on course level and number of lessons
              let basePoints = 100;

              // Adjust points based on course level
              switch (course.level) {
                case CourseLevel.BEGINNER:
                  basePoints = 100;
                  break;
                case CourseLevel.INTERMEDIATE:
                  basePoints = 250;
                  break;
                case CourseLevel.ADVANCED:
                  basePoints = 400;
                  break;
                default:
                  basePoints = 100;
              }

              // Add bonus points based on number of lessons
              const lessonBonus = Math.min(100, courseLessons.length * 10);
              const totalPoints = Math.min(500, basePoints + lessonBonus);

              // Award points and log activity
              await statsService.addPoints(
                auth.userId,
                totalPoints,
                ActivityType.COURSE_COMPLETED,
                id,
              );

              // Increment courses completed count
              await statsService.incrementCoursesCompleted(auth.userId);

              // Check for achievements
              await achievementService.checkAndAwardAchievements(auth.userId);

              return {
                data: {
                  completed: true,
                  pointsAwarded: totalPoints,
                  message: `Congratulations! You've completed the course "${course.title}" and earned ${totalPoints} points!`,
                },
              };
            } catch (error) {
              console.error("Error updating gamification stats:", error);
              // Return completion status even if gamification updates fail
              return { data: { completed: true, pointsAwarded: 0 } };
            }
          } else {
            // Course was already completed before
            return {
              data: {
                completed: true,
                alreadyCompleted: true,
                message: `You've already completed the course "${course.title}".`,
              },
            };
          }
        } else {
          // Course is not completed yet
          const completionPercentage = Math.round(
            (completedLessons.length / courseLessons.length) * 100,
          );

          return {
            data: {
              completed: false,
              progress: {
                completedLessons: completedLessons.length,
                totalLessons: courseLessons.length,
                completionPercentage,
              },
              message: `You've completed ${completedLessons.length} out of ${courseLessons.length} lessons (${completionPercentage}%).`,
            },
          };
        }
      } catch (error) {
        console.error("Error checking course completion:", error);
        set.status = 500;
        return { error: "An error occurred while checking course completion" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );

async function openCourseByIdHandler(id: string) {
  return await db.query.courses.findFirst({
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
}
