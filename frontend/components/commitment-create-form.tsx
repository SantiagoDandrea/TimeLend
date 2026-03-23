/**
 * This file renders the create-commitment form used by the demo frontend.
 * It exists to keep the on-chain creation and backend registration UI separated from dashboard rendering.
 * It fits the system by making the most important user write flow easy to test repeatedly.
 */
"use client";

import { useState } from "react";

import type { CreateCommitmentFormValues } from "@/types/frontend";

type CommitmentCreateFormProps = {
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: (values: CreateCommitmentFormValues) => Promise<void>;
};

const initialValues: CreateCommitmentFormValues = {
  amountAvax: "0.01",
  deadlineLocal: "",
  description: "",
  failReceiver: "",
  title: ""
};

/**
 * This component renders the form that creates commitments on-chain and then syncs them to the backend.
 * It receives the submit handler plus simple UI state flags.
 * It returns the complete create form used by the demo.
 * It is important because the system cannot be tested end to end without exercising the initial escrow path.
 */
export function CommitmentCreateForm({
  canSubmit,
  isSubmitting,
  onSubmit
}: CommitmentCreateFormProps) {
  const [values, setValues] = useState<CreateCommitmentFormValues>(initialValues);
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * This function updates one controlled field in the create form state.
   * It receives the field key and the new input value.
   * It returns nothing because the state update happens internally.
   * It is important because the demo form keeps all inputs controlled for predictable submission.
   */
  function updateValue(field: keyof CreateCommitmentFormValues, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
  }

  /**
   * This function validates and submits the create form through the parent workflow.
   * It receives the browser form submission event.
   * It returns a promise that resolves when the parent handler finishes.
   * It is important because contract creation and backend sync must happen as one guided user action.
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (
      values.title.trim().length === 0 ||
      values.description.trim().length === 0 ||
      values.failReceiver.trim().length === 0 ||
      values.deadlineLocal.trim().length === 0
    ) {
      setFormError("Complete title, description, deadline and fail receiver before submitting.");
      return;
    }

    try {
      await onSubmit(values);
      setValues(initialValues);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create the commitment.");
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Create</p>
          <h2 className="section-title">Create commitment on-chain and sync backend</h2>
        </div>
      </div>

      <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>Title</span>
          <input
            onChange={(event) => updateValue("title", event.target.value)}
            placeholder="Morning workout"
            value={values.title}
          />
        </label>

        <label className="field field-wide">
          <span>Description</span>
          <textarea
            onChange={(event) => updateValue("description", event.target.value)}
            placeholder="Describe the commitment you will later prove with evidence."
            rows={4}
            value={values.description}
          />
        </label>

        <label className="field">
          <span>Amount (AVAX)</span>
          <input
            min="0.001"
            onChange={(event) => updateValue("amountAvax", event.target.value)}
            step="0.001"
            type="number"
            value={values.amountAvax}
          />
        </label>

        <label className="field">
          <span>Deadline</span>
          <input
            onChange={(event) => updateValue("deadlineLocal", event.target.value)}
            type="datetime-local"
            value={values.deadlineLocal}
          />
        </label>

        <label className="field field-wide">
          <span>Fail receiver</span>
          <input
            onChange={(event) => updateValue("failReceiver", event.target.value)}
            placeholder="0x..."
            value={values.failReceiver}
          />
        </label>

        <div className="form-actions">
          <button className="button button-primary" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting ? "Creating..." : "Create commitment"}
          </button>
        </div>
      </form>

      {formError !== null ? <p className="feedback feedback-error">{formError}</p> : null}
    </section>
  );
}
