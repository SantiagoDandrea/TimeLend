/**
 * This file renders the multi-step commitment creation wizard.
 * It provides a guided flow for creating new commitments.
 * It fits the system by being the primary way to create commitments.
 */
"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Wallet,
  AlertCircle,
} from "lucide-react";

import {
  buildDeadlineFromDateOnly,
  getFailReceiverValidationError,
  resolveEffectiveFailReceiver,
  WEB_OWNER_WALLET,
} from "@/lib/commitment-utils";
import { useTimeLendWalletActions } from "@/hooks/use-timelend-wallet-actions";
import { useWalletSession } from "@/hooks/use-wallet-session";
import { createCommitmentRecord } from "@/services/timelend-api";
import type { CreateCommitmentFormValues } from "@/types/frontend";

type CreateCommitmentFlowProps = {
  onComplete: () => void;
  onCancel: () => void;
};

type Step = 1 | 2 | 3 | 4 | 5;

const steps = [
  { number: 1, title: "Commitment", description: "What's your goal?" },
  { number: 2, title: "Stake", description: "How much AVAX?" },
  { number: 3, title: "Deadline", description: "When's the deadline?" },
  { number: 4, title: "Settings", description: "Additional options" },
  { number: 5, title: "Review", description: "Confirm details" },
];

/**
 * This component renders the multi-step commitment creation wizard.
 * It receives callbacks for completion and cancellation.
 * It returns a step-by-step creation interface.
 * It is important because it guides users through commitment creation.
 */
export function CreateCommitmentFlow({ onComplete, onCancel }: CreateCommitmentFlowProps) {
  const { address, isAuthenticated, isOnSupportedChain, session, switchToSupportedChain } =
    useWalletSession();
  const { createCommitmentWithWallet, walletReady } = useTimeLendWalletActions();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateCommitmentFormValues>({
    title: "",
    description: "",
    amountAvax: "0.01",
    deadlineDate: "",
    failReceiver: WEB_OWNER_WALLET,
    useWebOwnerWallet: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  function updateField(field: keyof CreateCommitmentFormValues, value: string | boolean) {
    setValidationErrors({});
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function validateStep(step: Step): boolean {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (formData.title.trim().length === 0) {
          errors.title = "Please enter a title for your commitment";
        }
        if (formData.description.trim().length === 0) {
          errors.description = "Please describe your commitment";
        }
        break;
      case 2:
        const amount = parseFloat(formData.amountAvax);
        if (isNaN(amount) || amount < 0.001) {
          errors.amountAvax = "Please enter a valid amount (minimum 0.001 AVAX)";
        }
        break;
      case 3:
        if (formData.deadlineDate.trim().length === 0) {
          errors.deadlineDate = "Please select a deadline";
        } else {
          const parts = formData.deadlineDate.split("/");
          if (parts.length !== 3) {
            errors.deadlineDate = "Please use dd/mm/yyyy format";
          }
        }
        break;
      case 4:
        if (!formData.useWebOwnerWallet) {
          const error = getFailReceiverValidationError({
            failReceiver: formData.failReceiver,
            useWebOwnerWallet: formData.useWebOwnerWallet,
            walletAddress: address,
          });
          if (error) {
            errors.failReceiver = error;
          }
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goToNextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5) as Step);
    }
  }

  function goToPrevStep() {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  }

  async function handleSubmit() {
    if (!isAuthenticated || session === null || address === undefined) {
      setSubmitError("Please connect and authenticate your wallet first.");
      return;
    }

    if (!isOnSupportedChain) {
      setSubmitError("Please switch to Avalanche Fuji network.");
      return;
    }

    if (!walletReady) {
      setSubmitError("Wallet is still initializing. Please wait.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const effectiveFailReceiver = resolveEffectiveFailReceiver({
        failReceiver: formData.failReceiver,
        useWebOwnerWallet: formData.useWebOwnerWallet,
      });
      const deadline = buildDeadlineFromDateOnly(formData.deadlineDate);

      const onChainCommitment = await createCommitmentWithWallet({
        amountAvax: formData.amountAvax,
        deadlineUnix: deadline.unix,
        failReceiver: effectiveFailReceiver,
        walletAddress: address,
      });

      await createCommitmentRecord(session.token, {
        amount: onChainCommitment.amountWei,
        createCommitmentTxHash: onChainCommitment.txHash,
        deadline: deadline.iso,
        description: formData.description.trim(),
        failReceiver: effectiveFailReceiver,
        onchainId: onChainCommitment.onchainId,
        title: formData.title.trim(),
      });

      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create commitment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitSuccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--tl-success-muted)]">
          <CheckCircle2 className="h-10 w-10 text-[var(--tl-success)]" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Commitment Created!</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          Your commitment has been created on-chain and synced with the backend. You can now view it
          in your dashboard and submit evidence when ready.
        </p>
        <button
          onClick={onComplete}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to Dashboard
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onCancel}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-foreground">Create New Commitment</h1>
        <p className="mt-1 text-muted-foreground">
          Follow the steps below to create your commitment
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    currentStep > step.number
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep === step.number
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>
                <div className="mt-2 hidden text-center sm:block">
                  <p
                    className={`text-xs font-medium ${
                      currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-8 sm:w-16 ${
                    currentStep > step.number ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-card rounded-2xl p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">What's Your Commitment?</h2>
                <p className="text-sm text-muted-foreground">
                  Define what you want to achieve
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g., Complete morning workout routine"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationErrors.title && (
                <p className="mt-2 text-sm text-[var(--tl-danger)]">{validationErrors.title}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe your commitment in detail. Be specific about what you'll accomplish and how you'll prove it."
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationErrors.description && (
                <p className="mt-2 text-sm text-[var(--tl-danger)]">
                  {validationErrors.description}
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Stake Amount</h2>
                <p className="text-sm text-muted-foreground">
                  How much AVAX do you want to stake?
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Amount (AVAX)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.amountAvax}
                  onChange={(e) => updateField("amountAvax", e.target.value)}
                  min="0.001"
                  step="0.001"
                  placeholder="0.01"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-16 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  AVAX
                </span>
              </div>
              {validationErrors.amountAvax && (
                <p className="mt-2 text-sm text-[var(--tl-danger)]">{validationErrors.amountAvax}</p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                This amount will be locked in the smart contract until verification.
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {["0.01", "0.05", "0.1", "0.5"].map((amount) => (
                <button
                  key={amount}
                  onClick={() => updateField("amountAvax", amount)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    formData.amountAvax === amount
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {amount} AVAX
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Set Deadline</h2>
                <p className="text-sm text-muted-foreground">
                  When do you need to complete this by?
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Deadline</label>
              <input
                type="text"
                value={formData.deadlineDate}
                onChange={(e) => updateField("deadlineDate", e.target.value)}
                placeholder="dd/mm/yyyy"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationErrors.deadlineDate && (
                <p className="mt-2 text-sm text-[var(--tl-danger)]">
                  {validationErrors.deadlineDate}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the date in dd/mm/yyyy format. The deadline will be set to 00:00 UTC on this
                date.
              </p>
            </div>

            {/* Quick Date Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "1 Week", days: 7 },
                { label: "2 Weeks", days: 14 },
                { label: "1 Month", days: 30 },
                { label: "3 Months", days: 90 },
              ].map(({ label, days }) => {
                const date = new Date();
                date.setDate(date.getDate() + days);
                const formatted = `${String(date.getDate()).padStart(2, "0")}/${String(
                  date.getMonth() + 1
                ).padStart(2, "0")}/${date.getFullYear()}`;

                return (
                  <button
                    key={label}
                    onClick={() => updateField("deadlineDate", formatted)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      formData.deadlineDate === formatted
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Additional Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Configure fail receiver settings
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.useWebOwnerWallet}
                  onChange={(e) => {
                    updateField("useWebOwnerWallet", e.target.checked);
                    if (e.target.checked) {
                      updateField("failReceiver", WEB_OWNER_WALLET);
                    }
                  }}
                  className="mt-1 h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-medium text-foreground">Use system fail receiver</span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If you fail your commitment, funds will go to the system address.
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {WEB_OWNER_WALLET}
                  </p>
                </div>
              </label>
            </div>

            {!formData.useWebOwnerWallet && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Custom Fail Receiver
                </label>
                <input
                  type="text"
                  value={formData.failReceiver}
                  onChange={(e) => updateField("failReceiver", e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {validationErrors.failReceiver && (
                  <p className="mt-2 text-sm text-[var(--tl-danger)]">
                    {validationErrors.failReceiver}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter a valid wallet address (cannot be your own address).
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Review Your Commitment</h2>
                <p className="text-sm text-muted-foreground">
                  Confirm the details before creating
                </p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="rounded-xl border border-border bg-muted/30 p-5">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Title</p>
                  <p className="mt-1 font-semibold text-foreground">{formData.title}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Description
                  </p>
                  <p className="mt-1 text-foreground">{formData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Stake</p>
                    <p className="mt-1 font-semibold text-foreground">{formData.amountAvax} AVAX</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Deadline
                    </p>
                    <p className="mt-1 font-semibold text-foreground">{formData.deadlineDate}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Fail Receiver
                  </p>
                  <p className="mt-1 truncate font-mono text-sm text-foreground">
                    {formData.useWebOwnerWallet ? WEB_OWNER_WALLET : formData.failReceiver}
                  </p>
                </div>
              </div>
            </div>

            {/* Chain Warning */}
            {!isOnSupportedChain && (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--tl-warning)]/30 bg-[var(--tl-warning-muted)] p-4">
                <AlertCircle className="h-5 w-5 text-[var(--tl-warning)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--tl-warning)]">
                    Wrong Network
                  </p>
                  <p className="text-xs text-[var(--tl-warning)]/80">
                    Please switch to Avalanche Fuji to create your commitment.
                  </p>
                </div>
                <button
                  onClick={() => void switchToSupportedChain()}
                  className="rounded-lg bg-[var(--tl-warning)] px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
                >
                  Switch
                </button>
              </div>
            )}

            {submitError && (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--tl-danger)]/30 bg-[var(--tl-danger-muted)] p-4">
                <AlertCircle className="h-5 w-5 text-[var(--tl-danger)]" />
                <p className="text-sm text-[var(--tl-danger)]">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          {currentStep > 1 ? (
            <button
              onClick={goToPrevStep}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting || !isOnSupportedChain}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Create Commitment
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
