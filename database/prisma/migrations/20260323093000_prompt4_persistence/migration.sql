-- This migration creates the production-oriented persistence layer for TimeLend.
-- It exists to persist product metadata, evidence, AI verifications and audit history outside the smart contract.
-- It fits the system by making PostgreSQL the durable logical state store while blockchain remains the source of truth for funds.

-- This enum stores the logical lifecycle states mirrored from the TimeLend contract.
CREATE TYPE "CommitmentStatus" AS ENUM (
  'ACTIVE',
  'FAILED_PENDING_APPEAL',
  'COMPLETED',
  'FAILED_FINAL'
);

-- This enum distinguishes between the initial AI review and the appeal review.
CREATE TYPE "VerificationType" AS ENUM (
  'INITIAL',
  'APPEAL'
);

-- This enum classifies append-only history events for commitments.
CREATE TYPE "CommitmentEventType" AS ENUM (
  'CREATED',
  'EVIDENCE_ADDED',
  'VERIFICATION_STARTED',
  'VERIFIED_COMPLETED',
  'VERIFIED_FAILED',
  'APPEAL_RECORDED',
  'APPEAL_RESOLVED',
  'FAILED_FINALIZED'
);

-- This table stores users identified by wallet address.
CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "authNonce" TEXT,
  "authNonceIssuedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- This table stores the off-chain commitment aggregate linked to one on-chain commitment id.
CREATE TABLE "Commitment" (
  "id" UUID NOT NULL,
  "onchainId" BIGINT NOT NULL,
  "userId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" TEXT NOT NULL,
  "deadline" TIMESTAMP(3) NOT NULL,
  "failReceiver" TEXT NOT NULL,
  "status" "CommitmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "appealed" BOOLEAN NOT NULL DEFAULT false,
  "isProcessing" BOOLEAN NOT NULL DEFAULT false,
  "processingStartedAt" TIMESTAMP(3),
  "createCommitmentTxHash" TEXT,
  "markCompletedTxHash" TEXT,
  "markFailedTxHash" TEXT,
  "resolveAppealTxHash" TEXT,
  "finalizeFailedTxHash" TEXT,
  "failureMarkedAt" TIMESTAMP(3),
  "appealWindowEndsAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "failedFinalAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

-- This table stores evidence uploads and extracted text used by the AI layer.
CREATE TABLE "Evidence" (
  "id" UUID NOT NULL,
  "commitmentId" UUID NOT NULL,
  "uploadedByUserId" UUID NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "storedFileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "extractedText" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- This table stores each AI verification decision and its reasoning.
CREATE TABLE "Verification" (
  "id" UUID NOT NULL,
  "commitmentId" UUID NOT NULL,
  "evidenceId" UUID,
  "result" BOOLEAN NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "reasoning" TEXT NOT NULL,
  "type" "VerificationType" NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "rawResponse" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- This table stores an append-only history of product-level events per commitment.
CREATE TABLE "CommitmentEvent" (
  "id" UUID NOT NULL,
  "commitmentId" UUID NOT NULL,
  "type" "CommitmentEventType" NOT NULL,
  "fromStatus" "CommitmentStatus",
  "toStatus" "CommitmentStatus",
  "txHash" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommitmentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
CREATE UNIQUE INDEX "Commitment_onchainId_key" ON "Commitment"("onchainId");
CREATE INDEX "Commitment_userId_createdAt_idx" ON "Commitment"("userId", "createdAt");
CREATE INDEX "Commitment_status_appealed_idx" ON "Commitment"("status", "appealed");
CREATE INDEX "Commitment_isProcessing_idx" ON "Commitment"("isProcessing");
CREATE INDEX "Commitment_deadline_idx" ON "Commitment"("deadline");
CREATE INDEX "Evidence_commitmentId_createdAt_idx" ON "Evidence"("commitmentId", "createdAt");
CREATE INDEX "Evidence_uploadedByUserId_idx" ON "Evidence"("uploadedByUserId");
CREATE INDEX "Verification_commitmentId_createdAt_idx" ON "Verification"("commitmentId", "createdAt");
CREATE INDEX "Verification_type_idx" ON "Verification"("type");
CREATE INDEX "Verification_evidenceId_idx" ON "Verification"("evidenceId");
CREATE INDEX "CommitmentEvent_commitmentId_createdAt_idx" ON "CommitmentEvent"("commitmentId", "createdAt");
CREATE INDEX "CommitmentEvent_type_idx" ON "CommitmentEvent"("type");

ALTER TABLE "Commitment"
ADD CONSTRAINT "Commitment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Evidence"
ADD CONSTRAINT "Evidence_commitmentId_fkey"
FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Evidence"
ADD CONSTRAINT "Evidence_uploadedByUserId_fkey"
FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Verification"
ADD CONSTRAINT "Verification_commitmentId_fkey"
FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Verification"
ADD CONSTRAINT "Verification_evidenceId_fkey"
FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommitmentEvent"
ADD CONSTRAINT "CommitmentEvent_commitmentId_fkey"
FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
