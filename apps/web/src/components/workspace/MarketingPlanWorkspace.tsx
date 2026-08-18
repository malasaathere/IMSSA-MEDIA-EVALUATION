"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useMarketingPlans } from "../../api/queries";
import { ArrowRight, CalendarDays, FileText, Loader2, Search, Sparkles, Upload } from "lucide-react";
import { EditPlanDialog } from "./EditPlanDialog";
import { ImportSheetsDialog } from "./ImportSheetsDialog";
import { useAuth } from "../../lib/auth-context";
import { canEditMarketingPlan, normalizeRoles } from "../../lib/access-control";

function getStatusVariant(status: string): any {
  const value = (status || "").toLowerCase();
  if (["approved", "completed", "posted"].includes(value)) return "success";
  if (value === "pending") return "warning";
  if (["on going", "ongoing", "assigned"].includes(value)) return "info";
  if (value === "on revision") return "danger";
  return "outline";
}

function isComplete(plan: any) {
  return [plan.designStatus, plan.captionStatus].some((status) => ["approved", "completed", "posted"].includes(String(status || "").toLowerCase()));
}

export const MarketingPlanWorkspace = () => {
  const { data: plansResponse, isLoading } = useMarketingPlans();
  const { profile } = useAuth();
  const plans = plansResponse?.documents || [];
  const campaigns = ["All", ...Array.from(new Set(plans.map((plan: any) => plan.campaign).filter(Boolean)))];
  const [selectedCampaign, setSelectedCampaign] = useState<string>("All");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiCaptions, setAiCaptions] = useState<Record<string, string>>({});
  const roles = normalizeRoles(profile?.roles || []);
  const authorizedEvents = profile?.events || [];
  const isMarketingCoordinator = roles.includes("MARKETING_COORDINATOR");

  const filteredPlans = useMemo(() => plans.filter((plan: any) => {
    const matchesCampaign = selectedCampaign === "All" || plan.campaign === selectedCampaign;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [plan.title, plan.description, plan.campaign, plan.platform]
      .some((value) => String(value || "").toLowerCase().includes(query));
    return matchesCampaign && matchesSearch;
  }), [plans, searchQuery, selectedCampaign]);

  const selectedPlan = filteredPlans.find((plan: any) => plan.$id === selectedPlanId) || filteredPlans[0] || null;
  const completedCount = filteredPlans.filter(isComplete).length;
  const progress = filteredPlans.length ? Math.round((completedCount / filteredPlans.length) * 100) : 0;

  const handleEdit = (plan: any) => { setEditPlan(plan); setEditOpen(true); };
  const handleGenerateCaption = async (plan: any) => {
    setAiLoading(plan.$id);
    try {
      const prompt = `Write a short, engaging social media caption for the following post. Keep it under 150 characters, suitable for ${plan.platform || "social media"}. Post title: "${plan.title}". Description: "${plan.description || plan.title}". Event: ${plan.campaign}. Add relevant emojis.`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const data = await response.json();
      const caption = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate caption.";
      setAiCaptions((current) => ({ ...current, [plan.$id]: caption.trim() }));
    } catch { setAiCaptions((current) => ({ ...current, [plan.$id]: "Failed to generate. Check your AI configuration." })); }
    finally { setAiLoading(null); }
  };

  return (
    <div className="plan-room">
      <header className="plan-room-header"><div><p className="plan-room-kicker">IMSSA MEDIA / CAMPAIGN OPERATIONS</p><h1>Marketing plan room</h1></div><div className="plan-room-actions"><label className="plan-search"><Search size={18} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Find a deliverable…" /></label><Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="mr-2 h-4 w-4" />Import plan</Button><Button>Add item <ArrowRight className="ml-2 h-4 w-4" /></Button></div></header>

      <section className="plan-progress-strip"><div className="plan-progress-label"><span><FileText size={18} /></span><div><strong>Campaign workspace</strong><small>{filteredPlans.length} deliverables in view</small></div></div><div className="plan-progress-meter"><div><span>{completedCount} of {filteredPlans.length} deliverables ready</span><strong>{progress}%</strong></div><i><b style={{ width: `${progress}%` }} /></i></div><div className="plan-campaign-tabs" aria-label="Campaign filters">{campaigns.map((campaign) => <button key={campaign} type="button" className={selectedCampaign === campaign ? "active" : ""} onClick={() => { setSelectedCampaign(campaign); setSelectedPlanId(null); }}>{campaign === "All" ? "All plans" : campaign}</button>)}</div></section>

      {isMarketingCoordinator && <p className="plan-scope-note">{authorizedEvents.length ? `Editing is limited to: ${authorizedEvents.join(", ")}.` : "No event is assigned to your account. Your marketing plans are view-only."}</p>}

      <main className="plan-room-main"><section className="plan-list-panel"><div className="plan-list-heading"><div><p>DELIVERABLE MAP</p><h2>Move the campaign forward</h2></div><small>{filteredPlans.length} items</small></div>{isLoading ? <div className="plan-list-loading"><Loader2 className="h-6 w-6 animate-spin" />Loading marketing plans…</div> : filteredPlans.length === 0 ? <div className="plan-list-empty"><FileText size={22} /><strong>No plans found</strong><span>Try another campaign or search phrase.</span></div> : <div className="plan-item-list">{filteredPlans.map((plan: any, index: number) => { const active = selectedPlan?.$id === plan.$id; return <button key={plan.$id} type="button" onClick={() => setSelectedPlanId(plan.$id)} className={`plan-list-item ${active ? "active" : ""}`}><span className="plan-item-number">{String(index + 1).padStart(2, "0")}</span><span className="plan-item-copy"><small>{plan.campaign || "GENERAL"} · {plan.platform || "MEDIA"}</small><strong>{plan.title || "Untitled deliverable"}</strong></span><Badge variant={getStatusVariant(plan.designStatus)}>{plan.designStatus || "Pending"}</Badge><ArrowRight className="plan-item-arrow" size={18} /></button>; })}</div>}</section>

        <aside className="plan-detail-panel">{selectedPlan ? (() => { const editable = canEditMarketingPlan(selectedPlan, roles, authorizedEvents); return <><div className="plan-detail-topline"><span>{String(filteredPlans.findIndex((plan: any) => plan.$id === selectedPlan.$id) + 1).padStart(2, "0")} / DELIVERABLE</span><Badge variant={getStatusVariant(selectedPlan.designStatus)}>{selectedPlan.designStatus || "Pending"}</Badge></div><h2>{selectedPlan.title || "Untitled deliverable"}</h2><p className="plan-detail-description">{selectedPlan.description || "Add a clear creative brief, caption direction and publishing details for this item."}</p><div className="plan-detail-facts"><div><CalendarDays size={17} /><span>Handover</span><strong>{selectedPlan.handoverDate || selectedPlan.dateToShare || "Not scheduled"}</strong></div><div><FileText size={17} /><span>Platform</span><strong>{selectedPlan.platform || "Not specified"}</strong></div></div><div className="plan-status-card"><p>WORK STATUS</p><div><span>Design <Badge variant={getStatusVariant(selectedPlan.designStatus)}>{selectedPlan.designStatus || "Pending"}</Badge></span><span>Caption <Badge variant={getStatusVariant(selectedPlan.captionStatus)}>{selectedPlan.captionStatus || "Pending"}</Badge></span></div></div>{aiCaptions[selectedPlan.$id] ? <div className="plan-ai-caption"><div><Sparkles size={16} /><strong>AI caption suggestion</strong></div><p>{aiCaptions[selectedPlan.$id]}</p><button onClick={() => setAiCaptions((current) => { const next = { ...current }; delete next[selectedPlan.$id]; return next; })}>Dismiss</button></div> : null}<div className="plan-detail-actions"><Button variant="outline" onClick={() => handleGenerateCaption(selectedPlan)} disabled={aiLoading === selectedPlan.$id}>{aiLoading === selectedPlan.$id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Generate caption</Button><Button onClick={() => editable && handleEdit(selectedPlan)} disabled={!editable}>{editable ? "Edit deliverable" : "View only"}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></>; })() : <div className="plan-detail-empty"><FileText size={28} /><h2>Select a deliverable</h2><p>Choose an item from the campaign map to view its brief, progress and next actions.</p></div>}</aside>
      </main>
      <EditPlanDialog plan={editPlan} open={editOpen} onOpenChange={setEditOpen} /><ImportSheetsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};
