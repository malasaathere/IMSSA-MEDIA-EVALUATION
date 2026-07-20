"use client";

import { useAuth } from "@/lib/auth-context";
import { LoginForm } from "@/components/auth/LoginForm";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <Loader2 className="animate-spin text-gold-500 h-12 w-12" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-navy-900 text-navy-50 flex flex-col">
      <nav className="bg-navy-950 p-2 border-b border-navy-800 flex justify-between items-center text-sm shadow-md z-10 sticky top-0">
        <div className="flex space-x-6 overflow-x-auto px-4">
          <Link href="/" className="hover:text-gold-400 whitespace-nowrap transition-colors font-medium">
            Marketing (Coordinator)
          </Link>
          <Link href="/designer" className="hover:text-gold-400 whitespace-nowrap transition-colors font-medium">
            My Work (Designer)
          </Link>
          <Link href="/director" className="hover:text-gold-400 whitespace-nowrap transition-colors font-medium">
            Review Inbox (Director)
          </Link>
          <Link href="/analytics" className="hover:text-gold-400 whitespace-nowrap transition-colors font-medium">
            Analytics (Chief)
          </Link>
          <Link href="/admin" className="hover:text-gold-400 whitespace-nowrap transition-colors font-medium">
            Admin
          </Link>
          <Link href="/marketing-plan" className="hover:text-gold-400 whitespace-nowrap transition-colors font-medium">
            Google Plan
          </Link>
        </div>
        <div className="flex items-center space-x-4 pr-4 border-l border-navy-800 pl-4 ml-4">
          <span className="text-navy-300 font-mono text-xs">{user.email}</span>
          <button 
            onClick={logout} 
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 px-3 py-1 rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
