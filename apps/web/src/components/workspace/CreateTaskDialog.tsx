"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCreateTask, useTasks, useUsers } from "../../api/queries";
import { Loader2, PlusCircle } from "lucide-react";
import { ApiError, api } from "../../api/api-client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context";

const WORK_TYPES = ["Flyer", "Banner", "Social Media Post", "Video", "Poster", "Story", "Other"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const ACTIVE_STATUSES = new Set([
  "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS", "REVISION_REQUESTED", "READY_FOR_REVIEW", "IN_REVIEW",
]);

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const { data: tasksResponse } = useTasks();
  const { data: usersResponse } = useUsers();
  const { profile } = useAuth();
  const { data: managedEvents = [] } = useQuery<any[]>({ queryKey: ['adminEvents'], queryFn: api.getAdminEvents, enabled: Boolean(profile?.roles?.includes('ADMIN')) });
  const createTask = useCreateTask();
  const eventOptions = useMemo(() => profile?.roles?.includes('ADMIN') ? managedEvents.map(event => event.name) : (profile?.events || []), [managedEvents, profile]);

  const designers = (usersResponse?.documents || []).filter(
    (u: any) => u.roles?.includes("DESIGNER") || u.roles?.includes("VIDEO_EDITOR")
  );

  const capacityByAssignee = (tasksResponse?.documents || []).reduce<Record<string, number>>((counts, task: any) => {
    if (task.currentAssigneeId && ACTIVE_STATUSES.has(task.status)) {
      counts[task.currentAssigneeId] = (counts[task.currentAssigneeId] || 0) + 1;
    }
    return counts;
  }, {});

  const [form, setForm] = useState({
    title: "",
    description: "",
    eventId: "",
    workType: WORK_TYPES[0],
    priority: "MEDIUM",
    currentAssigneeId: "",
    deadline: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (eventOptions.length && !eventOptions.includes(form.eventId)) setForm(previous => ({ ...previous, eventId: eventOptions[0] }));
  }, [eventOptions, form.eventId]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.eventId) { setError("Please select an event"); return; }
    if (!form.currentAssigneeId) { setError("Please select an assignee"); return; }
    if (!form.deadline) { setError("Deadline is required"); return; }

    try {
      await createTask.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        eventId: form.eventId,
        workType: form.workType,
        priority: form.priority as "LOW" | "MEDIUM" | "HIGH",
        currentAssigneeId: form.currentAssigneeId,
        deadline: new Date(form.deadline).toISOString(),
      });
      onOpenChange(false);
      setForm({ title: "", description: "", eventId: eventOptions[0] || "", workType: WORK_TYPES[0], priority: "MEDIUM", currentAssigneeId: "", deadline: "" });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "ASSIGNEE_CAPACITY_REACHED") {
        setError(`${err.message} Select another designer or complete an active task first.`);
      } else {
        setError(err instanceof Error ? err.message : "Failed to create task. Please try again.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="pr-2">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <PlusCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-navy-900">Create New Task</h2>
          </div>
          <p className="text-sm text-text-muted">Assign a new design or media task to a team member.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1">Task Title *</label>
            <Input
              value={form.title}
              onChange={e => handleChange("title", e.target.value)}
              placeholder="e.g. Opening Ceremony Banner"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => handleChange("description", e.target.value)}
              placeholder="Brief notes for the designer..."
              rows={3}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Row: Event + Work Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1">Event *</label>
              <select
                value={form.eventId}
                onChange={e => handleChange("eventId", e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {!eventOptions.length && <option value="">No assigned events</option>}
                {eventOptions.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1">Work Type *</label>
              <select
                value={form.workType}
                onChange={e => handleChange("workType", e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          {/* Row: Priority + Deadline */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1">Priority *</label>
              <select
                value={form.priority}
                onChange={e => handleChange("priority", e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1">Deadline *</label>
              <Input
                type="date"
                value={form.deadline}
                onChange={e => handleChange("deadline", e.target.value)}
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1">Assign To *</label>
            <select
              value={form.currentAssigneeId}
              onChange={e => handleChange("currentAssigneeId", e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select designer —</option>
              {designers.map((u: any) => (
                <option
                  key={u.authUserId}
                  value={u.authUserId}
                  disabled={(capacityByAssignee[u.authUserId] || 0) >= 3}
                >
                  {u.name} — {capacityByAssignee[u.authUserId] || 0}/3
                  {(capacityByAssignee[u.authUserId] || 0) >= 3 ? " (At capacity)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-muted">
              Capacity includes assigned, acknowledged, in-progress, revision, and review tasks across all events.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
