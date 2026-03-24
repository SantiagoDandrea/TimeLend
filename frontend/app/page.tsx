/**
 * This file renders the landing page for the TimeLend frontend.
 * It exists to provide a focused entry route before users move into create or dashboard flows.
 * It fits the system by separating the home experience from the operational routes.
 */
import { HomePageContent } from "@/components/home-page-content";

/**
 * This component renders the root frontend route.
 * It receives no props because the page content is fully composed inside the client entry component.
 * It returns the landing page experience.
 * It is important because the root path now acts as the clean home route for the app.
 */
export default function HomePage() {
  return <HomePageContent />;
}
