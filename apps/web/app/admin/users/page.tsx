"use client";

import { UserRequestsList } from "../../../src/components/admin/UserRequestsList";

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">User Requests</h1>
            <p className="mt-2 text-sm text-slate-600">
              Manage platform access requests, approve new users, and assign roles.
            </p>
          </div>
        </div>

        <UserRequestsList />
      </div>
    </div>
  );
}
