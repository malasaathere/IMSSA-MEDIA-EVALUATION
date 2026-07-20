import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { MessageSquare, Check, X, Maximize2, Loader2 } from "lucide-react";
import { ReviewCanvas } from "./ReviewCanvas";
import { PostApprovalDialog } from "./PostApprovalDialog";
import { useTasks, useVersions } from "../../api/queries";
import { api } from "../../api/api-client";
import { BUCKETS } from "../../lib/appwrite-collections";

export function DirectorWorkspace() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { data: response, isLoading: tasksLoading } = useTasks();
  const tasks = response?.documents || [];
  
  // Tasks ready for review or currently in review
  const inboxTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_REVIEW');
  const selectedTask = tasks.find(t => t.$id === selectedTaskId) || inboxTasks[0];

  const { data: versionsResponse, isLoading: versionsLoading } = useVersions(selectedTask?.$id || null);
  const latestVersion = versionsResponse?.documents?.[0];

  if (tasksLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="animate-spin text-gold-500 h-10 w-10" /></div>;
  }

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
              key={task.$id}
              onClick={() => setSelectedTaskId(task.$id)}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                (selectedTask && selectedTask.$id === task.$id) ? "border-navy-900 bg-surface-selected" : "border-border hover:bg-surface"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-semibold text-navy-950">{task.title}</h4>
              </div>
              <p className="text-xs text-text-muted mb-2">{task.eventId || 'Event'} • By Designer</p>
              <Badge variant="warning">{task.status || 'IN REVIEW'}</Badge>
            </div>
          ))}
          {inboxTasks.length === 0 && (
            <div className="text-center text-sm text-text-muted mt-8">Inbox zero!</div>
          )}
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
                {latestVersion && latestVersion.fileId ? (
                  <ReviewCanvas imageUrl={api.getFileView(BUCKETS.DRAFT_IMAGES, latestVersion.fileId)} />
                ) : (
                  <div className="text-text-muted">No draft submitted yet</div>
                )}
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
