import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { ReviewCanvas } from "./ReviewCanvas";
import { PostApprovalDialog } from "./PostApprovalDialog";
import { AddUserDialog } from "./AddUserDialog";
import { useTasks, useVersions } from "../../api/queries";
import { api } from "../../api/api-client";
import { BUCKETS } from "../../lib/appwrite-collections";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context";

export function DirectorWorkspace() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: response, isLoading: tasksLoading } = useTasks();
  const tasks = response?.documents || [];
  
  // Tasks ready for review or currently in review
  const inboxTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_REVIEW');
  const selectedTask = tasks.find(t => t.$id === selectedTaskId) || inboxTasks[0];

  const { data: versionsResponse, isLoading: versionsLoading } = useVersions(selectedTask?.$id || null);
  const latestVersion = versionsResponse?.documents?.[0];

  const handleRevision = async () => {
    if (!selectedTask || !latestVersion) return;
    setActionPending(true);
    setActionMessage("");
    try {
      await api.requestRevision(latestVersion.$id, {});
      await api.updateTaskStatus(selectedTask.$id, 'REVISION_REQUESTED');
      setActionMessage('Revision requested successfully. The designer can now submit an updated version.');
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['versions', selectedTask.$id] });
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not request a revision.');
    } finally {
      setActionPending(false);
    }
  };

  const handleApproval = async (feedback: { rating: number; message: string; suggestions: string }) => {
    if (!selectedTask || !latestVersion || !profile) return;
    setActionPending(true);
    setActionMessage("");
    try {
      await api.approveVersion(latestVersion.$id, {});
      await api.updateTaskStatus(selectedTask.$id, 'COMPLETED');
      await api.submitFeedback(latestVersion.$id, {
        taskId: selectedTask.$id,
        reviewerId: profile.$id,
        decision: 'APPROVED',
        comment: [
          `Rating: ${feedback.rating}/5`,
          feedback.message,
          feedback.suggestions ? `Suggestions: ${feedback.suggestions}` : '',
        ].filter(Boolean).join('\n'),
      });
      setFeedbackOpen(false);
      setActionMessage('Version approved and feedback saved successfully.');
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['versions', selectedTask.$id] });
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Could not approve this version.');
    } finally {
      setActionPending(false);
    }
  };

  if (tasksLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="animate-spin text-gold-500 h-10 w-10" /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface lg:h-screen">
      {/* Header */}
      <header className="flex flex-col items-start gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy-950">Review Inbox</h1>
          <p className="text-sm text-text-muted">Media Director Workspace</p>
        </div>
        <div className="flex items-center">
          <AddUserDialog />
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-visible lg:flex-row lg:overflow-hidden">
        {/* Left Sidebar - Inbox */}
        <div className="w-full flex-shrink-0 border-b border-border bg-white p-3 space-y-3 overflow-x-auto lg:w-80 lg:border-b-0 lg:border-r lg:overflow-y-auto lg:p-4 lg:space-y-4">
          <h3 className="text-sm font-semibold text-navy-950 px-2">Needs Review ({inboxTasks.length})</h3>
          
          <div className="flex gap-3 lg:block lg:space-y-4">
          {inboxTasks.map(task => (
            <div 
              key={task.$id}
              onClick={() => setSelectedTaskId(task.$id)}
              className={`w-[78vw] max-w-72 flex-none cursor-pointer rounded-lg border p-3 transition-colors lg:w-auto lg:max-w-none ${
                (selectedTask && selectedTask.$id === task.$id) ? "border-navy-900 bg-surface-selected" : "border-border hover:bg-surface"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-semibold text-navy-950">{task.title}</h4>
              </div>
              <p className="text-xs text-text-muted mb-2">{task.eventId || 'General'} • {task.workType || 'Task'}</p>
              <Badge variant="warning">{task.status || 'IN REVIEW'}</Badge>
            </div>
          ))}
          </div>
          {inboxTasks.length === 0 && (
            <div className="text-center text-sm text-text-muted mt-8">Inbox zero!</div>
          )}
        </div>

        {/* Main Review Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface">
          {selectedTask ? (
            <>
              {/* Toolbar */}
              <div className="flex flex-col items-start gap-3 border-b border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
                  <h2 className="text-lg font-semibold text-navy-950">{selectedTask.title}</h2>
                  <Badge variant="outline">
                    {latestVersion ? `Submitted ${new Date(latestVersion.$createdAt).toLocaleString()}` : 'No submission yet'}
                  </Badge>
                </div>
              </div>

              {actionMessage && <div className="border-b border-border bg-blue-50 px-4 py-3 text-sm text-blue-800" role="status">{actionMessage}</div>}

              {/* Preview Area */}
              <div className="flex min-h-72 flex-1 items-center justify-center overflow-auto p-3 relative sm:p-6">
                {latestVersion && latestVersion.fileId ? (
                  <ReviewCanvas imageUrl={api.getFileView(BUCKETS.DRAFT_IMAGES, latestVersion.fileId)} />
                ) : (
                  <div className="text-text-muted">No draft submitted yet</div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-border bg-white p-3 flex flex-col gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <p className="text-xs text-text-muted">Use the pin or rectangle tools above to annotate the submitted design.</p>
                <div className="grid grid-cols-1 gap-2 sm:flex sm:space-x-3">
                  <Button variant="destructive" onClick={handleRevision} disabled={!latestVersion || actionPending}><X className="mr-2 h-4 w-4" /> Request Revision</Button>
                  <Button className="bg-success hover:bg-success/90" onClick={() => setFeedbackOpen(true)} disabled={!latestVersion || !profile || actionPending}>
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

      <PostApprovalDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} onSubmit={handleApproval} isSubmitting={actionPending} />
    </div>
  );
}
