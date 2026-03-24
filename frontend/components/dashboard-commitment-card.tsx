/**
 * This file renders an individual commitment card for the dashboard.
 * It provides full interaction controls for evidence upload and verification.
 * It fits the system by being the detailed view for each active commitment.
 */
"use client";

import { useState } from "react";
import { formatEther } from "viem";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Loader2,
  Scale,
  Upload,
  XCircle,
  CheckCircle2,
  Zap,
} from "lucide-react";

import { formatDateOnly } from "@/lib/commitment-utils";
import type { ApiCommitment, ApiEvidence, EvidenceSubmissionInput } from "@/types/frontend";

type DashboardCommitmentCardProps = {
  commitment: ApiCommitment;
  onAppeal: (commitment: ApiCommitment) => Promise<void>;
  onFinalize: (commitmentId: string) => Promise<void>;
  onResolveAppeal: (commitmentId: string) => Promise<void>;
  onUploadEvidence: (commitmentId: string, input: EvidenceSubmissionInput) => Promise<void>;
  onVerify: (commitmentId: string) => Promise<void>;
};

function describeEvidenceEntry(evidence: ApiEvidence | null) {
  if (evidence === null) {
    return "None submitted yet";
  }

  const hasFile = evidence.originalFileName !== null;
  const hasWrittenEvidence = evidence.submittedText !== null && evidence.submittedText.length > 0;

  if (hasFile && hasWrittenEvidence) {
    return `${evidence.originalFileName} + written evidence`;
  }

  if (hasFile) {
    return evidence.originalFileName ?? "File evidence";
  }

  if (hasWrittenEvidence) {
    return "Written evidence";
  }

  return "Evidence submitted";
}

function getAppealEvidenceCutoff(commitment: ApiCommitment) {
  const appealRecordedEvent =
    commitment.events.find((event) => event.type === "APPEAL_RECORDED") ?? null;

  if (appealRecordedEvent === null) {
    return null;
  }

  return new Date(appealRecordedEvent.createdAt).getTime();
}

function getDeadlineStatus(deadline: string) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return { text: "Overdue", color: "text-[var(--tl-danger)]" };
  }
  if (days === 0) {
    return { text: "Due today", color: "text-[var(--tl-warning)]" };
  }
  if (days === 1) {
    return { text: "Due tomorrow", color: "text-[var(--tl-warning)]" };
  }
  if (days <= 7) {
    return { text: `${days} days left`, color: "text-[var(--tl-info)]" };
  }
  return { text: `${days} days left`, color: "text-muted-foreground" };
}

/**
 * This component renders a detailed commitment card with full controls.
 * It receives the commitment data and action handlers.
 * It returns a rich card UI for managing the commitment.
 * It is important because it provides the main interaction point for each commitment.
 */
export function DashboardCommitmentCard({
  commitment,
  onAppeal,
  onFinalize,
  onResolveAppeal,
  onUploadEvidence,
  onVerify,
}: DashboardCommitmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textEvidence, setTextEvidence] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [cardMessage, setCardMessage] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const latestVerification = commitment.verifications[0] ?? null;
  const latestEvidence = commitment.evidences[0] ?? null;
  const latestInitialVerification =
    commitment.verifications.find((verification) => verification.type === "INITIAL") ?? null;
  const appealRecordedAt = getAppealEvidenceCutoff(commitment);
  const latestAppealEvidence =
    appealRecordedAt === null
      ? null
      : commitment.evidences.find(
          (evidence) => new Date(evidence.createdAt).getTime() > appealRecordedAt
        ) ?? null;

  const appealAllowedByConfidence =
    latestInitialVerification !== null &&
    !latestInitialVerification.result &&
    latestInitialVerification.confidence < 0.6;
  const canSubmitEvidence =
    !commitment.isProcessing &&
    (commitment.status === "ACTIVE" ||
      (commitment.status === "FAILED_PENDING_APPEAL" && commitment.appealed));
  const isAppealEvidenceStage =
    commitment.status === "FAILED_PENDING_APPEAL" && commitment.appealed;
  const canVerify =
    commitment.status === "ACTIVE" &&
    !commitment.isProcessing &&
    commitment.evidences.length > 0;
  const canAppeal =
    commitment.status === "FAILED_PENDING_APPEAL" &&
    !commitment.appealed &&
    !commitment.isProcessing &&
    appealAllowedByConfidence;
  const canResolveAppeal =
    commitment.status === "FAILED_PENDING_APPEAL" &&
    commitment.appealed &&
    !commitment.isProcessing &&
    latestAppealEvidence !== null;
  const canFinalize =
    commitment.status === "FAILED_PENDING_APPEAL" &&
    !commitment.appealed &&
    !commitment.isProcessing &&
    commitment.appealWindowEndsAt !== null &&
    new Date(commitment.appealWindowEndsAt).getTime() <= Date.now();

  const deadlineStatus = getDeadlineStatus(commitment.deadline);

  async function runCardAction(label: string, action: () => Promise<void>) {
    setActiveAction(label);
    setCardMessage(null);

    try {
      await action();
      setCardMessage(`${label} completed.`);
    } catch (error) {
      setCardMessage(error instanceof Error ? error.message : `${label} failed.`);
    } finally {
      setActiveAction(null);
    }
  }

  const statusConfig = {
    ACTIVE: {
      label: "Active",
      class: "status-active",
      icon: Clock,
    },
    FAILED_PENDING_APPEAL: {
      label: "Failed - Pending Appeal",
      class: "status-failed_pending_appeal",
      icon: AlertCircle,
    },
    COMPLETED: {
      label: "Completed",
      class: "status-completed",
      icon: CheckCircle2,
    },
    FAILED_FINAL: {
      label: "Failed",
      class: "status-failed_final",
      icon: XCircle,
    },
  };

  const status = statusConfig[commitment.status] || statusConfig.ACTIVE;
  const StatusIcon = status.icon;

  return (
    <article className="glass-card overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{commitment.title}</h3>
              {commitment.isProcessing && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{commitment.description}</p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.class}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {commitment.isProcessing ? "Processing" : status.label}
          </span>
        </div>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Staked</p>
            <p className="mt-0.5 font-semibold text-foreground">
              {formatEther(BigInt(commitment.amount))} AVAX
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Deadline</p>
            <p className={`mt-0.5 font-semibold ${deadlineStatus.color}`}>
              {deadlineStatus.text}
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Evidence</p>
            <p className="mt-0.5 font-semibold text-foreground">{commitment.evidences.length} submitted</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">On-chain ID</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
              #{commitment.onchainId}
            </p>
          </div>
        </div>

        {/* Expandable Section Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/50 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show Details & Actions
            </>
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/30 p-5">
          {/* Latest Verification */}
          {latestVerification && (
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Latest Verification</span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                    latestVerification.result ? "status-completed" : "status-failed_final"
                  }`}
                >
                  {latestVerification.result ? "Passed" : "Failed"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{latestVerification.reasoning}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Confidence: {(latestVerification.confidence * 100).toFixed(0)}%
              </p>
            </div>
          )}

          {/* Evidence Submission */}
          {canSubmitEvidence && (
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">
                  {isAppealEvidenceStage ? "Submit Appeal Evidence" : "Submit Evidence"}
                </span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {isAppealEvidenceStage
                  ? "Upload additional evidence for your appeal review."
                  : "Upload a file or describe your proof of completion."}
              </p>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    File Upload
                  </label>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept=".pdf,.txt,text/plain,application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    disabled={activeAction !== null}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Written Evidence
                  </label>
                  <textarea
                    value={textEvidence}
                    onChange={(e) => setTextEvidence(e.target.value)}
                    placeholder={
                      isAppealEvidenceStage
                        ? "Explain why the previous failure should be reconsidered..."
                        : "Describe your proof of completion..."
                    }
                    rows={3}
                    disabled={activeAction !== null}
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <button
                  onClick={() =>
                    void runCardAction(
                      isAppealEvidenceStage ? "Appeal evidence upload" : "Evidence upload",
                      async () => {
                        const trimmedTextEvidence = textEvidence.trim();

                        if (selectedFile === null && trimmedTextEvidence.length === 0) {
                          throw new Error("Provide a file, written evidence, or both.");
                        }

                        await onUploadEvidence(commitment.id, {
                          file: selectedFile,
                          textEvidence: trimmedTextEvidence,
                        });

                        if (isAppealEvidenceStage) {
                          await onResolveAppeal(commitment.id);
                        }

                        setSelectedFile(null);
                        setTextEvidence("");
                        setFileInputKey((k) => k + 1);
                      }
                    )
                  }
                  disabled={
                    activeAction !== null ||
                    (selectedFile === null && textEvidence.trim().length === 0)
                  }
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeAction === "Evidence upload" || activeAction === "Appeal evidence upload" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isAppealEvidenceStage ? "Submit Appeal Evidence" : "Submit Evidence"}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {canVerify && (
              <button
                onClick={() => void runCardAction("Verification", () => onVerify(commitment.id))}
                disabled={activeAction !== null}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeAction === "Verification" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Verify Commitment
              </button>
            )}

            {canAppeal && (
              <button
                onClick={() => void runCardAction("Appeal", () => onAppeal(commitment))}
                disabled={activeAction !== null}
                className="flex items-center gap-2 rounded-xl border border-[var(--tl-warning)] bg-[var(--tl-warning-muted)] px-4 py-2.5 text-sm font-medium text-[var(--tl-warning)] transition-colors hover:bg-[var(--tl-warning)]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeAction === "Appeal" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Scale className="h-4 w-4" />
                )}
                Submit Appeal
              </button>
            )}

            {canResolveAppeal && (
              <button
                onClick={() =>
                  void runCardAction("Appeal resolution", () => onResolveAppeal(commitment.id))
                }
                disabled={activeAction !== null}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeAction === "Appeal resolution" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Scale className="h-4 w-4" />
                )}
                Resolve Appeal
              </button>
            )}

            {canFinalize && (
              <button
                onClick={() =>
                  void runCardAction("Failed finalization", () => onFinalize(commitment.id))
                }
                disabled={activeAction !== null}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeAction === "Failed finalization" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Finalize Failed
              </button>
            )}
          </div>

          {/* Card Message */}
          {cardMessage && (
            <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
              {cardMessage}
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Fail Receiver:</strong>{" "}
              <span className="font-mono">{commitment.failReceiver}</span>
            </p>
            <p>
              <strong className="text-foreground">Deadline:</strong> {formatDateOnly(commitment.deadline)}
            </p>
            {commitment.appealWindowEndsAt && (
              <p>
                <strong className="text-foreground">Appeal Window Ends:</strong>{" "}
                {formatDateOnly(commitment.appealWindowEndsAt)}
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
