/**
 * This file implements AI-based evidence verification for TimeLend.
 * It exists to keep Gemini integration and fallback heuristics separate from commitment orchestration.
 * It fits the system by turning evidence text into a structured, auditable verification decision.
 */
import { GoogleGenAI } from "@google/genai";

import { env } from "../config/env";
import { logger } from "../config/logger";
import type { AiVerificationDecision, VerificationContext } from "../types/ai";
import { AppError } from "../utils/app-error";
import { PROMPT_VERSION, buildVerificationPrompt } from "../utils/prompt-builder";

const AI_REQUEST_TIMEOUT_MS = 12_000;

export class AiService {
  private readonly client =
    env.GEMINI_API_KEY !== undefined && env.GEMINI_API_KEY.length > 0
      ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
      : null;

  /**
   * This function verifies commitment evidence using Gemini when configured, or a deterministic mock otherwise.
   * It receives the commitment context and the verification stage.
   * It returns the structured AI decision consumed by the commitment service.
   * It is important because verification is the core product differentiator of the backend.
   */
  async verifyEvidence(
    context: VerificationContext,
    stage: "initial" | "appeal"
  ): Promise<AiVerificationDecision> {
    if (this.client === null) {
      const mockDecision = this.runMockVerification(context, stage);

      logger.info(
        {
          confidence: mockDecision.confidence,
          promptVersion: PROMPT_VERSION,
          stage,
          success: mockDecision.success
        },
        "Mock AI verification completed"
      );

      return mockDecision;
    }

    const prompt = buildVerificationPrompt(context, stage);
    let timeoutHandle: NodeJS.Timeout | undefined;

    const response = await Promise.race([
      this.client.models.generateContent({
        config: {
          responseMimeType: "application/json"
        },
        contents: prompt,
        model: env.GEMINI_MODEL
      }),
      new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new AppError(504, "AI_TIMEOUT", "Gemini verification timed out."));
        }, AI_REQUEST_TIMEOUT_MS);
      })
    ]).finally(() => {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    });

    const rawTextResponse = response.text?.trim();

    if (rawTextResponse === undefined || rawTextResponse.length === 0) {
      throw new AppError(502, "AI_EMPTY_RESPONSE", "Gemini returned an empty response.");
    }

    const parsedResponse = JSON.parse(rawTextResponse) as Partial<AiVerificationDecision>;

    if (
      typeof parsedResponse.success !== "boolean" ||
      typeof parsedResponse.confidence !== "number" ||
      typeof parsedResponse.reasoning !== "string"
    ) {
      throw new AppError(502, "AI_INVALID_RESPONSE", "Gemini returned an invalid response payload.", {
        rawTextResponse
      });
    }

    const decision: AiVerificationDecision = {
      confidence: Math.max(0, Math.min(1, parsedResponse.confidence)),
      rawResponse: {
        model: env.GEMINI_MODEL,
        responseText: rawTextResponse
      },
      reasoning: parsedResponse.reasoning,
      success: parsedResponse.success
    };

    logger.info(
      {
        confidence: decision.confidence,
        promptVersion: PROMPT_VERSION,
        stage,
        success: decision.success
      },
      "Gemini verification completed"
    );

    return decision;
  }

  /**
   * This function creates a deterministic fallback decision when Gemini is not configured.
   * It receives the commitment context and the verification stage.
   * It returns a locally computed verification result.
   * It is important because the backend should remain demoable and testable even without a live API key.
   */
  private runMockVerification(
    context: VerificationContext,
    stage: "initial" | "appeal"
  ): AiVerificationDecision {
    const normalizedDescription = `${context.title} ${context.description}`
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length >= 4);
    const normalizedEvidence = context.evidenceText.toLowerCase();
    const overlapCount = normalizedDescription.filter((token) =>
      normalizedEvidence.includes(token)
    ).length;
    const evidenceLengthScore = Math.min(context.evidenceText.length / 500, 1);
    const baseScore = Math.min(1, overlapCount / Math.max(1, normalizedDescription.length));
    const confidence = Number(
      Math.min(0.95, stage === "appeal" ? baseScore * 0.8 + evidenceLengthScore * 0.2 : baseScore * 0.7 + evidenceLengthScore * 0.3).toFixed(2)
    );
    const success = confidence >= (stage === "appeal" ? 0.65 : 0.55);

    return {
      confidence,
      rawResponse: {
        mode: "mock",
        overlapCount,
        promptVersion: PROMPT_VERSION,
        stage
      },
      reasoning: success
        ? "Mock verification found enough overlap between the commitment description and the extracted evidence text."
        : "Mock verification did not find enough overlap between the commitment description and the extracted evidence text.",
      success
    };
  }
}
