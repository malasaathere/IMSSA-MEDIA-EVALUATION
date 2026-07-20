"use client";

import { useState } from "react";
import { submitRegistrationRequest } from "../../api/user-requests";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function RegisterForm() {
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const result = await submitRegistrationRequest(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(true);
      (event.target as HTMLFormElement).reset();
    }
    
    setIsPending(false);
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-navy-900 mb-2">Request Submitted</h3>
        <p className="text-sm text-slate-500 mb-6">
          Your request for access has been sent to the administrators. 
          You will receive an email once your account is approved.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-sm font-medium text-navy-600 hover:text-navy-500"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Full Name
        </label>
        <div className="mt-1">
          <input
            id="name"
            name="name"
            type="text"
            required
            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
            placeholder="John Doe"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email Address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="requestedRole" className="block text-sm font-medium text-slate-700">
          Requested Role
        </label>
        <div className="mt-1">
          <select
            id="requestedRole"
            name="requestedRole"
            required
            className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm rounded-md"
          >
            <option value="">Select a role</option>
            <option value="DESIGNER">Graphic Designer</option>
            <option value="COORDINATOR">Coordinator</option>
            <option value="CHIEF_COORDINATOR">Chief Coordinator</option>
            <option value="DIRECTOR">Director</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Requested Events (Select all that apply)
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-md">
          {/* We ideally fetch these from API, but hardcoding placeholders for now */}
          {['Freshers Welcome', 'Annual General Meeting', 'Awards Ceremony', 'Media Campaign 2026'].map((event) => (
            <div key={event} className="flex items-center">
              <input
                id={`event-${event}`}
                name="requestedEvents"
                value={event}
                type="checkbox"
                className="h-4 w-4 text-navy-600 focus:ring-navy-500 border-slate-300 rounded"
              />
              <label htmlFor={`event-${event}`} className="ml-2 block text-sm text-slate-900">
                {event}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
          Reason for Access (Optional)
        </label>
        <div className="mt-1">
          <textarea
            id="reason"
            name="reason"
            rows={3}
            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
            placeholder="Why do you need access to this platform?"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-navy-600 hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Submitting...
            </>
          ) : (
            "Request Access"
          )}
        </button>
      </div>
    </form>
  );
}
