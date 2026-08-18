"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, Trash2, X } from "lucide-react";
import { ExecutionMethod } from "appwrite";
import { functions } from "../../lib/appwrite";
import { useAuth } from "../../lib/auth-context";
import { normalizeRoles, primaryRoleLabel } from "../../lib/access-control";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string; mode?: string };

function promptsFor(roles: string[]) {
  const normalized = normalizeRoles(roles);
  if (normalized.includes("ADMIN")) return ["Summarize the whole workspace", "Show overdue work", "Summarize user assignments"];
  if (normalized.includes("CHIEF_COORDINATOR")) return ["Summarize my event analytics", "What is overdue?", "What needs attention this week?"];
  if (normalized.includes("MARKETING_COORDINATOR")) return ["What needs attention this week?", "Which posts are not ready?", "Show overdue work"];
  if (normalized.includes("MEDIA_DIRECTOR")) return ["What is waiting for review?", "Show high-priority work", "What is due this week?"];
  if (normalized.includes("DESIGNER") || normalized.includes("VIDEO_EDITOR")) return ["What should I work on next?", "Show my overdue work", "What is due this week?"];
  return ["What should I work on next?", "Which captions are not ready?", "What is due this week?"];
}

export function AIAssistantWidget() {
  const { user, profile, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const prompts = useMemo(() => promptsFor(profile?.roles || []), [profile?.roles]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, sending]);

  const ask = async (question: string) => {
    const message = question.trim();
    if (!message || sending) return;
    const previous = messages.slice(-8);
    setMessages((current) => [...current, { id: `${Date.now()}-user`, role: "user", content: message }]);
    setInput("");
    setSending(true);
    try {
      const execution = await functions.createExecution({
        functionId: "api-ai-assistant",
        body: JSON.stringify({ message, history: previous.map(({ role, content }) => ({ role, content })) }),
        async: false,
        xpath: "/assistant",
        method: ExecutionMethod.POST,
        headers: { "content-type": "application/json" },
      });
      let payload: { success?: boolean; reply?: string; error?: string; mode?: string } = {};
      try { payload = JSON.parse(execution.responseBody || "{}"); } catch { /* handled below */ }
      if (execution.responseStatusCode >= 400 || !payload.success || !payload.reply) {
        throw new Error(payload.error || "The assistant is not available yet.");
      }
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: "assistant", content: payload.reply!, mode: payload.mode }]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "The assistant is unavailable.";
      const deploymentHint = /not found|404|available yet/i.test(detail)
        ? "The assistant service still needs to be deployed in Appwrite."
        : detail;
      setMessages((current) => [...current, { id: `${Date.now()}-error`, role: "assistant", content: `${deploymentHint} Please try again shortly.` }]);
    } finally {
      setSending(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(input);
  };

  if (isLoading || !user || !profile) return null;

  return (
    <div className="fixed bottom-[94px] right-[4.25rem] z-[60] flex flex-col items-end sm:bottom-12 sm:right-24">
      {open && (
        <section
          aria-label="IMSSA AI Assistant"
          className="mb-4 flex h-[min(620px,calc(100vh-125px))] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between bg-navy-950 px-4 py-3.5 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary"><Sparkles className="h-5 w-5" /></span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">IMSSA Assistant</h2>
                <p className="truncate text-[11px] text-slate-300">Personalized for {primaryRoleLabel(profile.roles)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!!messages.length && (
                <button aria-label="Clear assistant conversation" onClick={() => setMessages([])} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"><Trash2 className="h-4 w-4" /></button>
              )}
              <button aria-label="Close assistant" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-50 px-3.5 py-4">
            {!messages.length && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-navy-950"><Bot className="h-5 w-5 text-primary" /><p className="font-semibold">Hello, {profile.name}</p></div>
                  <p className="text-sm leading-6 text-slate-600">I can help you understand your tasks, deadlines, marketing status and priorities using only the workspace information you are allowed to access.</p>
                </div>
                <div>
                  <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Try asking</p>
                  <div className="grid gap-2">
                    {prompts.map((prompt) => (
                      <button key={prompt} onClick={() => void ask(prompt)} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-primary hover:text-primary">{prompt}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-5 shadow-sm ${message.role === "user" ? "rounded-br-md bg-primary text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-700"}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {sending && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-500 shadow-sm"><Loader2 className="h-4 w-4 animate-spin text-primary" />Checking your workspace…</div></div>}
              <div ref={endRef} />
            </div>
          </div>

          <form onSubmit={submit} className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void ask(input); }
                }}
                placeholder="Ask about your work…"
                rows={1}
                maxLength={1200}
                disabled={sending}
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-navy-950 outline-none placeholder:text-slate-400"
              />
              <button type="submit" aria-label="Send to assistant" disabled={sending || !input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400">Read-only · Uses only your permitted workspace data</p>
          </form>
        </section>
      )}

      <button
        aria-label={open ? "Close IMSSA Assistant" : "Open IMSSA Assistant"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-12 w-12 place-items-center rounded-full bg-navy-950 text-white shadow-xl transition hover:scale-105 hover:bg-navy-900 active:scale-95 sm:h-14 sm:w-14"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        {!open && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary" />}
      </button>
    </div>
  );
}
