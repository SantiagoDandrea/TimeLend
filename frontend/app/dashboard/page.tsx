import { DashboardPageContent } from "@/components/dashboard-page-content";

/**
 * This file renders the dedicated dashboard route for the TimeLend frontend.
 * It exists to give commitment operations their own focused page.
 * It fits the system by separating dashboard actions from the landing and create experiences.
 */
export default function DashboardPage() {
  return <DashboardPageContent />;
}
