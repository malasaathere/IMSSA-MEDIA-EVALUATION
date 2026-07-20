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
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-8 border-b border-slate-200 bg-navy-950 text-white flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-navy-800 border-4 border-navy-700 flex items-center justify-center text-3xl font-bold text-gold-400">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
            <p className="text-navy-300 mt-1 flex items-center">
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
                  <span key={role} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-navy-100 text-navy-800 border border-navy-200">
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
                  <span key={event} className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
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
