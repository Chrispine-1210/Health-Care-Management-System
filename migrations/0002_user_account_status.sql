DO $$
BEGIN
  CREATE TYPE "account_status" AS ENUM ('active', 'disabled', 'locked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "account_status" "account_status" NOT NULL DEFAULT 'active';
