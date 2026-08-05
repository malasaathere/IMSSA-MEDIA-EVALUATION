import { Dialog } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Clock } from "lucide-react";
import { Task } from "./TaskCard";
import { TaskChat } from "./TaskChat";

interface TaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDialog({ task, open, onOpenChange }: TaskDialogProps) {
  if (!task) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="mb-4 shrink-0 pr-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock size={12} /> {new Date(task.dueDate).toLocaleDateString()}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-navy-900">{task.title}</h2>
          <p className="mt-2 text-text-muted text-sm max-h-[100px] overflow-y-auto">
            {task.description}
          </p>
        </div>

        <div className="mt-2 flex-1 min-h-0 flex flex-col">
          <h3 className="text-sm font-medium mb-2 shrink-0 text-navy-900">Task Discussion</h3>
          <div className="flex-1 min-h-0">
            <TaskChat taskId={task.id} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
