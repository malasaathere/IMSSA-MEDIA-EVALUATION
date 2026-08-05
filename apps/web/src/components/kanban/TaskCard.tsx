import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card"
import { Badge } from "../ui/badge"
import { Clock, AlertCircle } from "lucide-react"

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  assigneeName?: string;
}

export function TaskCard({ task, onClick }: { task: Task, onClick?: () => void }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  }

  return (
    <Card onClick={onClick} className="mb-3 cursor-pointer border-transparent bg-white shadow-sm hover:border-primary-soft hover:shadow-md transition-all active:scale-[0.98]">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start mb-2">
          <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
          <button className="text-text-muted hover:text-text transition-colors">
            <AlertCircle size={16} />
          </button>
        </div>
        <CardTitle className="text-base text-navy-900">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 pb-3">
        <p className="text-sm text-text-muted line-clamp-2">{task.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
        <div className="flex -space-x-2">
          {task.assigneeName ? (
            <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] border-2 border-white font-medium" title={task.assigneeName}>
              {task.assigneeName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] border-2 border-white font-medium" title="Unassigned">
              ?
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
