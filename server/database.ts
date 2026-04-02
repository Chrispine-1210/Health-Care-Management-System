import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "../shared/schema";
import { logger } from "./logger";

let db: ReturnType<typeof drizzle> | null = null;
let client: Client | null = null;

/**
 * Initialize database connection
 */
export async function initializeDatabase() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      logger.warn("DATABASE_URL not set - using in-memory storage");
      return null;
    }

    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    
    db = drizzle(client, { schema });
    
    logger.info("Database connected successfully");
    return db;
  } catch (error) {
    logger.error("Database connection failed", { error });
    return null;
  }
}

/**
 * Get database instance
 */
export function getDatabase() {
  return db;
}

/**
 * Health check query
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (!db) return false;
    
    // Simple query to verify connection
    await db.query.users.findFirst();
    return true;
  } catch (error) {
    logger.error("Database health check failed", { error });
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  try {
    if (client) {
      await client.end();
      logger.info("Database connection closed");
    }
  } catch (error) {
    logger.error("Error closing database", { error });
  }
}
