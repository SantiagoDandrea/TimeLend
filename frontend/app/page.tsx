/**
 * This file renders the main TimeLend application page.
 * It exists as the entry point for the frontend application.
 * It fits the system by being the root route that loads the full app.
 */
import { TimeLendApp } from "@/components/timelend-app";

/**
 * This component renders the root frontend route.
 * It receives no props because the composition is handled by the client component.
 * It returns the full TimeLend application.
 * It is important because all user interactions start from this route.
 */
export default function HomePage() {
  return <TimeLendApp />;
}
