"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { canAccessPath, normalizeRoles } from "../../lib/access-control";
import { GlobalChatWidget } from "../chat/GlobalChatWidget";
import { AIAssistantWidget } from "../assistant/AIAssistantWidget";

const PUBLIC_ROUTES = ["/login", "/register", "/login/callback"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute) router.replace("/login");
  }, [isLoading, isPublicRoute, router, user]);

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-surface"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!user && isPublicRoute) return <>{children}</>;
  if (!user) return null;

  const authorized = canAccessPath(pathname, profile?.roles || []);
  const normalizedRoles = normalizeRoles(profile?.roles || []);
  const chiefOnly = normalizedRoles.includes('CHIEF_COORDINATOR') && normalizedRoles.every(role => role === 'CHIEF_COORDINATOR');

  return (
    <>
      {authorized ? children : (
        <div className="grid min-h-[70vh] place-items-center p-6 text-center">
          <div className="max-w-md rounded-[22px] border border-red-100 bg-white p-8 shadow-sm">
            <ShieldAlert className="mx-auto mb-4 h-11 w-11 text-red-400" />
            <h2 className="text-2xl font-bold text-navy-950">Access unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">This workspace is outside your assigned role. Ask an administrator if your responsibilities have changed.</p>
          </div>
        </div>
      )}
      {authorized && <AIAssistantWidget />}
      {authorized && !chiefOnly && <GlobalChatWidget />}
    </>
  );
}
