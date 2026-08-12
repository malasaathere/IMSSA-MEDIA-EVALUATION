"use client";

import { useAuth } from "../../lib/auth-context";
import { User, Mail, Shield, Calendar, Loader2 } from "lucide-react";

export function UserProfile() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-navy-600" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="p-8 text-center text-slate-500">
        Could not load profile information.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="overflow-hidden rounded-[22px] border border-border bg-white shadow-[0_8px_28px_rgba(34,65,61,.055)]">
        <div className="flex flex-col items-start gap-5 border-b border-emerald-100 bg-gradient-to-br from-emerald-100 via-teal-50 to-lime-50 px-5 py-8 sm:flex-row sm:items-center sm:px-8">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border-4 border-white bg-gradient-to-br from-primary to-emerald-400 text-3xl font-bold text-white shadow-lg">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold text-navy-950">{profile.name}</h1>
            <p className="mt-2 flex min-w-0 items-center break-all text-navy-700">
              <Mail className="w-4 h-4 mr-2" />
              {profile.email}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-navy-600" />
              Assigned Roles
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.roles.length > 0 ? (
                profile.roles.map(role => (
                  <span key={role} className="inline-flex items-center rounded-full border border-emerald-200 bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
                    {role.replace(/_/g, " ")}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500 italic">No roles assigned</span>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-navy-600" />
              Authorized Events
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.events.length > 0 ? (
                profile.events.map(event => (
                  <span key={event} className="inline-flex items-center rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium text-navy-800">
                    {event}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500 italic">No specific events authorized</span>
              )}
            </div>
          </section>

          <section className="pt-4 border-t border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Settings</h2>
            <div className="bg-slate-50 rounded-md p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-4">
                Your account is currently managed by the IMSSA Platform Administrators. To change your email or request additional roles, please contact an administrator.
              </p>
              <div className="text-sm">
                <span className="font-medium text-slate-700">Account ID:</span>{" "}
                <code className="text-xs bg-white px-2 py-1 rounded border border-slate-200 text-slate-500 ml-2">
                  {user.$id}
                </code>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
