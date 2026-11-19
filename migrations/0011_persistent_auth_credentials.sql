CREATE TABLE "auth_credentials" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "email" varchar NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "idx_auth_credentials_email" ON "auth_credentials"("email");
