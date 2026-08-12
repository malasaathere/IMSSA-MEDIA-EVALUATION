"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { api } from "../../api/api-client";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";

const ROLE_OPTIONS = [
  ["ADMIN", "Administrator"],
  ["CHIEF_COORDINATOR", "Chief Coordinator"],
  ["MARKETING_COORDINATOR", "Marketing Coordinator"],
  ["DESIGNER", "Designer"],
  ["VIDEO_EDITOR", "Video Editor"],
  ["MEDIA_DIRECTOR", "Media Director"],
  ["CONTENT_WRITER", "Content Writer"],
] as const;

export function AddUserDialog({ eventOptions = [], onCreated }: { eventOptions?: string[]; onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [roles, setRoles] = useState<string[]>(["DESIGNER"]);
  const [events, setEvents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ passkey: string; name: string; roles: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (value: string, values: string[], setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2 || roles.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await api.createUser({ name: name.trim(), roles, events });
      setResult({ passkey: response.passkey, name: response.user.name, roles: response.user.roles });
      onCreated?.();
    } catch (exception: any) {
      setError(exception?.message || "Could not create this user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const close = () => {
    setOpen(false);
    setName("");
    setRoles(["DESIGNER"]);
    setEvents([]);
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Add user</Button>
      <Dialog open={open} onOpenChange={(next) => next ? setOpen(true) : close()}>
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <h2 className="text-xl font-bold text-navy-950">Add new user</h2>
          <p className="mt-1 text-sm text-text-muted">Create their passkey account, positions and event access together.</p>

          {result ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-green-100"><CheckCircle2 className="h-6 w-6 text-green-700" /></span>
              <h3 className="mt-4 text-lg font-bold text-navy-950">{result.name} was added</h3>
              <p className="mt-1 text-sm text-text-muted">Their assigned positions are ready immediately.</p>
              <div className="mt-5 w-full rounded-2xl border border-border bg-surface p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Login passkey</p>
                <p className="mt-2 font-mono text-4xl font-extrabold tracking-[0.25em] text-navy-950">{result.passkey}</p>
              </div>
              <p className="mt-3 text-xs text-text-muted">Share this passkey securely. It is only shown here after creation.</p>
              <Button onClick={close} className="mt-6 w-full">Done</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <label className="block text-sm font-semibold text-navy-950">Display name
                <Input value={name} onChange={event => setName(event.target.value)} maxLength={100} placeholder="e.g. Kasun Perera" className="mt-2" required />
              </label>

              <section><h3 className="text-sm font-bold text-navy-900">Positions</h3><p className="mb-3 mt-1 text-xs text-text-muted">Select every position this person performs.</p>
                <div className="grid gap-2 sm:grid-cols-2">{ROLE_OPTIONS.map(([value, label]) => <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold ${roles.includes(value) ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-navy-700"}`}><input type="checkbox" checked={roles.includes(value)} onChange={() => toggle(value, roles, setRoles)} className="h-4 w-4" />{label}</label>)}</div>
              </section>

              <section><h3 className="text-sm font-bold text-navy-900">Events they work on</h3><p className="mb-3 mt-1 text-xs text-text-muted">Optional event scope for marketing-plan editing and analytics.</p>
                <div className="grid gap-2 sm:grid-cols-2">{eventOptions.map(event => <label key={event} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold ${events.includes(event) ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-navy-700"}`}><input type="checkbox" checked={events.includes(event)} onChange={() => toggle(event, events, setEvents)} className="h-4 w-4" />{event}</label>)}</div>
                {!eventOptions.length && <p className="rounded-xl bg-surface p-3 text-sm text-text-muted">No marketing-plan events are available yet.</p>}
              </section>

              {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button type="submit" disabled={isSubmitting || name.trim().length < 2 || roles.length === 0}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create user</Button></div>
            </form>
          )}
        </div>
      </Dialog>
    </>
  );
}
