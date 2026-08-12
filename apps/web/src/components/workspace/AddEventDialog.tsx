"use client";

import { useState } from "react";
import { CalendarPlus, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "../../api/api-client";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";

export function AddEventDialog({ users, onCreated }: { users: any[]; onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [coordinatorAssignments, setCoordinatorAssignments] = useState<Record<string, string>>({});
  const [newCoordinatorName, setNewCoordinatorName] = useState("");
  const [newCoordinatorRole, setNewCoordinatorRole] = useState<'CHIEF_COORDINATOR' | 'MARKETING_COORDINATOR'>('CHIEF_COORDINATOR');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const reset = () => { setName(""); setDescription(""); setStartsAt(""); setEndsAt(""); setCoordinatorAssignments({}); setNewCoordinatorName(""); setNewCoordinatorRole('CHIEF_COORDINATOR'); setError(""); setResult(null); };
  const close = () => { setOpen(false); reset(); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) return;
    setSaving(true); setError("");
    try {
      const assignments = Object.entries(coordinatorAssignments).filter(([, role]) => role).map(([userId, role]) => ({ userId, role: role as 'CHIEF_COORDINATOR' | 'MARKETING_COORDINATOR' }));
      const response = await api.createEvent({ name: name.trim(), description: description.trim(), startsAt, endsAt, coordinatorAssignments: assignments, newCoordinatorName: newCoordinatorName.trim(), newCoordinatorRole });
      setResult(response);
      onCreated?.();
    } catch (exception: any) {
      setError(exception?.message || "Could not create this event.");
    } finally { setSaving(false); }
  };

  return <>
    <Button variant="outline" onClick={() => setOpen(true)}><CalendarPlus className="mr-2 h-4 w-4" />Add event</Button>
    <Dialog open={open} onOpenChange={next => next ? setOpen(true) : close()}>
      <div className="max-h-[80vh] overflow-y-auto pr-2">
        <h2 className="text-xl font-bold text-navy-950">Add new event</h2>
        <p className="mt-1 text-sm text-text-muted">Create the event and choose its Chief Coordinators.</p>
        {result ? <div className="flex flex-col items-center py-7 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-green-100"><CheckCircle2 className="h-6 w-6 text-green-700" /></span>
          <h3 className="mt-4 text-lg font-bold text-navy-950">{result.event.name} was created</h3>
          <p className="mt-1 text-sm text-text-muted">Assigned coordinators can now view analytics for this event.</p>
          {result.newCoordinator && <div className="mt-5 w-full rounded-2xl border border-border bg-surface p-5"><p className="text-sm font-semibold text-navy-950">New coordinator: {result.newCoordinator.name}</p><p className="mt-3 text-xs font-bold uppercase tracking-wider text-text-muted">Login passkey</p><p className="mt-2 font-mono text-4xl font-extrabold tracking-[0.25em] text-navy-950">{result.newCoordinator.passkey}</p><p className="mt-2 text-xs text-text-muted">Share this passkey securely.</p></div>}
          <Button className="mt-6 w-full" onClick={close}>Done</Button>
        </div> : <form onSubmit={submit} className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-navy-950 sm:col-span-2">Event name<Input className="mt-2" value={name} onChange={e => setName(e.target.value)} maxLength={120} placeholder="e.g. HackX 12.0" required /></label><label className="text-sm font-semibold text-navy-950">Start date<Input className="mt-2" type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} /></label><label className="text-sm font-semibold text-navy-950">End date<Input className="mt-2" type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} /></label></div>
          <label className="block text-sm font-semibold text-navy-950">Description<textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} rows={3} placeholder="Optional event details" className="mt-2 block w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-navy-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft" /></label>
          <section><h3 className="text-sm font-bold text-navy-900">Assign existing coordinators</h3><p className="mb-3 mt-1 text-xs text-text-muted">Chief Coordinators receive analytics access. Marketing Coordinators receive marketing-plan editing access.</p><div className="grid gap-2 sm:grid-cols-2">{users.filter(user => user.status !== 'INACTIVE').map(user => <label key={user.$id} className={`rounded-xl border p-3 text-sm font-semibold ${coordinatorAssignments[user.$id] ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-navy-700"}`}><span className="block truncate">{user.name}</span><span className="mb-2 block truncate text-[10px] font-normal text-text-muted">{(user.roles || []).join(' · ')}</span><select aria-label={`Event role for ${user.name}`} value={coordinatorAssignments[user.$id] || ''} onChange={event => setCoordinatorAssignments(current => ({ ...current, [user.$id]: event.target.value }))} className="min-h-9 w-full rounded-lg border border-border bg-white px-2 text-xs text-navy-800"><option value="">Not assigned</option><option value="CHIEF_COORDINATOR">Chief Coordinator</option><option value="MARKETING_COORDINATOR">Marketing Coordinator</option></select></label>)}</div></section>
          <section className="rounded-2xl border border-border bg-surface p-4"><h3 className="text-sm font-bold text-navy-900">Or create a new coordinator</h3><p className="mb-3 mt-1 text-xs text-text-muted">Optional. A new four-digit passkey will be generated and assigned to this event.</p><div className="grid gap-3 sm:grid-cols-2"><Input value={newCoordinatorName} onChange={e => setNewCoordinatorName(e.target.value)} maxLength={100} placeholder="New coordinator name" /><select aria-label="New coordinator position" value={newCoordinatorRole} onChange={event => setNewCoordinatorRole(event.target.value as 'CHIEF_COORDINATOR' | 'MARKETING_COORDINATOR')} className="min-h-10 rounded-xl border border-border bg-white px-3 text-sm text-navy-800"><option value="CHIEF_COORDINATOR">Chief Coordinator</option><option value="MARKETING_COORDINATOR">Marketing Coordinator</option></select></div></section>
          {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button type="submit" disabled={saving || name.trim().length < 2}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create event</Button></div>
        </form>}
      </div>
    </Dialog>
  </>;
}
