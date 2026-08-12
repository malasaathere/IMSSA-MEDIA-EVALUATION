"use client";

import { useState, useEffect } from "react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useUpdateMarketingPlan } from "../../api/queries";
import { Loader2, Edit2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { canEditMarketingPlan } from "../../lib/access-control";

const PLATFORMS = [
  "Facebook, LinkedIn, Instagram",
  "Facebook, YouTube",
  "Facebook, YouTube, TikTok",
  "Instagram",
  "LinkedIn",
  "YouTube",
  "TikTok",
  "All Platforms",
];
const STATUSES = ["Pending", "On going", "assigned", "On revision", "Completed", "Approved", "No caption", "Posted", "Overdue", "Cancelled"];

interface EditPlanDialogProps {
  plan: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlanDialog({ plan, open, onOpenChange }: EditPlanDialogProps) {
  const updatePlan = useUpdateMarketingPlan();
  const { profile } = useAuth();
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const canEdit = canEditMarketingPlan(plan, profile?.roles || [], profile?.events || []);

  useEffect(() => {
    if (plan) {
      setForm({
        title: plan.title || "",
        description: plan.description || "",
        platform: plan.platform || "",
        handoverDate: plan.handoverDate || "",
        finishedBefore: plan.finishedBefore || "",
        dateToShare: plan.dateToShare || "",
        dateShared: plan.dateShared || "",
        designer: plan.designer || "",
        designStatus: plan.designStatus || "Pending",
        contentWriter: plan.contentWriter || "",
        captionStatus: plan.captionStatus || "Pending",
        finalStatus: plan.finalStatus || "",
        handoverStatus: plan.handoverStatus || "",
        type: plan.type || "",
      });
    }
  }, [plan]);

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => {
      if (value.trim().toLowerCase() === "posted") {
        return { ...prev, [field]: value, finalStatus: "Posted", designStatus: "Posted", captionStatus: "Posted" };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!plan?.$id) return;
    if (!canEdit) {
      setError("You can only edit marketing plans for events assigned to your account.");
      return;
    }
    try {
      const isPosted = [form.finalStatus]
        .some((value) => typeof value === "string" && value.trim().toLowerCase() === "posted");
      const data = isPosted
        ? { ...form, finalStatus: "Posted", designStatus: "Posted", captionStatus: "Posted" }
        : form;
      await updatePlan.mutateAsync({ id: plan.$id, data });
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to update. Please try again.");
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="pr-2 overflow-y-auto max-h-[80vh]">
        <div className="mb-5 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-navy-900">Edit Plan Item</h2>
            <p className="text-xs text-text-muted">{plan.campaign}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!canEdit && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
              Read-only: this event is not assigned to your account.
            </p>
          )}
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1">Title</label>
            <Input value={form.title || ""} onChange={e => handleChange("title", e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1">Post Description</label>
            <textarea
              value={form.description || ""}
              onChange={e => handleChange("description", e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1">Platform</label>
            <select
              value={form.platform || ""}
              onChange={e => handleChange("platform", e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select —</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              <option value={form.platform}>{form.platform}</option>
            </select>
          </div>

          {/* Dates */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <label className="mb-1 block text-sm font-semibold text-navy-800">Overall Post Status</label>
            <select
              value={form.finalStatus || "Pending"}
              onChange={e => handleChange("finalStatus", e.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {STATUSES.filter(status => status !== "No caption").map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            {form.finalStatus === "Posted" && (
              <p className="mt-2 flex items-start gap-2 text-xs font-medium leading-5 text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                Design Status and Caption Status will both be saved as Posted.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1">Handover Date</label>
              <Input value={form.handoverDate || ""} onChange={e => handleChange("handoverDate", e.target.value)} placeholder="e.g. 11th July" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1">Date to Share</label>
              <Input value={form.dateToShare || ""} onChange={e => handleChange("dateToShare", e.target.value)} placeholder="e.g. 17th July" />
            </div>
          </div>

          {/* Designer + Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1">Designer</label>
              <Input value={form.designer || ""} onChange={e => handleChange("designer", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1">Design Status</label>
              <select
                value={form.designStatus || "Pending"}
                onChange={e => handleChange("designStatus", e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Content Writer + Caption Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1">Content Writer</label>
              <Input value={form.contentWriter || ""} onChange={e => handleChange("contentWriter", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1">Caption Status</label>
              <select
                value={form.captionStatus || "Pending"}
                onChange={e => handleChange("captionStatus", e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={updatePlan.isPending || !canEdit}>
              {updatePlan.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
