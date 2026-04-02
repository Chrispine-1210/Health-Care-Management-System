import { logger } from './logger';

/**
 * Base Repository Pattern - SOLID Principles
 * Provides abstraction layer for all data operations
 * Benefit: Easy to swap storage implementations, testable, maintainable
 */

export interface BaseEntity {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected data: Map<string, T> = new Map();
  protected entityName: string;

  constructor(entityName: string) {
    this.entityName = entityName;
  }

  /**
   * Get all entities
   */
  async getAll(): Promise<T[]> {
    return Array.from(this.data.values());
  }

  /**
   * Get single entity by ID
   */
  async getById(id: string): Promise<T | null> {
    return this.data.get(id) || null;
  }

  /**
   * Create entity
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = `${this.entityName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const entity: T = {
      ...(data as T),
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data.set(id, entity);
    logger.info(`${this.entityName} created`, { id });
    return entity;
  }

  /**
   * Update entity
   */
  async update(id: string, updates: Partial<T>): Promise<T> {
    const entity = this.data.get(id);
    if (!entity) {
      throw new Error(`${this.entityName} not found`);
    }

    const updated: T = {
      ...entity,
      ...updates,
      id: entity.id, // Preserve ID
      createdAt: entity.createdAt, // Preserve creation time
      updatedAt: new Date(),
    };

    this.data.set(id, updated);
    logger.info(`${this.entityName} updated`, { id });
    return updated;
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<boolean> {
    const deleted = this.data.delete(id);
    if (deleted) {
      logger.info(`${this.entityName} deleted`, { id });
    }
    return deleted;
  }

  /**
   * Count entities
   */
  async count(): Promise<number> {
    return this.data.size;
  }

  /**
   * Filter entities
   */
  async filter(predicate: (entity: T) => boolean): Promise<T[]> {
    return Array.from(this.data.values()).filter(predicate);
  }
}

export class RepositoryFactory {
  private static repositories: Map<string, BaseRepository<any>> = new Map();

  static create<T extends BaseEntity>(name: string, repo: BaseRepository<T>): BaseRepository<T> {
    this.repositories.set(name, repo);
    return repo;
  }

  static get<T extends BaseEntity>(name: string): BaseRepository<T> | null {
    return this.repositories.get(name) || null;
  }
}
