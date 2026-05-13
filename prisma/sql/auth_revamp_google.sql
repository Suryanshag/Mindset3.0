-- Auth revamp: Google OAuth + lockout + verification + audit log
-- Applied 2026-05-13. Additive only — no DROPs.

-- New enum for AuthEvent kinds
CREATE TYPE "AuthEventKind" AS ENUM (
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGIN_GOOGLE_SUCCESS',
  'LOGIN_GOOGLE_BLOCKED',
  'REGISTER_SUCCESS',
  'REGISTER_FAILED',
  'REGISTER_GOOGLE',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'EMAIL_VERIFICATION_SENT',
  'EMAIL_VERIFIED',
  'ACCOUNT_LOCKED'
);

-- User: relax password (Google-only users have no password), add lockout/last-login columns
ALTER TABLE "User"
  ALTER COLUMN "password" DROP NOT NULL,
  ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "locked_until" TIMESTAMP(3),
  ADD COLUMN "last_login_at" TIMESTAMP(3);

-- AuthEvent audit table
CREATE TABLE "auth_events" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "kind" "AuthEventKind" NOT NULL,
  "ip" TEXT,
  "user_agent" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "auth_events_user_id_idx" ON "auth_events"("user_id");
CREATE INDEX "auth_events_created_at_idx" ON "auth_events"("created_at");
ALTER TABLE "auth_events"
  ADD CONSTRAINT "auth_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- EmailVerificationToken table
CREATE TABLE "email_verification_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");
ALTER TABLE "email_verification_tokens"
  ADD CONSTRAINT "email_verification_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
