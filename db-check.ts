import { sql } from "drizzle-orm/sql";
import { db } from "./db/db";
import logger from "./utils/logger";

async function checkDatabaseConnection() {
  try {
    // Try to execute a simple query to check if the database is accessible
    await db.execute(sql`SELECT 1`);
    logger.info("Database connection successful");
    process.exit(0);
  } catch (error) {
    logger.error("Database connection failed:", error);
    process.exit(1);
  }
}

checkDatabaseConnection();
