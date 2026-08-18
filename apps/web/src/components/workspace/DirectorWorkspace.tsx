import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ArrowRight, Check, FileCheck2, FilterX, Inbox, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
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
  const actionedTasks = scopedTasks.filter(task => ['COMPLETED', 'POSTED'].includes(task.status)).length;
  const reviewProgress = scopedTasks.length ? Math.round((actionedTasks / scopedTasks.length) * 100) : 0;
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
    <div className="review-room flex min-h-full flex-col lg:min-h-[calc(100vh-82px)]">
      <header className="review-room-header">
        <div>
          <p>IMSSA MEDIA / REVIEW OPERATIONS</p>
          <h1>Review inbox</h1>
          <span>Review submissions, leave clear feedback and approve the final version.</span>
        </div>
        <label className="review-room-search"><Search className="h-4 w-4"/><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Find a submission..."/></label>
      </header>

      <section className="review-room-summary">
        <div className="review-room-status"><span className="review-room-status-dot"/><div><strong>Review workspace</strong><small>{inboxTasks.length} submission{inboxTasks.length === 1 ? '' : 's'} waiting</small></div></div>
        <div className="review-room-progress"><div><span>{actionedTasks} of {scopedTasks.length} tasks approved or posted</span><strong>{reviewProgress}%</strong></div><i><b style={{ width: `${reviewProgress}%` }}/></i></div>
        <div className="review-room-filters"><select aria-label="Filter by event" value={eventFilter} onChange={event => setEventFilter(event.target.value)}><option value="ALL">All events</option>{eventOptions.map(event => <option key={event} value={event}>{event}</option>)}</select><select aria-label="Filter by review status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="IN_REVIEW">In review</option></select><select aria-label="Filter by work type" value={workTypeFilter} onChange={event => setWorkTypeFilter(event.target.value)}><option value="ALL">All work types</option>{workTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}</select>{hasActiveFilters && <button onClick={clearFilters} title="Clear filters"><FilterX className="h-4 w-4"/><span>Clear</span></button>}</div>
      </section>

      <main className="review-room-main">
        <aside className="review-room-map">
          <div className="review-room-map-heading"><div><p>REVIEW MAP</p><h2>Pending decisions</h2></div><span>{inboxTasks.length} OPEN</span></div>
          <div className="review-room-list">
            {inboxTasks.map((task, index) => (
              <button key={task.$id} onClick={() => setSelectedTaskId(task.$id)} className={`review-room-task ${selectedTask?.$id === task.$id ? 'is-selected' : ''}`}>
                <span className="review-room-task-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="review-room-task-copy"><small>{task.eventName || task.eventId || 'GENERAL'} · {task.workType || 'TASK'}</small><strong>{task.title}</strong></span>
                <Badge variant="warning">{task.status === 'IN_REVIEW' ? 'IN REVIEW' : 'PENDING'}</Badge><ArrowRight className="review-room-task-arrow h-4 w-4"/>
              </button>
            ))}
            {inboxTasks.length === 0 && <div className="review-room-empty-list"><Inbox className="h-5 w-5"/><strong>{hasActiveFilters ? 'No matching submissions' : 'Your inbox is clear'}</strong><p>{hasActiveFilters ? 'Adjust or clear filters to see submissions.' : 'New submissions will appear here automatically.'}</p>{hasActiveFilters && <button onClick={clearFilters}>Reset filters</button>}</div>}
          </div>
        </aside>

        <section className="review-room-detail">
          {selectedTask ? (
            <>
              <div className="review-room-detail-heading"><div><p>{selectedTask.eventName || selectedTask.eventId || 'GENERAL'} / {selectedTask.workType || 'SUBMISSION'}</p><h2>{selectedTask.title}</h2><span>{selectedTask.description || 'Open the submitted version, annotate feedback, and approve when it is ready.'}</span></div><Badge variant="warning">{selectedTask.status === 'IN_REVIEW' ? 'IN REVIEW' : 'PENDING'}</Badge></div>

              {actionMessage && <div className="review-room-message" role="status">{actionMessage}</div>}

              <div className="review-room-canvas">
                {latestVersion && latestVersion.fileId ? (
                  <ReviewCanvas imageUrl={api.getFileView(BUCKETS.DRAFT_IMAGES, latestVersion.fileId)} />
                ) : (
                  <div className="review-room-no-draft"><FileCheck2 className="h-7 w-7"/><strong>No draft submitted yet</strong><p>The creator’s submitted version will appear here for annotation and review.</p></div>
                )}
              </div>

              <div className="review-room-actions"><p>Use the pin or rectangle tools to annotate the submitted design before making a decision.</p><div>
                  <Button variant="destructive" onClick={handleRevision} disabled={!latestVersion || actionPending}><X className="mr-2 h-4 w-4" /> Request Revision</Button>
                  <Button className="bg-success hover:bg-success/90" onClick={() => setFeedbackOpen(true)} disabled={!latestVersion || !profile || actionPending}>
                    <Check className="mr-2 h-4 w-4" /> Approve Version
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="review-room-empty-detail"><Inbox className="h-8 w-8"/><p>SELECT A SUBMISSION</p><h2>{hasActiveFilters ? 'No tasks match these filters' : 'Nothing is waiting for review'}</h2><span>{hasActiveFilters ? 'Clear your filters to return to the review queue.' : 'Submitted work will show up here with everything needed to review it.'}</span>{hasActiveFilters && <Button variant="outline" size="sm" onClick={clearFilters}><FilterX className="mr-2 h-4 w-4"/>Clear filters</Button>}</div>
          )}
        </section>
      </main>

      <PostApprovalDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} onSubmit={handleApproval} isSubmitting={actionPending} />
    </div>
  );
}
