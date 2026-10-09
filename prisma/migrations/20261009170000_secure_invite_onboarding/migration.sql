ALTER TYPE "UserRole" ADD VALUE 'PLATFORM_ADMIN';

CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "InvitationAccountType" AS ENUM ('AGENT', 'AGENCY');
CREATE TYPE "AccessType" AS ENUM ('BETA', 'PAID');
CREATE TYPE "AccessStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

ALTER TABLE "User"
ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'PENDING';

CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "accountType" "InvitationAccountType" NOT NULL,
    "agencyId" TEXT,
    "createdBySub" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "redeemedBySub" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Invitation_role_accountType_check" CHECK (
      ("accountType" = 'AGENT' AND "role" = 'AGENT') OR
      ("accountType" = 'AGENCY' AND "role" = 'AGENCY_ADMIN')
    )
);

CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX "Invitation_email_expiresAt_idx" ON "Invitation"("email", "expiresAt");
CREATE INDEX "Invitation_revokedAt_redeemedAt_idx" ON "Invitation"("revokedAt", "redeemedAt");
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_agencyId_fkey"
FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "AccessEntitlement" (
    "id" TEXT NOT NULL,
    "type" "AccessType" NOT NULL,
    "status" "AccessStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "userId" TEXT,
    "agencyId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "grantedBySub" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessEntitlement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AccessEntitlement_single_target_check" CHECK (
      ("userId" IS NOT NULL AND "agencyId" IS NULL) OR
      ("userId" IS NULL AND "agencyId" IS NOT NULL)
    )
);

CREATE INDEX "AccessEntitlement_userId_status_startsAt_expiresAt_idx"
ON "AccessEntitlement"("userId", "status", "startsAt", "expiresAt");
CREATE INDEX "AccessEntitlement_agencyId_status_startsAt_expiresAt_idx"
ON "AccessEntitlement"("agencyId", "status", "startsAt", "expiresAt");
ALTER TABLE "AccessEntitlement" ADD CONSTRAINT "AccessEntitlement_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AccessEntitlement" ADD CONSTRAINT "AccessEntitlement_agencyId_fkey"
FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorSub" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorSub_createdAt_idx" ON "AuditLog"("actorSub", "createdAt");
CREATE INDEX "AuditLog_targetType_targetId_createdAt_idx" ON "AuditLog"("targetType", "targetId", "createdAt");
