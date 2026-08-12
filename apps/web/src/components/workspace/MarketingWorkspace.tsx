"use client";

import { useState } from "react";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { CapacityPanel } from "./CapacityPanel";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { CalendarDays, CheckCircle2, Clock3, Plus, TrendingUp } from "lucide-react";
import { useAuth } from "../../lib/auth-context";

export function MarketingWorkspace() {
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const { profile, user } = useAuth();
  const firstName = (profile?.name || user?.name || "there").trim().split(/\s+/)[0];

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-primary">Tuesday, 11 August 2026</p>
            <h1 className="text-2xl font-bold text-navy-950 mb-2 sm:text-3xl">Good morning, {firstName}</h1>
            <p className="text-text-muted">Here is what needs your attention across the media team.</p>
          </div>
          <button
            onClick={() => setCreateTaskOpen(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white shadow-[0_7px_16px_rgba(7,135,126,.18)] transition-colors hover:bg-primary-hover sm:w-auto"
          >
            <Plus size={18} /> Create Task
          </button>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: "Active tasks", value: "12", note: "+3 this week", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
            { label: "Due this week", value: "6", note: "2 need briefs", icon: CalendarDays, tone: "bg-sky-50 text-sky-700" },
            { label: "In review", value: "4", note: "1 urgent", icon: Clock3, tone: "bg-amber-50 text-amber-700" },
            { label: "Completion", value: "84%", note: "+8% this month", icon: TrendingUp, tone: "bg-violet-50 text-violet-700" },
          ].map(({label,value,note,icon:Icon,tone}) => (
            <article key={label} className="rounded-[20px] border border-border bg-white p-4 shadow-[0_8px_28px_rgba(34,65,61,.05)] sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-2"><span className="text-sm font-semibold text-text-muted">{label}</span><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={17}/></span></div>
              <strong className="block text-2xl font-extrabold tracking-tight text-navy-950 sm:text-3xl">{value}</strong>
              <small className="mt-1 block text-xs text-text-muted">{note}</small>
            </article>
          ))}
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)]">
          <div className="dashboard-welcome-card">
            <div>
              <span className="dashboard-pill">TODAY&apos;S PRIORITY</span>
              <h2>Keep this week&apos;s campaign delivery moving.</h2>
              <p>Review incoming drafts, confirm briefs and clear the urgent flyer queue.</p>
            </div>
            <div className="dashboard-landscape" aria-hidden="true"><i/><i/><i/></div>
          </div>
          <div className="rounded-[22px] border border-border bg-white p-5 shadow-[0_8px_28px_rgba(34,65,61,.055)]">
            <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-navy-950">Flyers to Complete ASAP</h2><p className="text-xs text-text-muted">Due this week · 12–16 Aug</p></div><CalendarDays size={20} className="shrink-0 text-primary"/></div>
            <div className="space-y-2.5">
              {[
                ["HackX Registration Closing", "Wed 12 Aug", "Urgent"],
                ["Exposition Podcast Promo", "Thu 13 Aug", "High"],
                ["HackX Jr Workshop Reminder", "Fri 14 Aug", "High"],
                ["Exposition Speaker Reveal", "Sun 16 Aug", "Medium"],
              ].map(([title,date,priority]) => (
                <div key={title} className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
                  <span className="h-8 w-1 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-navy-950">{title}</p><p className="text-xs text-text-muted">{date}</p></div>
                  <span className="shrink-0 rounded-full bg-primary-soft px-2 py-1 text-[10px] font-bold text-primary">{priority}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px] gap-6 lg:gap-8 xl:min-h-[calc(100vh-180px)]">
          {/* Main Kanban Area */}
          <div className="min-w-0 bg-white rounded-2xl border border-border p-3 sm:p-6 shadow-sm overflow-hidden flex flex-col">
            <div className="mb-6 flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-navy-900">Task Board</h2><p className="mt-1 text-xs text-text-muted">Drag work through the delivery stages</p></div><span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">Live</span></div>
            <div className="flex-1 overflow-hidden">
              <KanbanBoard />
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="flex flex-col gap-6">
            <CapacityPanel />

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex-1">
              <h3 className="text-lg font-semibold text-navy-900 mb-4">Recent Activity</h3>
              <div className="text-sm text-text-muted flex items-center justify-center h-32">
                No recent activity
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateTaskDialog open={createTaskOpen} onOpenChange={setCreateTaskOpen} />
    </div>
  );
}
