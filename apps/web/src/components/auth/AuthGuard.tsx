"use client";

import { useAuth } from "@/lib/auth-context";
import { Loader2, Menu, X, Home, PieChart, PenTool, Search, Bell, Settings, Eye, ShieldAlert, LayoutDashboard, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SystemStatusBar } from "../layout/SystemStatusBar";
import { SearchModal } from "../workspace/SearchModal";
import { GlobalChatWidget } from "../chat/GlobalChatWidget";
import { useMarkNotificationRead, useNotifications } from "../../api/queries";

const PUBLIC_ROUTES = ["/login", "/register", "/login/callback"];

const ROLE_ROUTES: Record<string, { label: string; href: string; icon: any; roles: string[] }> = {
  marketing: { label: "Marketing", href: "/", icon: Home, roles: ["MARKETING_COORDINATOR"] },
  designer: { label: "My Work", href: "/designer", icon: PenTool, roles: ["DESIGNER", "VIDEO_EDITOR"] },
  director: { label: "Review Inbox", href: "/director", icon: Eye, roles: ["MEDIA_DIRECTOR"] },
  analytics: { label: "Analytics", href: "/analytics", icon: PieChart, roles: ["CHIEF_COORDINATOR"] },
  plan: { label: "Marketing Plans", href: "/marketing-plan", icon: Calendar, roles: ["MARKETING_COORDINATOR"] },
  calendar: { label: "Calendar", href: "/calendar", icon: Calendar, roles: ["MARKETING_COORDINATOR", "CHIEF_COORDINATOR", "DESIGNER", "MEDIA_DIRECTOR", "ADMIN", "VIDEO_EDITOR"] },
  admin: { label: "Admin", href: "/admin", icon: ShieldAlert, roles: ["ADMIN"] },
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: notificationsResponse } = useNotifications(user?.$id);
  const markNotificationRead = useMarkNotificationRead(user?.$id);
  const notifications = notificationsResponse?.documents || [];
  const unreadCount = notifications.filter((notification: any) => !notification.isRead).length;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute) {
      router.replace("/login");
    }
  }, [user, isLoading, isPublicRoute, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-navy-600 h-12 w-12" />
      </div>
    );
  }

  // Allow rendering public pages without layout if unauthenticated
  if (!user && isPublicRoute) {
    return <>{children}</>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Authorization Check
  const currentRoles = (profile?.roles || []).map(r => r.toUpperCase().replace(' ', '_'));
  
  // A simplistic route guard based on pathname segments
  let authorized = true;
  if (pathname.startsWith("/admin") && !currentRoles.includes("ADMIN")) authorized = false;
  if (pathname.startsWith("/analytics") && !currentRoles.includes("CHIEF_COORDINATOR") && !currentRoles.includes("ADMIN")) authorized = false;
  if (pathname.startsWith("/designer") && !currentRoles.includes("DESIGNER") && !currentRoles.includes("VIDEO_EDITOR") && !currentRoles.includes("ADMIN")) authorized = false;
  if (pathname.startsWith("/director") && !currentRoles.includes("MEDIA_DIRECTOR") && !currentRoles.includes("ADMIN")) authorized = false;

  const allowedRoutes = Object.values(ROLE_ROUTES).filter(route => 
    route.roles.some(role => currentRoles.includes(role) || currentRoles.includes("ADMIN"))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-navy-950 text-white transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-navy-900">
          <span className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-gold-500" /> IMSSA Media
          </span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6 text-slate-300 hover:text-white" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">Workspaces</p>
            <nav className="space-y-1">
              {allowedRoutes.map((route) => {
                const Icon = route.icon;
                const active = pathname === route.href || (route.href !== "/" && pathname.startsWith(route.href));
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      active
                        ? "bg-navy-800 text-white"
                        : "text-navy-300 hover:bg-navy-800 hover:text-white"
                    }`}
                  >
                    <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${active ? "text-gold-400" : "text-navy-400"}`} />
                    {route.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-700 mr-4"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block text-sm text-slate-500 font-medium">
              {/* Breadcrumb approximation */}
              {pathname === "/" ? "Marketing Workspace" : 
               pathname.split('/').map(segment => segment.charAt(0).toUpperCase() + segment.slice(1)).join(' / ').replace(/^ \/ /, '')}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setSearchOpen(true)} className="text-slate-400 hover:text-slate-600" title="Search">
              <Search className="w-5 h-5" />
            </button>
            <div className="relative">
              <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="text-slate-400 hover:text-slate-600 relative flex items-center">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-2 border border-slate-200 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 font-medium text-sm text-slate-700">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">No new notifications</div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification: any) => (
                        <button
                          key={notification.$id}
                          type="button"
                          onClick={() => !notification.isRead && markNotificationRead.mutate(notification.$id)}
                          className={`w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}
                        >
                          <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{notification.message}</p>
                          <p className="mt-1 text-[10px] text-slate-400">{new Date(notification.$createdAt).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <Link href="/profile" className="hidden sm:flex flex-col items-end hover:bg-slate-50 p-1 rounded transition-colors">
                <span className="text-sm font-medium text-slate-700">{profile?.name || user.email}</span>
                <span className="text-xs text-slate-500">{currentRoles[0]?.replace(/_/g, " ") || "No Role"}</span>
              </Link>
              <button 
                onClick={logout}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50 relative">
          {!authorized ? (
            <div className="p-8 text-center">
              <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
              <p className="text-slate-600">You do not have the required roles to view this workspace.</p>
            </div>
          ) : (
            children
          )}
        </main>
        
        {/* System Status Bar at bottom */}
        <SystemStatusBar />
      </div>

      {/* Global overlays — available on all pages */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      <GlobalChatWidget />
    </div>
  );
}
