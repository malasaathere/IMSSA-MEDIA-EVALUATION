"use client";

import { useState } from "react";
import { loginOrSignupWithPin, logout } from "../../api/auth";
import { Loader2, AlertCircle, Megaphone, BarChart3, Palette, ShieldCheck, ArrowLeft, KeyRound, Settings2 } from "lucide-react";

type PortalId = 'marketing' | 'chief' | 'designer' | 'director' | 'admin';

const PORTALS: Array<{
  id: PortalId;
  title: string;
  description: string;
  roles: string[];
  href: string;
  icon: typeof Megaphone;
}> = [
  {
    id: 'marketing',
    title: 'Marketing Coordinator',
    description: 'Create tasks, manage campaigns, and monitor delivery.',
    roles: ['MARKETING_COORDINATOR'],
    href: '/',
    icon: Megaphone,
  },
  {
    id: 'chief',
    title: 'Chief Coordinator',
    description: 'View analytics, workload, deadlines, and team progress.',
    roles: ['CHIEF_COORDINATOR'],
    href: '/analytics',
    icon: BarChart3,
  },
  {
    id: 'designer',
    title: 'Designers & Editors',
    description: 'View assigned work, upload drafts, and handle revisions.',
    roles: ['DESIGNER', 'VIDEO_EDITOR'],
    href: '/designer',
    icon: Palette,
  },
  {
    id: 'director',
    title: 'Media Directors',
    description: 'Review submissions, request revisions, and approve work.',
    roles: ['MEDIA_DIRECTOR'],
    href: '/director',
    icon: ShieldCheck,
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Assign user positions, event scope, and system access.',
    roles: ['ADMIN'],
    href: '/admin',
    icon: Settings2,
  },
];

export function LoginForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortal, setSelectedPortal] = useState<PortalId | null>(null);

  const portal = PORTALS.find(item => item.id === selectedPortal);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    if (!portal) {
      setError('Select a workspace before entering your PIN.');
      setIsPending(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const pin = formData.get("pin") as string;

    try {
      const result = await loginOrSignupWithPin(pin);
      if (result.success) {
        const roles = (result.user?.roles || []).map((role: string) => role.toUpperCase().replace(/ /g, '_'));
        const hasPortalRole = portal.roles.some(role => roles.includes(role)) || roles.includes('ADMIN');
        if (!hasPortalRole) {
          await logout();
          throw new Error(`This PIN does not have access to the ${portal.title} portal.`);
        }
        window.location.href = portal.href;
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      {!portal ? (
        <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PORTALS.filter(item => item.id !== 'admin').map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { setSelectedPortal(item.id); setError(null); }}
                className="group flex min-h-40 flex-col items-start rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-navy-500 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
              >
                <span className="mb-4 rounded-lg bg-navy-900 p-3 text-white transition group-hover:bg-navy-700">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-base font-bold text-navy-950">{item.title}</span>
                <span className="mt-2 text-sm leading-5 text-slate-600">{item.description}</span>
              </button>
            );
          })}
        </div>
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => { setSelectedPortal('admin'); setError(null); }}
              className="text-xs font-medium text-slate-400 underline-offset-4 transition-colors hover:text-slate-600 hover:underline"
            >
              System access
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-6">
          <button
            type="button"
            onClick={() => { setSelectedPortal(null); setError(null); }}
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-navy-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Change workspace
          </button>

          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 text-white">
              <KeyRound className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-xl font-bold text-navy-950">{portal.title}</h3>
            <p className="mt-1 text-sm text-slate-600">Enter your authorized account passkey.</p>
          </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

          <div>
          <label htmlFor="pin" className="block text-sm font-medium text-slate-700">
            Passkey
          </label>
          <div className="mt-1">
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="text"
              pattern="[A-Za-z0-9_-]{4,20}"
              minLength={4}
              maxLength={20}
              required
              className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm tracking-widest text-center text-lg"
              placeholder="Enter passkey"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Use the passkey assigned to your account.</p>
          </div>

          <div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex justify-center py-2 px-4 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus disabled:opacity-50 transition-all duration-300"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Signing in...
              </>
            ) : (
              `Open ${portal.title} Portal`
            )}
          </button>
          </div>
        </form>
      )}
    </div>
  );
}
