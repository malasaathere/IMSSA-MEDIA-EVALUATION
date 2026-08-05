"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, FileText, CheckSquare } from "lucide-react";
import { useTasks, useMarketingPlans } from "../../api/queries";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: tasksResponse } = useTasks();
  const { data: plansResponse } = useMarketingPlans();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  const q = query.toLowerCase().trim();

  const matchedTasks = q.length < 2 ? [] :
    (tasksResponse?.documents || []).filter((t: any) =>
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.eventId?.toLowerCase().includes(q) ||
      t.status?.toLowerCase().includes(q)
    ).slice(0, 8);

  const matchedPlans = q.length < 2 ? [] :
    (plansResponse?.documents || []).filter((p: any) =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.campaign?.toLowerCase().includes(q) ||
      p.platform?.toLowerCase().includes(q)
    ).slice(0, 8);

  const hasResults = matchedTasks.length > 0 || matchedPlans.length > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={() => onOpenChange(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal box */}
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, marketing plans..."
            className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
          />
          <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {q.length < 2 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Type at least 2 characters to search
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No results found for "<strong>{query}</strong>"
            </div>
          ) : (
            <div className="py-2">
              {matchedTasks.length > 0 && (
                <>
                  <p className="px-4 py-2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Tasks</p>
                  {matchedTasks.map((task: any) => (
                    <div key={task.$id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                      <CheckSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                        <p className="text-xs text-slate-500 truncate">{task.eventId} • {task.status}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {matchedPlans.length > 0 && (
                <>
                  <p className="px-4 py-2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Marketing Plans</p>
                  {matchedPlans.map((plan: any) => (
                    <div key={plan.$id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                      <FileText className="h-4 w-4 text-gold-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{plan.title}</p>
                        <p className="text-xs text-slate-500 truncate">{plan.campaign} • {plan.platform}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-100 flex gap-3">
          <span className="text-[10px] text-slate-400">ESC to close</span>
          <span className="text-[10px] text-slate-400">↑↓ navigate</span>
        </div>
      </div>
    </div>
  );
}
