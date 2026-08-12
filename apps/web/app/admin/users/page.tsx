"use client";

import { UserRequestsList } from "../../../src/components/admin/UserRequestsList";

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="page-heading mb-8">
          <div><p>ACCESS CONTROL</p><h1>User Requests</h1><span>Approve access requests and assign the correct workspace roles.</span></div>
        </div>

        <UserRequestsList />
      </div>
    </div>
  );
}
