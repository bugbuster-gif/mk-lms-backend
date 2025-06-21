import { Elysia } from "elysia";
import logger from "../utils/logger";
import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { db } from "../db/db";
import { courses } from "../db/schemas/course.schema";
import { course } from "../modules/course";
import { enroll } from "../modules/enroll";
import { lesson } from "../modules/lesson";

const PORT = process.env.PORT!;

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get("/", () => "Hello Elysia 🦊")
  .get("/ping", async () => {
    const data = await db.select().from(courses);
    return {
      data: {
        cors: `${process.env.APP_URL}`,
        status: "success",
        greeting: "It's all good! 😁 DB is connected",
        courses: data,
      },
    };
  })
  .use(course)
  .use(enroll)
  .use(lesson)
  .listen(PORT);

logger.info(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
