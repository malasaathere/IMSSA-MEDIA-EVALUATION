"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useMarketingPlans } from '../../api/queries';
import { Loader2, Upload, Sparkles, ChevronDown } from 'lucide-react';
import { EditPlanDialog } from './EditPlanDialog';
import { ImportSheetsDialog } from './ImportSheetsDialog';
import { getCampaignTone } from '../../lib/campaign-colors';

function getStatusVariant(status: string): any {
  const s = (status || '').toLowerCase();
  if (s === 'approved' || s === 'completed' || s === 'posted') return 'success';
  if (s === 'pending') return 'warning';
  if (s === 'on going' || s === 'ongoing' || s === 'assigned') return 'info';
  if (s === 'on revision') return 'danger';
  if (s === 'no caption') return 'outline';
  return 'outline';
}

export const MarketingPlanWorkspace = () => {
  const { data: plansResponse, isLoading } = useMarketingPlans();
  const plans = plansResponse?.documents || [];

  const campaigns = ['All', ...Array.from(new Set(plans.map((p: any) => p.campaign).filter(Boolean)))];
  const [selectedCampaign, setSelectedCampaign] = useState<string>('All');
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiCaptions, setAiCaptions] = useState<Record<string, string>>({});

  const filteredPlans = selectedCampaign === 'All'
    ? plans
    : plans.filter((p: any) => p.campaign === selectedCampaign);

  const handleEdit = (plan: any) => {
    setEditPlan(plan);
    setEditOpen(true);
  };

  const handleGenerateCaption = async (plan: any) => {
    setAiLoading(plan.$id);
    try {
      const prompt = `Write a short, engaging social media caption for the following post. Keep it under 150 characters, suitable for ${plan.platform || 'social media'}. Post title: "${plan.title}". Description: "${plan.description || plan.title}". Event: ${plan.campaign}. Add relevant emojis.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const data = await res.json();
      const caption = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not generate caption.';
      setAiCaptions(prev => ({ ...prev, [plan.$id]: caption.trim() }));
    } catch {
      setAiCaptions(prev => ({ ...prev, [plan.$id]: 'Failed to generate. Check your API key.' }));
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Plan</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import from Google Sheets
          </Button>
          <Button>Add Item</Button>
        </div>
      </div>

      {/* Campaign filter buttons */}
      <div className="flex flex-wrap gap-2">
        {campaigns.map((camp: string) => (
          <Button
            key={camp}
            variant="outline"
            onClick={() => setSelectedCampaign(camp)}
            size="sm"
            className={camp === 'All'
              ? (selectedCampaign === camp ? 'bg-slate-900 text-white hover:bg-slate-800' : '')
              : `${getCampaignTone(camp).tab} ${selectedCampaign === camp ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
          >
            {camp === 'All' ? 'All Campaigns' : camp}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Upcoming Deliverables
            {selectedCampaign !== 'All' && (
              <span className="ml-2 text-sm font-normal text-slate-500">— {selectedCampaign}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Handover Date</th>
                  <th className="px-4 py-3">Design</th>
                  <th className="px-4 py-3">Caption</th>
                  <th className="px-4 py-3">AI Caption</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-navy-600" />
                      Loading plans...
                    </td>
                  </tr>
                ) : filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No marketing plans found for this campaign.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan: any) => (
                    <React.Fragment key={plan.$id}>
                      <tr className={`border-b transition-colors ${getCampaignTone(plan.campaign).row}`}>
                        <td className="px-4 py-3 font-medium max-w-[150px] truncate">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getCampaignTone(plan.campaign).label}`}>
                            {plan.campaign || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                          <div className="font-medium text-gray-900 truncate">{plan.title || '-'}</div>
                          {plan.description && (
                            <div className="text-xs text-gray-500 truncate">{plan.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px]">{plan.platform || '-'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{plan.handoverDate || plan.dateToShare || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusVariant(plan.designStatus)}>
                            {plan.designStatus || 'Pending'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusVariant(plan.captionStatus)}>
                            {plan.captionStatus || 'Pending'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateCaption(plan)}
                            disabled={aiLoading === plan.$id}
                            className="text-xs"
                          >
                            {aiLoading === plan.$id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <><Sparkles className="h-3 w-3 mr-1" /> Generate</>
                            }
                          </Button>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                      {/* AI Caption Row */}
                      {aiCaptions[plan.$id] && (
                        <tr className="bg-amber-50 border-b">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-amber-700 mb-1">AI Generated Caption</p>
                                <p className="text-sm text-gray-800">{aiCaptions[plan.$id]}</p>
                                <button
                                  className="text-xs text-red-400 hover:text-red-600 mt-1"
                                  onClick={() => setAiCaptions(prev => { const n = {...prev}; delete n[plan.$id]; return n; })}
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EditPlanDialog plan={editPlan} open={editOpen} onOpenChange={setEditOpen} />
      <ImportSheetsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};
