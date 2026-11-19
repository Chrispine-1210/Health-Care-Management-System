ALTER TYPE "user_role" RENAME VALUE 'customer' TO 'patient';
ALTER TYPE "user_role" RENAME VALUE 'driver' TO 'delivery_driver';
ALTER TYPE "user_role" RENAME VALUE 'staff' TO 'receptionist';
ALTER TYPE "user_role" RENAME VALUE 'admin' TO 'system_administrator';

ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'doctor';
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'nurse';
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'laboratory_staff';
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'branch_administrator';
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'super_administrator';
