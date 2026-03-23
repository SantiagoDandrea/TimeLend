/**
 * This file renders the main functional demo page for the TimeLend frontend.
 * It exists to expose the complete browser-driven testing flow in a single route.
 * It fits the system by turning the previous scaffold landing page into a usable end-to-end demo tool.
 */
import { DemoWorkbench } from "@/components/demo-workbench";

/**
 * This component renders the root frontend route.
 * It receives no props because the page composition is fully static.
 * It returns the demo workbench screen.
 * It is important because local development and demos start from this one route.
 */
export default function HomePage() {
  return <DemoWorkbench />;
}
