import { useState } from "react"
import { TaskCard, Task } from "./TaskCard"
import { useTasks, useUsers } from "../../api/queries"
import { Loader2 } from "lucide-react"
import { TaskDialog } from "./TaskDialog"

export function KanbanBoard() {
  const { data: response, isLoading, isError } = useTasks();
  const { data: usersResponse } = useUsers();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const tasks = response?.documents || [];
  const users = usersResponse?.documents || [];

  const columns = [
    { id: 'PENDING', title: 'To Do', color: 'bg-surface' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-primary-soft' },
    { id: 'COMPLETED', title: 'Done', color: 'bg-surface-selected' },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <Loader2 className="animate-spin text-gold-500 h-10 w-10" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-[500px] text-red-500 font-medium">
        Failed to load tasks.
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col w-80 min-w-[320px] max-w-[320px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-semibold text-navy-900">{column.title}</h3>
              <span className="text-sm font-medium text-text-muted bg-surface px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === column.id || (!t.status && column.id === 'PENDING')).length}
              </span>
            </div>
            
            <div className={`flex-1 rounded-2xl ${column.color} p-3 min-h-[500px]`}>
              {tasks.filter(t => t.status === column.id || (!t.status && column.id === 'PENDING')).map(task => {
                const assignee = users.find((u: any) => u.authUserId === task.currentAssigneeId);
                const taskObj = {
                  id: task.$id,
                  title: task.title,
                  description: task.description,
                  status: task.status || 'PENDING',
                  priority: task.priority || 'NORMAL',
                  dueDate: task.deadline,
                  assigneeName: assignee ? assignee.name : undefined
                };
                return (
                  <TaskCard 
                    key={task.$id} 
                    task={taskObj} 
                    onClick={() => setSelectedTask(taskObj)} 
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <TaskDialog 
        task={selectedTask} 
        open={selectedTask !== null} 
        onOpenChange={(open) => !open && setSelectedTask(null)} 
      />
    </>
  )
}
