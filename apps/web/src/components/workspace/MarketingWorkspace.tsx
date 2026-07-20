import { KanbanBoard } from "../kanban/KanbanBoard"
import { CapacityPanel } from "./CapacityPanel"

export function MarketingWorkspace() {
  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-navy-950 mb-2">Marketing Workspace</h1>
            <p className="text-text-muted">Manage media evaluation tasks and team capacity.</p>
          </div>
          <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            Create Task
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8 h-[calc(100vh-160px)]">
          {/* Main Kanban Area */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm overflow-hidden flex flex-col">
            <h2 className="text-xl font-semibold text-navy-900 mb-6">Task Board</h2>
            <div className="flex-1 overflow-hidden">
              <KanbanBoard />
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="flex flex-col gap-6">
            <CapacityPanel />
            
            {/* Quick Stats or Actions could go here */}
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex-1">
               <h3 className="text-lg font-semibold text-navy-900 mb-4">Recent Activity</h3>
               <div className="text-sm text-text-muted flex items-center justify-center h-32">
                 No recent activity
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
