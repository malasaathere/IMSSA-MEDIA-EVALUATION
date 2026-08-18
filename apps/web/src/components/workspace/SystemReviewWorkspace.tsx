"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Loader2, ShieldCheck, Star, TriangleAlert } from "lucide-react";
import { ExecutionMethod } from "appwrite";
import { functions } from "../../lib/appwrite";
import { useAuth } from "../../lib/auth-context";
import { normalizeRoles } from "../../lib/access-control";
import { Button } from "../ui/button";

const FEATURES = [
  ["Authentication & roles", "Passkey login, access rules and profile identity"],
  ["Dashboard", "Work overview, deadlines and event visibility"],
  ["Marketing plan", "Plan items, editing rules and status updates"],
  ["Google Sheets sync", "System-sheet synchronization and freshness"],
  ["Designer uploads", "Files, submissions and revision handover"],
  ["Review inbox", "Annotations, revision requests and approvals"],
  ["Calendar", "Campaign and task schedule visibility"],
  ["Analytics", "Event progress, workload and reporting"],
  ["Administration", "Users, roles, events and assignments"],
  ["AI assistant", "Workspace answers and task guidance"],
  ["Team chat", "Messages and collaboration"],
  ["Theme & mobile experience", "Light/dark mode and small-screen usability"],
] as const;

type Review = { $id: string; reporterName: string; feature: string; rating: number; severity: string; comment: string; $createdAt: string };

export function SystemReviewWorkspace() {
  const { profile } = useAuth();
  const isAdmin = normalizeRoles(profile?.roles || []).includes("ADMIN");
  const [feature, setFeature] = useState<(typeof FEATURES)[number][0]>(FEATURES[0][0]);
  const [rating, setRating] = useState(4);
  const [severity, setSeverity] = useState("Suggestion");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const run = async (body: Record<string, unknown>) => {
    const execution = await functions.createExecution({ functionId: "api-system-feedback", body: JSON.stringify(body), async: false, xpath: "/system-feedback", method: ExecutionMethod.POST, headers: { "content-type": "application/json" } });
    let payload: any = {};
    try { payload = JSON.parse(execution.responseBody || "{}"); } catch { /* handled below */ }
    if (execution.responseStatusCode >= 400 || !payload.success) throw new Error(payload.error || "The system review service is not available yet.");
    return payload;
  };

  const loadReviews = async () => {
    if (!isAdmin) return;
    setLoadingReviews(true);
    try { const payload = await run({ action: "LIST" }); setReviews(payload.feedback || []); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not load reviews."); }
    finally { setLoadingReviews(false); }
  };

  useEffect(() => { void loadReviews(); }, [isAdmin]);

  const summary = useMemo(() => ({
    total: reviews.length,
    blockers: reviews.filter((review) => review.severity === "Blocker").length,
    average: reviews.length ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1) : "—",
  }), [reviews]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      await run({ action: "SUBMIT", feature, rating, severity, comment });
      setComment("");
      setMessage("Thank you — your review has been saved for the IMSSA team.");
      await loadReviews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save your review.");
    } finally { setSaving(false); }
  };

  return <div className="space-y-6 p-4 sm:p-6">
    <header className="page-heading"><div><p>PLATFORM QUALITY REVIEW</p><h1>Review this system</h1><span>Rate the features you use, report broken behaviour, and tell the team what should improve.</span></div></header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {FEATURES.map(([name, description]) => <button key={name} type="button" onClick={() => setFeature(name)} className={`rounded-2xl border p-4 text-left transition ${feature === name ? "border-primary bg-primary-soft shadow-sm" : "border-border bg-white hover:border-primary/50"}`}><ClipboardCheck className="mb-3 h-5 w-5 text-primary"/><strong className="block text-sm text-navy-950">{name}</strong><span className="mt-1 block text-xs leading-5 text-text-muted">{description}</span></button>)}
    </section>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
      <form onSubmit={submit} className="rounded-[22px] border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><ShieldCheck className="h-5 w-5"/></span><div><h2 className="text-lg font-bold text-navy-950">Submit a feature review</h2><p className="mt-1 text-sm text-text-muted">Choose one area at a time so the feedback is easy to action.</p></div></div>
        <div className="mt-6 grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-navy-800">Feature<select value={feature} onChange={(event) => setFeature(event.target.value as typeof feature)} className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-normal text-navy-950">{FEATURES.map(([name]) => <option key={name}>{name}</option>)}</select></label>
          <fieldset><legend className="text-sm font-semibold text-navy-800">How well does it work?</legend><div className="mt-2 flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} out of 5`} aria-pressed={rating === value} className={`grid h-10 w-10 place-items-center rounded-xl border ${rating === value ? "border-primary bg-primary text-white" : "border-border bg-white text-text-muted hover:border-primary"}`}><Star className="h-4 w-4 fill-current"/></button>)}</div><p className="mt-2 text-xs text-text-muted">{rating}/5 — 1 means broken; 5 means working very well.</p></fieldset>
          <label className="grid gap-2 text-sm font-semibold text-navy-800">Review type<select value={severity} onChange={(event) => setSeverity(event.target.value)} className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-normal text-navy-950"><option>Blocker</option><option>Problem</option><option>Suggestion</option><option>Working well</option></select></label>
          <label className="grid gap-2 text-sm font-semibold text-navy-800">What happened?<textarea required minLength={8} maxLength={3000} value={comment} onChange={(event) => setComment(event.target.value)} rows={6} placeholder="Describe what you tried, what you expected, and what happened instead." className="rounded-xl border border-border bg-surface p-3 text-sm font-normal text-navy-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"/></label>
          {message && <p role="status" className={`rounded-xl p-3 text-sm ${message.startsWith("Thank") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message}</p>}
          <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Submit review</Button></div>
        </div>
      </form>

      <aside className="rounded-[22px] border border-border bg-surface p-5 sm:p-6"><h2 className="text-lg font-bold text-navy-950">Review guide</h2><div className="mt-5 space-y-4 text-sm text-text-muted"><p><strong className="text-navy-900">Blocker</strong> — prevents your work from continuing.</p><p><strong className="text-navy-900">Problem</strong> — works incorrectly or creates confusion.</p><p><strong className="text-navy-900">Suggestion</strong> — an improvement that would make the system easier to use.</p><p><strong className="text-navy-900">Working well</strong> — useful feedback on what the team should preserve.</p></div>{isAdmin && <div className="mt-7 border-t border-border pt-5"><h3 className="font-bold text-navy-950">Admin overview</h3><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white p-3 text-center"><strong className="block text-xl text-navy-950">{loadingReviews ? "…" : summary.total}</strong><span className="text-[10px] font-semibold uppercase text-text-muted">Reports</span></div><div className="rounded-xl bg-white p-3 text-center"><strong className="block text-xl text-danger">{loadingReviews ? "…" : summary.blockers}</strong><span className="text-[10px] font-semibold uppercase text-text-muted">Blockers</span></div><div className="rounded-xl bg-white p-3 text-center"><strong className="block text-xl text-primary">{loadingReviews ? "…" : summary.average}</strong><span className="text-[10px] font-semibold uppercase text-text-muted">Average</span></div></div><Button variant="outline" size="sm" onClick={() => void loadReviews()} className="mt-4 w-full">Refresh reports</Button>{reviews.slice(0, 4).map((review) => <article key={review.$id} className="mt-3 rounded-xl border border-border bg-white p-3"><div className="flex items-center justify-between gap-2"><strong className="text-xs text-navy-950">{review.feature}</strong><span className="inline-flex items-center gap-1 text-xs text-amber-700"><Star className="h-3 w-3 fill-current"/>{review.rating}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-text-muted">{review.comment}</p><small className="mt-2 block text-[10px] text-text-muted">{review.reporterName} · {review.severity}</small></article>)}</div>} {!isAdmin && <div className="mt-7 flex gap-3 rounded-xl border border-primary/20 bg-primary-soft p-3 text-xs leading-5 text-primary"><CheckCircle2 className="h-5 w-5 shrink-0"/>Your review is shared with the platform administrators.</div>}</aside>
    </div>
  </div>;
}
