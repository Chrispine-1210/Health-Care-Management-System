import { BaseRepository, BaseEntity } from './baseRepository';
import { logger } from './logger';

/**
 * Refactored User Entity - SOLID Principles
 */

export interface UserEntity extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  profileImageUrl?: string;
}

/**
 * User Repository - Abstraction layer
 */
class UserRepository extends BaseRepository<UserEntity> {
  constructor() {
    super('User');
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const users = await this.filter(u => u.email === email);
    return users[0] || null;
  }

  async findByRole(role: string): Promise<UserEntity[]> {
    return this.filter(u => u.role === role);
  }

  async updateByEmail(email: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    return this.update(user.id, updates);
  }
}

/**
 * User Service - Business logic (Service layer pattern)
 */
export class UserService {
  private repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
    this.initializeDemoUsers();
  }

  private initializeDemoUsers(): void {
    const demoUsers: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { email: 'admin@thandizo.com', firstName: 'Admin', lastName: 'User', role: 'admin' },
      { email: 'pharmacist@thandizo.com', firstName: 'Pharmacist', lastName: 'User', role: 'pharmacist' },
      { email: 'staff@thandizo.com', firstName: 'Staff', lastName: 'User', role: 'staff' },
      { email: 'customer@thandizo.com', firstName: 'Customer', lastName: 'User', role: 'customer' },
      { email: 'driver@thandizo.com', firstName: 'Driver', lastName: 'User', role: 'driver' },
    ];

    demoUsers.forEach(user => {
      this.repository.create(user).catch(err => logger.error('Demo user init error', { error: err }));
    });

    logger.info('UserService initialized with demo accounts');
  }

  async getUser(email: string): Promise<UserEntity | null> {
    return this.repository.findByEmail(email);
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    return this.repository.getById(id);
  }

  async getAllUsers(): Promise<UserEntity[]> {
    return this.repository.getAll();
  }

  async getUsersByRole(role: string): Promise<UserEntity[]> {
    return this.repository.findByRole(role);
  }

  async createUser(userData: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const existing = await this.repository.findByEmail(userData.email);
    if (existing) {
      throw new Error(`User with email ${userData.email} already exists`);
    }

    return this.repository.create(userData);
  }

  async updateUser(email: string, updates: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.repository.updateByEmail(email, updates);
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    logger.info('User updated', { email });
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async getUserCount(): Promise<number> {
    return this.repository.count();
  }

  async validateUser(email: string, password: string): Promise<boolean> {
    const user = await this.repository.findByEmail(email);
    if (!user) return false;
    // In production: use bcrypt.compare()
    return true;
  }
}

export const userService = new UserService();
