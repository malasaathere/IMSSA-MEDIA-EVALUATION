import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Check, X, Loader2, Search, SlidersHorizontal, Inbox, FilterX } from "lucide-react";
import { ReviewCanvas } from "./ReviewCanvas";
import { PostApprovalDialog } from "./PostApprovalDialog";
import { useTasks, useVersions } from "../../api/queries";
import { api } from "../../api/api-client";
import { BUCKETS } from "../../lib/appwrite-collections";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context";
import { matchesAuthorizedEvent, normalizeRoles } from "../../lib/access-control";

export function DirectorWorkspace() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [workTypeFilter, setWorkTypeFilter] = useState("ALL");
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: response, isLoading: tasksLoading } = useTasks();
  const tasks = response?.documents || [];
  const roles = normalizeRoles(profile?.roles || []);
  const assignedEvents = profile?.events || [];
  const isAdmin = roles.includes('ADMIN');
  const scopedTasks = isAdmin ? tasks : tasks.filter(task => matchesAuthorizedEvent(task, assignedEvents));
  const reviewTasks = scopedTasks.filter(task => task.status === 'PENDING' || task.status === 'IN_REVIEW');
  const eventOptions = Array.from(new Set(scopedTasks.map((task: any) => task.eventName || task.eventId).filter(Boolean))).sort() as string[];
  const workTypeOptions = Array.from(new Set(scopedTasks.map((task: any) => task.workType).filter(Boolean))).sort() as string[];
  const inboxTasks = reviewTasks.filter((task: any) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [task.title, task.description, task.eventName, task.eventId, task.workType]
      .some(value => String(value || '').toLowerCase().includes(query));
    const taskEvent = task.eventName || task.eventId || '';
    return matchesSearch
      && (eventFilter === 'ALL' || taskEvent === eventFilter)
      && (statusFilter === 'ALL' || task.status === statusFilter)
      && (workTypeFilter === 'ALL' || task.workType === workTypeFilter);
  });
  const hasActiveFilters = Boolean(searchQuery || eventFilter !== 'ALL' || statusFilter !== 'ALL' || workTypeFilter !== 'ALL');
  const selectedTask = inboxTasks.find(t => t.$id === selectedTaskId) || inboxTasks[0];

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

  const clearFilters = () => {
    setSearchQuery('');
    setEventFilter('ALL');
    setStatusFilter('ALL');
    setWorkTypeFilter('ALL');
  };

  if (tasksLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="animate-spin text-gold-500 h-10 w-10" /></div>;
  }

  return (
    <div className="flex min-h-full flex-col bg-surface lg:min-h-[calc(100vh-82px)]">
      {/* Header */}
      <header className="page-heading director-page-heading mx-4 mt-4 sm:mx-6 sm:mt-6">
        <div>
          <p>MEDIA DIRECTOR WORKSPACE</p>
          <h1>Review Inbox</h1>
          <span>Annotate submissions, request revisions and approve final work.</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-visible lg:flex-row lg:overflow-hidden">
        {/* Left Sidebar - Inbox */}
        <div className="director-inbox w-full flex-shrink-0 border-b border-border bg-white p-3 space-y-3 overflow-x-auto lg:w-96 lg:border-b-0 lg:border-r lg:overflow-y-auto lg:p-4 lg:space-y-4">
          <div className="px-2"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-navy-950">Needs Review <span className="text-text-muted">({inboxTasks.length})</span></h3><SlidersHorizontal className="h-4 w-4 text-primary"/></div><p className="mt-1 text-[11px] text-text-muted">{isAdmin ? 'All assigned events' : assignedEvents.length ? assignedEvents.join(', ') : 'No event assigned'}</p></div>

          <div className="grid gap-2 rounded-2xl border border-border bg-surface p-3">
            <label className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 text-text-muted"><Search className="h-4 w-4 shrink-0"/><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search submissions" className="w-full bg-transparent text-xs text-navy-950 outline-none"/></label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <select value={eventFilter} onChange={event => setEventFilter(event.target.value)} className="min-h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-navy-800"><option value="ALL">All events</option>{eventOptions.map(event => <option key={event} value={event}>{event}</option>)}</select>
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="min-h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-navy-800"><option value="ALL">All review statuses</option><option value="PENDING">Pending</option><option value="IN_REVIEW">In review</option></select>
              <select value={workTypeFilter} onChange={event => setWorkTypeFilter(event.target.value)} className="min-h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-navy-800"><option value="ALL">All work types</option>{workTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}</select>
            </div>
            {hasActiveFilters && <button onClick={clearFilters} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary-soft"><FilterX className="h-3.5 w-3.5"/> Clear filters</button>}
          </div>
          
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
            <div className="director-empty-list rounded-2xl border border-dashed border-border p-5 text-center">
              <Inbox className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-navy-950">{hasActiveFilters ? 'No matching submissions' : 'Nothing is waiting for review'}</p>
              <p className="mt-1 text-xs leading-5 text-text-muted">{hasActiveFilters ? 'Try clearing a filter or adjusting your search.' : 'New submissions will appear here automatically.'}</p>
              {hasActiveFilters && <button onClick={clearFilters} className="mt-3 text-xs font-semibold text-primary hover:underline">Reset filters</button>}
            </div>
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
            <div className="flex min-h-[340px] flex-1 items-center justify-center p-6">
              <section className="director-empty-state max-w-md rounded-[22px] border border-border bg-white p-7 text-center shadow-sm sm:p-9">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary"><Inbox className="h-6 w-6" /></span>
                <h2 className="mt-5 text-xl font-bold text-navy-950">{hasActiveFilters ? 'No submissions match these filters' : 'Your review inbox is clear'}</h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">{hasActiveFilters ? 'Clear or adjust the filters to see submissions waiting for review.' : 'When a designer or editor submits work, it will appear here with its event, status and review tools.'}</p>
                {hasActiveFilters && <Button variant="outline" size="sm" onClick={clearFilters} className="mt-5"><FilterX className="mr-2 h-4 w-4"/> Clear filters</Button>}
              </section>
            </div>
          )}
        </div>
      </main>

      <PostApprovalDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} onSubmit={handleApproval} isSubmitting={actionPending} />
    </div>
  );
}
