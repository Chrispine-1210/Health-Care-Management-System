import { getStorage } from './storageManager';
import { logger } from './logger';

interface UserCredentials {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export class UserService {
  private users: Map<string, UserCredentials> = new Map();

  constructor() {
    // Initialize with demo accounts
    const demoUsers = [
      { email: 'admin@thandizo.com', firstName: 'Admin', lastName: 'User', role: 'admin' },
      { email: 'pharmacist@thandizo.com', firstName: 'Pharmacist', lastName: 'User', role: 'pharmacist' },
      { email: 'staff@thandizo.com', firstName: 'Staff', lastName: 'User', role: 'staff' },
      { email: 'customer@thandizo.com', firstName: 'Customer', lastName: 'User', role: 'customer' },
      { email: 'driver@thandizo.com', firstName: 'Driver', lastName: 'User', role: 'driver' },
    ];

    demoUsers.forEach(user => this.users.set(user.email, user));
    logger.info('UserService initialized with 5 demo accounts');
  }

  async createUser(email: string, firstName: string, lastName: string, role: string): Promise<UserCredentials> {
    if (this.users.has(email)) {
      throw new Error('User already exists');
    }

    const user: UserCredentials = { email, firstName, lastName, role };
    this.users.set(email, user);
    logger.info('User created', { email, role });
    return user;
  }

  async getUser(email: string): Promise<UserCredentials | null> {
    return this.users.get(email) || null;
  }

  async updateUser(email: string, updates: Partial<UserCredentials>): Promise<UserCredentials> {
    const user = this.users.get(email);
    if (!user) {
      throw new Error('User not found');
    }

    const updated = { ...user, ...updates };
    this.users.set(email, updated);
    logger.info('User updated', { email });
    return updated;
  }

  async validateCredentials(email: string, password: string): Promise<boolean> {
    const user = this.users.get(email);
    if (!user) return false;
    // In production: use bcrypt.compare(password, user.passwordHash)
    return true;
  }
}

export const userService = new UserService();
