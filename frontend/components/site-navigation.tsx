"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/create",
    label: "Create",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
  },
] as const;

/**
 * This component renders the shared frontend navigation for the focused page structure.
 * It receives no props because the active route is derived from the current pathname.
 * It returns the branded header used across Home, Create and Dashboard.
 * It is important because the demo now needs a clear route-level navigation without altering app logic.
 */
export function SiteNavigation() {
  const pathname = usePathname();

  return (
    <header className="demo-topbar">
      <div className="brand-lockup">
        <div className="brand-mark">TL</div>
        <div>
          <p className="brand-name">TimeLend</p>
          <p className="brand-tagline">Commitments, escrow, and AI verification on Fuji.</p>
        </div>
      </div>

      <nav aria-label="Primary navigation" className="site-nav">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              className={`nav-link${isActive ? " nav-link-active" : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
