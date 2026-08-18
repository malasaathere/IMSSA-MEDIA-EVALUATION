"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, ClipboardCheck, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";

type Result = "pending" | "passed" | "needs-fix";

const CHECKS = [
  { feature: "Login & account", checks: ["Sign out, then sign in with a valid passkey.", "Confirm the profile name and role match the account you selected.", "Try an invalid passkey and confirm a clear error appears."] },
  { feature: "Role permissions", checks: ["Open the correct workspace for your role.", "Confirm restricted pages show Access unavailable instead of loading data.", "For an admin, confirm Administration and Analytics are available."] },
  { feature: "Dashboard", checks: ["Confirm the welcome text shows the correct user name.", "Check tasks, dates and status badges are readable.", "Resize to mobile width and check that no cards overlap."] },
  { feature: "Marketing Plan", checks: ["Filter by each campaign and confirm only matching rows appear.", "Open an item you are assigned to and save one safe status update.", "Check that a non-assigned Marketing Coordinator sees View only."] },
  { feature: "Google Sheets sync", checks: ["Check the displayed marketing plan data is current.", "Update one safe system-owned sheet item, then check whether it reaches the plan.", "Record any delay or sync error as Needs Fix."] },
  { feature: "Designer uploads", checks: ["Open My Work and view an assigned task.", "Upload a small test draft and confirm it appears as a version.", "Confirm the task can be submitted for review."] },
  { feature: "Review Inbox", checks: ["Open a submitted draft as a Media Director.", "Try pin/rectangle annotations and confirm they stay visible.", "Request a revision or approve a safe test version and confirm the status changes."] },
  { feature: "Calendar & Analytics", checks: ["Switch calendar views and check marketing-plan dates appear.", "Open Analytics for an authorized event.", "Confirm restricted event data is not visible to other roles."] },
  { feature: "Administration", checks: ["As admin, open the user and event lists.", "Open an assignment editor and verify roles/events are shown correctly.", "Test only with a safe user/event before creating or deleting data."] },
  { feature: "AI Assistant & chat", checks: ["Ask the assistant about your assigned work.", "Confirm it only summarizes permitted event data.", "Send a test chat message and confirm it appears correctly."] },
  { feature: "Theme & mobile", checks: ["Switch between light and dark mode.", "Check text, status labels and buttons have enough contrast.", "Use a narrow phone viewport and confirm navigation is usable."] },
] as const;

export function SystemReviewWorkspace() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [selectedFeature, setSelectedFeature] = useState<string>(CHECKS[0].feature);
  useEffect(() => { try { setResults(JSON.parse(localStorage.getItem("imssa-system-checklist") || "{}")); } catch { /* start clean */ } }, []);
  const setResult = (feature: string, result: Result) => setResults((current) => { const next = { ...current, [feature]: result }; localStorage.setItem("imssa-system-checklist", JSON.stringify(next)); return next; });
  const summary = useMemo(() => { const values = Object.values(results); return { passed: values.filter((item) => item === "passed").length, needsFix: values.filter((item) => item === "needs-fix").length, completed: values.filter((item) => item !== "pending").length, total: CHECKS.length }; }, [results]);
  const active = CHECKS.find((item) => item.feature === selectedFeature) || CHECKS[0];
  const current = results[active.feature] || "pending";

  return <div className="space-y-6 p-4 sm:p-6">
    <header className="page-heading"><div><p>PLATFORM QUALITY CHECK</p><h1>Test this site</h1><span>Follow each test step, then mark the feature as passed or needing a fix. Your checklist is saved only in this browser.</span></div></header>
    <section className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-white p-4"><span className="text-xs font-bold uppercase tracking-wider text-text-muted">Checked</span><strong className="mt-2 block text-3xl text-navy-950">{summary.completed}/{summary.total}</strong></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Passed</span><strong className="mt-2 block text-3xl text-emerald-700">{summary.passed}</strong></div><div className="rounded-2xl border border-red-100 bg-red-50 p-4"><span className="text-xs font-bold uppercase tracking-wider text-red-700">Needs Fix</span><strong className="mt-2 block text-3xl text-red-700">{summary.needsFix}</strong></div></section>
    <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="rounded-[22px] border border-border bg-white p-3"><p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[.14em] text-text-muted">Test areas</p>{CHECKS.map((item) => { const result = results[item.feature] || "pending"; return <button key={item.feature} onClick={() => setSelectedFeature(item.feature)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${selectedFeature === item.feature ? "bg-primary-soft text-primary" : "text-navy-800 hover:bg-surface"}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${result === "passed" ? "bg-emerald-500 text-white" : result === "needs-fix" ? "bg-red-500 text-white" : "bg-surface text-text-muted"}`}>{result === "passed" ? <CheckCircle2 className="h-4 w-4"/> : result === "needs-fix" ? <AlertTriangle className="h-4 w-4"/> : <Circle className="h-3 w-3"/>}</span><span className="min-w-0"><strong className="block text-sm">{item.feature}</strong><small className="block text-[11px] text-text-muted">{result === "passed" ? "Passed" : result === "needs-fix" ? "Needs fix" : "Not tested"}</small></span></button>; })}</aside>
      <section className="rounded-[22px] border border-border bg-white p-5 shadow-sm sm:p-7"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><ClipboardCheck className="h-5 w-5"/></span><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">Current test</p><h2 className="mt-1 text-2xl font-bold text-navy-950">{active.feature}</h2></div></div><ol className="mt-7 space-y-3">{active.checks.map((check, index) => <li key={check} className="flex gap-4 rounded-xl border border-border bg-surface p-4"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-primary">{index + 1}</span><p className="pt-0.5 text-sm leading-6 text-navy-800">{check}</p></li>)}</ol><div className="mt-7 border-t border-border pt-5"><p className="text-sm font-semibold text-navy-950">Result for this feature</p><div className="mt-3 flex flex-wrap gap-3"><Button onClick={() => setResult(active.feature, "passed")} className={current === "passed" ? "bg-emerald-600 hover:bg-emerald-600" : "bg-success hover:bg-success/90"}><CheckCircle2 className="mr-2 h-4 w-4"/>Pass</Button><Button variant="destructive" onClick={() => setResult(active.feature, "needs-fix")}><AlertTriangle className="mr-2 h-4 w-4"/>Needs Fix</Button><Button variant="outline" onClick={() => setResult(active.feature, "pending")}><Circle className="mr-2 h-4 w-4"/>Not tested</Button></div></div></section>
    </div>
    <div className="flex justify-end"><Button variant="outline" onClick={() => { localStorage.removeItem("imssa-system-checklist"); setResults({}); }}><RotateCcw className="mr-2 h-4 w-4"/>Reset my checklist</Button></div>
  </div>;
}
