"use client";

import { useState, useEffect } from "react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useUpdateMarketingPlan } from "../../api/queries";
import { Loader2, Edit2 } from "lucide-react";

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
const STATUSES = ["Pending", "On going", "assigned", "On revision", "Completed", "Approved", "No caption", "Posted"];

interface EditPlanDialogProps {
  plan: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlanDialog({ plan, open, onOpenChange }: EditPlanDialogProps) {
  const updatePlan = useUpdateMarketingPlan();
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");

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
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!plan?.$id) return;
    try {
      await updatePlan.mutateAsync({ id: plan.$id, data: form });
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
            <Button type="submit" disabled={updatePlan.isPending}>
              {updatePlan.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
