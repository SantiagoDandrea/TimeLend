import { CreatePageContent } from "@/components/create-page-content";

/**
 * This file renders the dedicated create route for the TimeLend frontend.
 * It exists to give commitment creation its own focused page.
 * It fits the system by separating creation from the landing and dashboard experiences.
 */
export default function CreatePage() {
  return <CreatePageContent />;
}
