import { DatabaseStorage } from "./storage";
import { MemoryStorage } from "./memoryStorage";
import type { IStorage } from "./storage";
import { initializeDatabase, getDatabase } from "./database";
import { logger } from "./logger";

let storageInstance: IStorage | null = null;

/**
 * Get singleton storage instance
 * Automatically selects database or in-memory based on DATABASE_URL
 */
export async function getDataSource(): Promise<IStorage> {
  if (storageInstance) {
    return storageInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  const useDatabaseStorage = databaseUrl && databaseUrl.trim().length > 0;

  if (useDatabaseStorage) {
    try {
      const db = await initializeDatabase();
      if (db) {
        storageInstance = new DatabaseStorage();
        logger.info("Using PostgreSQL database storage");
        return storageInstance;
      }
    } catch (error) {
      logger.warn("Database initialization failed, falling back to in-memory storage", { error });
    }
  }

  // Fallback to in-memory storage
  storageInstance = new MemoryStorage();
  logger.info("Using in-memory storage (development mode)");
  return storageInstance;
}

/**
 * Legacy compatibility function
 */
export function getStorage(): IStorage {
  if (!storageInstance) {
    // This will be called synchronously, so return in-memory by default
    // Async initialization should use getDataSource() instead
    storageInstance = new MemoryStorage();
  }
  return storageInstance;
}

/**
 * Initialize storage system
 */
export async function initializeStorage() {
  await getDataSource();
}
