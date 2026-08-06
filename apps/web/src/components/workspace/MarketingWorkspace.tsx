"use client";

import { useState } from "react";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { CapacityPanel } from "./CapacityPanel";
import { CreateTaskDialog } from "./CreateTaskDialog";

export function MarketingWorkspace() {
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-950 mb-2 sm:text-3xl">Marketing Workspace</h1>
            <p className="text-text-muted">Manage media evaluation tasks and team capacity.</p>
          </div>
          <button
            onClick={() => setCreateTaskOpen(true)}
            className="w-full bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm sm:w-auto"
          >
            Create Task
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px] gap-6 lg:gap-8 xl:min-h-[calc(100vh-180px)]">
          {/* Main Kanban Area */}
          <div className="min-w-0 bg-white rounded-2xl border border-border p-3 sm:p-6 shadow-sm overflow-hidden flex flex-col">
            <h2 className="text-xl font-semibold text-navy-900 mb-6">Task Board</h2>
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
