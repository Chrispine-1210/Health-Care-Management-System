import { DatabaseStorage } from "./storage";
import { MemoryStorage } from "./memoryStorage";
import type { IStorage } from "./storage";

let storageInstance: IStorage | null = null;
let useMemory = true; // Default to memory storage

export function getStorage(): IStorage {
  if (!storageInstance) {
    // Use memory storage by default (database endpoint is disabled)
    useMemory = process.env.USE_DATABASE_STORAGE !== 'true';
    
    if (useMemory) {
      console.log("Using in-memory storage (database disabled)");
      storageInstance = new MemoryStorage();
    } else {
      console.log("Using database storage");
      storageInstance = new DatabaseStorage();
    }
  }
  
  return storageInstance;
}

export function setUseMemory(value: boolean) {
  useMemory = value;
  storageInstance = null; // Reset so it creates a new instance next time
}
