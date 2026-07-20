import { Task, TaskCard } from "./TaskCard"

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Review Annual Dinner Poster",
    description: "Check for branding alignment and event details correctness.",
    status: "PENDING",
    priority: "HIGH",
    dueDate: "2026-07-25T00:00:00.000Z"
  },
  {
    id: "2",
    title: "Approve Social Media Campaign",
    description: "Review the copy and graphics for the Q3 campaign.",
    status: "PENDING",
    priority: "MEDIUM",
    dueDate: "2026-07-28T00:00:00.000Z"
  },
  {
    id: "3",
    title: "Evaluate Newsletter Draft",
    description: "Ensure all links work and grammar is correct.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    dueDate: "2026-07-22T00:00:00.000Z"
  },
  {
    id: "4",
    title: "Sign off Logo redesign",
    description: "Final approval on the modern logo redesign variations.",
    status: "COMPLETED",
    priority: "LOW",
    dueDate: "2026-07-15T00:00:00.000Z"
  }
];

export function KanbanBoard() {
  const columns = [
    { id: 'PENDING', title: 'To Do', color: 'bg-surface' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-primary-soft' },
    { id: 'COMPLETED', title: 'Done', color: 'bg-surface-selected' },
  ];

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col w-80 min-w-[320px] max-w-[320px]">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-semibold text-navy-900">{column.title}</h3>
            <span className="text-sm font-medium text-text-muted bg-surface px-2 py-1 rounded-full">
              {mockTasks.filter(t => t.status === column.id).length}
            </span>
          </div>
          
          <div className={`flex-1 rounded-2xl ${column.color} p-3 min-h-[500px]`}>
            {mockTasks.filter(t => t.status === column.id).map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
