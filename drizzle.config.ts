import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import logger from "./utils/logger";

config();

logger.info("Database URL:", process.env.DATABASE_URL!);

export default defineConfig({
  schema: "./db/schemas/*.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
