"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRequests } from "../../api/queries";
import { approveUserRequest, rejectUserRequest } from "../../api/user-requests";
import { Check, X, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";

export function UserRequestsList() {
  const [currentFilter, setCurrentFilter] = useState("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { data, isLoading, isError, error } = useUserRequests(currentFilter);
  const queryClient = useQueryClient();

  const filters = [
    { label: "All", value: "ALL" },
    { label: "Pending", value: "PENDING_APPROVAL" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  async function handleApprove(id: string) {
    setProcessingId(id);
    const result = await approveUserRequest(id, "admin-user-id");
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["user_requests"] });
    } else {
      alert(result.error);
    }
    setProcessingId(null);
  }

  async function handleReject(id: string) {
    if (!confirm("Are you sure you want to reject this request?")) return;
    
    setProcessingId(id);
    const result = await rejectUserRequest(id, "admin-user-id");
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["user_requests"] });
    } else {
      alert(result.error);
    }
    setProcessingId(null);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case "APPROVED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</span>;
      case "REJECTED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  if (isError) {
    return (
      <div className="bg-red-50 p-4 rounded-md border border-red-200">
        <h3 className="text-sm font-medium text-red-800">Error loading requests</h3>
        <div className="mt-2 text-sm text-red-700">{(error as any)?.message || "Unknown error"}</div>
      </div>
    );
  }

  const requests = data?.requests || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex space-x-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setCurrentFilter(filter.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              currentFilter === filter.value
                ? "bg-navy-50 text-navy-700 border border-navy-200"
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role & Events</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-navy-500" /></div>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No requests found for the selected filter.
                </td>
              </tr>
            ) : (
              requests.map((req: any) => (
                <tr key={req.$id} className={processingId === req.$id ? "opacity-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-navy-900">{req.name}</span>
                      <span className="text-sm text-slate-500">{req.email}</span>
                      <span className="text-xs text-slate-400 mt-1">
                        Requested: {new Date(req.$createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{req.requestedRole}</div>
                    <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                      {req.requestedEvents?.map((e: string) => (
                        <span key={e} className="inline-flex px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 border border-slate-200">
                          {e}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 max-w-xs truncate" title={req.reason}>
                      {req.reason || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {req.status === "PENDING_APPROVAL" && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(req.$id)}
                          disabled={processingId === req.$id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                        >
                          {processingId === req.$id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.$id)}
                          disabled={processingId === req.$id}
                          className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                        >
                          {processingId === req.$id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
