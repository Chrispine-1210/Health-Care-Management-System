CREATE TYPE "emergency_reason" AS ENUM ('immediate_threat', 'continuity_of_care', 'system_outage');
CREATE TYPE "emergency_review_state" AS ENUM ('pending', 'approved', 'rejected', 'closed');

CREATE TABLE "emergency_access_grants" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "patient_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "reason_code" "emergency_reason" NOT NULL,
  "justification" text NOT NULL,
  "activated_at" timestamp NOT NULL DEFAULT now(),
  "expires_at" timestamp NOT NULL,
  "review_state" "emergency_review_state" NOT NULL DEFAULT 'pending',
  "reviewed_by" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_at" timestamp,
  "review_notes" text,
  CONSTRAINT "emergency_access_expiry_after_activation" CHECK ("expires_at" > "activated_at"),
  CONSTRAINT "emergency_access_duration_limit" CHECK ("expires_at" <= "activated_at" + interval '15 minutes'),
  CONSTRAINT "emergency_access_review_metadata" CHECK (
    ("review_state" = 'pending' AND "reviewed_by" IS NULL AND "reviewed_at" IS NULL)
    OR ("review_state" <> 'pending' AND "reviewed_by" IS NOT NULL AND "reviewed_at" IS NOT NULL)
  )
);

CREATE INDEX "emergency_access_actor_patient_idx" ON "emergency_access_grants" ("actor_id", "patient_id");
CREATE INDEX "emergency_access_expiry_idx" ON "emergency_access_grants" ("expires_at");
CREATE INDEX "emergency_access_review_idx" ON "emergency_access_grants" ("review_state");
