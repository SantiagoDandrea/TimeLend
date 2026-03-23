/**
 * This file defines the shared application error used across backend services.
 * It exists to keep expected business failures distinct from unexpected runtime exceptions.
 * It fits the system by giving the error middleware structured data to serialize safely.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly details: Record<string, unknown> | undefined;
  public readonly statusCode: number;

  /**
   * This constructor creates a structured backend error.
   * It receives the HTTP status, machine-readable code, human-readable message and optional details.
   * It returns an AppError instance ready to be thrown.
   * It is important because expected failures should propagate consistently through the HTTP layer.
   */
  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
