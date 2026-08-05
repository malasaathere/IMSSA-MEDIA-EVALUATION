"use client";

import { useState } from "react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { useCreateMarketingPlan, useMarketingPlans } from "../../api/queries";
import { Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";

const CAMPAIGNS = ["Exposition 2026 Media Plan", "HackX 2026", "HackX Jr 2026"];

interface ImportSheetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let startValue = 0;
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') { inQuotes = !inQuotes; }
    else if (text[i] === ',' && !inQuotes) {
      result.push(text.substring(startValue, i).replace(/^"|"$/g, '').trim());
      startValue = i + 1;
    }
  }
  result.push(text.substring(startValue).replace(/^"|"$/g, '').trim());
  return result;
}

function planKey(item: Record<string, unknown>): string {
  const clean = (value: unknown) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return [
    clean(item.campaign), clean(item.title), clean(item.description), clean(item.type),
    clean(item.designer), clean(item.contentWriter), clean(item.finishedBefore), clean(item.dateToShare),
  ].join('|');
}

export function ImportSheetsDialog({ open, onOpenChange }: ImportSheetsDialogProps) {
  const [csvText, setCsvText] = useState("");
  const [campaign, setCampaign] = useState(CAMPAIGNS[0]);
  const [status, setStatus] = useState<"idle" | "importing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const createPlan = useCreateMarketingPlan();
  const { data: plansResponse } = useMarketingPlans();

  const handleImport = async () => {
    if (!csvText.trim()) { setMessage("Please paste CSV data first."); return; }
    setStatus("importing");
    setMessage("");

    const lines = csvText.trim().split("\n");
    let inserted = 0;
    let skipped = 0;
    let failed = 0;
    const knownKeys = new Set((plansResponse?.documents || []).map((plan: any) => planKey(plan)));

    for (const line of lines) {
      const cols = parseCSVLine(line);
      if (cols.every(c => !c)) continue;
      // Skip header rows
      if (cols[0]?.toLowerCase() === 'title' || cols[0]?.toLowerCase() === 'campaign') continue;

      const item: any = {
        campaign,
        title: cols[0] || '',
        description: cols[1] || '',
        type: cols[2] || '',
        designer: cols[3] || '',
        designStatus: cols[4] || 'Pending',
        contentWriter: cols[5] || '',
        captionStatus: cols[6] || 'Pending',
        finalStatus: cols[7] || '',
        handoverStatus: cols[8] || '',
        handoverDate: cols[9] || '',
        finishedBefore: cols[10] || '',
        dateToShare: cols[11] || '',
        dateShared: cols[12] || '',
        platform: cols[13] || '',
      };

      const key = planKey(item);
      if (knownKeys.has(key)) {
        skipped++;
        continue;
      }

      try {
        await createPlan.mutateAsync(item);
        knownKeys.add(key);
        inserted++;
      } catch {
        failed++;
      }
    }

    if (failed === 0) {
      setStatus("done");
      setMessage(`✅ Imported ${inserted} new rows into "${campaign}". Skipped ${skipped} duplicates.`);
    } else {
      setStatus("error");
      setMessage(`Imported ${inserted} rows, skipped ${skipped} duplicates, and ${failed} rows failed.`);
    }
  };

  const handleClose = () => {
    setCsvText("");
    setCampaign(CAMPAIGNS[0]);
    setStatus("idle");
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <div className="pr-2">
        <div className="mb-5 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-navy-900">Import from Google Sheets</h2>
            <p className="text-xs text-text-muted">Export your sheet as CSV and paste the content below.</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-800 space-y-1">
          <p className="font-semibold">How to export from Google Sheets:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
            <li>Open your Google Sheet</li>
            <li>Go to <strong>File → Download → CSV (.csv)</strong></li>
            <li>Open the downloaded file, select all, and paste below</li>
          </ol>
          <p className="mt-2 font-semibold">Expected columns (in order):</p>
          <p className="text-blue-600">Title, Description, Type, Designer, Design Status, Content Writer, Caption Status, Final Status, Handover Status, Handover Date, Finished Before, Date to Share, Date Shared, Platform</p>
        </div>

        {/* Campaign selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-navy-800 mb-1">Campaign / Event *</label>
          <select
            value={campaign}
            onChange={e => setCampaign(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {CAMPAIGNS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* CSV Text area */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-navy-800 mb-1">Paste CSV Data *</label>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="Paste your CSV content here..."
            rows={10}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Status messages */}
        {message && (
          <div className={`flex items-start gap-2 text-sm px-3 py-2 rounded mb-4 ${
            status === 'done' ? 'bg-green-50 border border-green-200 text-green-800' :
            status === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {status === 'done' ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            {message}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>Close</Button>
          <Button onClick={handleImport} disabled={status === "importing"}>
            {status === "importing" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {status === "importing" ? "Importing..." : "Import"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
