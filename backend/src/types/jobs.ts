/**
 * This file stores the job payload types used by the in-memory background queue.
 * It exists to keep asynchronous verification and appeal processing explicit.
 * It fits the system by making queue payloads auditable and easy to extend.
 */
export type VerificationJob = {
  commitmentId: string;
  type: "initial_verification" | "appeal_resolution";
};
