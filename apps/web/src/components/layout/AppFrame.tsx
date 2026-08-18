"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckSquare2,
  ChevronDown,
  ClipboardList,
  ClipboardCheck,
  Home,
  Menu,
  MessageCircle,
  Search,
  Settings,
  FileText,
  LogOut,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { canAccessPath, primaryRoleLabel } from "../../lib/access-control";
import { ThemeToggle } from "./ThemeToggle";

const navigation = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/marketing-plan", label: "Marketing Plan", icon: ClipboardList },
  { href: "/designer", label: "My Work", icon: CheckSquare2 },
  { href: "/director", label: "Review Inbox", icon: MessageCircle },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin", label: "Administration", icon: Users },
  { href: "/profile", label: "Profile & Preferences", icon: Settings },
  { href: "/writer", label: "Writing Queue", icon: FileText },
  { href: "/system-review", label: "System Review", icon: ClipboardCheck },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile, logout } = useAuth();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const roles = profile?.roles || [];
  const allowedNavigation = navigation.filter((item) => canAccessPath(item.href, roles));
  const mobileNavigation = allowedNavigation.filter((item) => item.href !== "/profile").slice(0, 5);
  const displayName = profile?.name || user?.name || user?.email || "Team Member";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "TM";
  const roleLabel = primaryRoleLabel(roles);

  if (isAuthPage) {
    return (
      <>
        <div className="auth-theme-control"><ThemeToggle /></div>
        {children}
      </>
    );
  }

  return (
    <div className="imssa-app">
      <div className="imssa-shell">
        <aside className={`imssa-sidebar ${menuOpen ? "is-open" : ""}`}>
          <div className="imssa-brand">
            <img src="/branding/imssa-media-logo.png" alt="IMSSA Media" className="imssa-brand-logo" />
            <button className="imssa-sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation">
              <X size={20} />
            </button>
          </div>

          <nav className="imssa-nav" aria-label="Primary navigation">
            <p className="imssa-nav-label">Workspace</p>
            {allowedNavigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={isActive(pathname, href) ? "active" : ""}
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="imssa-sidebar-status">
            <span className="imssa-status-dot" />
            <div><strong>All systems ready</strong><small>Last synced just now</small></div>
          </div>
        </aside>

        {menuOpen && <button className="imssa-menu-scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}

        <div className="imssa-main">
          <header className="imssa-topbar">
            <button className="imssa-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
              <Menu size={21} />
            </button>
            <label className="imssa-search">
              <Search size={19} />
              <input type="search" placeholder="Search tasks, campaigns and people" />
              <kbd>⌘ K</kbd>
            </label>
            <div className="imssa-top-actions">
              <ThemeToggle />
              <button aria-label="Notifications" className="imssa-icon-button"><Bell size={19} /><span className="notification-dot" /></button>
              <Link href="/profile" className="imssa-profile-chip" title={`${displayName} · ${roleLabel}`}>
                <span className="imssa-avatar">{initials}</span>
                <span className="imssa-profile-copy"><strong>{displayName}</strong><small>{roleLabel}</small></span>
                <ChevronDown size={15} />
              </Link>
              <button onClick={logout} className="imssa-icon-button imssa-signout" aria-label="Sign out" title="Sign out"><LogOut size={18}/></button>
            </div>
          </header>

          <main className="imssa-content">{children}</main>
        </div>
      </div>

      <nav className="imssa-mobile-nav" aria-label="Mobile navigation">
        {mobileNavigation.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={isActive(pathname, href) ? "active" : ""}>
            <Icon size={20} />
            <span>{label === "Marketing Plan" ? "Plan" : label === "Review Inbox" ? "Review" : label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
