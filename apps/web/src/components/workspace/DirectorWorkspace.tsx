import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { MessageSquare, Check, X, Maximize2 } from "lucide-react";
import { ReviewCanvas } from "./ReviewCanvas";
import { PostApprovalDialog } from "./PostApprovalDialog";

export function DirectorWorkspace() {
  const [selectedTask, setSelectedTask] = useState<number | null>(1);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const inboxTasks = [
    { id: 1, title: "Opening Ceremony Poster", event: "Event 1", designer: "Alice", status: "In Review" },
    { id: 2, title: "Highlights Video", event: "Event 2", designer: "Bob", status: "In Review" },
  ];

  return (
    <div className="flex h-screen flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy-950">Review Inbox</h1>
          <p className="text-sm text-text-muted">Media Director Workspace</p>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Inbox */}
        <div className="w-80 flex-shrink-0 border-r border-border bg-white overflow-y-auto p-4 space-y-4">
          <h3 className="text-sm font-semibold text-navy-950 px-2">Needs Review ({inboxTasks.length})</h3>
          
          {inboxTasks.map(task => (
            <div 
              key={task.id}
              onClick={() => setSelectedTask(task.id)}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                selectedTask === task.id ? "border-navy-900 bg-surface-selected" : "border-border hover:bg-surface"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-semibold text-navy-950">{task.title}</h4>
              </div>
              <p className="text-xs text-text-muted mb-2">{task.event} • By {task.designer}</p>
              <Badge variant="warning">In Review</Badge>
            </div>
          ))}
        </div>

        {/* Main Review Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface">
          {selectedTask ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-border bg-white p-4">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-navy-950">Opening Ceremony Poster - v2</h2>
                  <Badge variant="outline">Submitted 2h ago</Badge>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Maximize2 className="mr-2 h-4 w-4" /> Fullscreen
                  </Button>
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex-1 overflow-auto p-6 flex items-center justify-center relative">
                <ReviewCanvas />
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-border bg-white p-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <Button variant="outline"><MessageSquare className="mr-2 h-4 w-4" /> Add Comment</Button>
                <div className="space-x-3">
                  <Button variant="destructive"><X className="mr-2 h-4 w-4" /> Request Revision</Button>
                  <Button className="bg-success hover:bg-success/90" onClick={() => setFeedbackOpen(true)}>
                    <Check className="mr-2 h-4 w-4" /> Approve Version
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              Select a task from the inbox to review
            </div>
          )}
        </div>
      </main>

      <PostApprovalDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}
