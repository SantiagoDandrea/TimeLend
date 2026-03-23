/**
 * This file stores small static labels shared by the frontend demo.
 * It exists to keep presentation copy separate from component logic.
 * It fits the system by preserving one simple source for frontend identity values.
 */

/**
 * This constant defines the static copy shared by the demo frontend.
 * It receives no input because the values are loaded statically at module scope.
 * It returns a small immutable configuration object for optional UI copy usage.
 * It is important because even a test-oriented frontend benefits from one consistent product label source.
 */
export const siteConfig = {
  description: "Functional demo frontend for testing the full TimeLend flow.",
  name: "TimeLend Demo"
} as const;
