import { Elysia } from "elysia";
import logger from "../utils/logger";

const PORT = process.env.PORT!;

const app = new Elysia().get("/", () => "Hello Elysia").listen(PORT);

logger.info(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
