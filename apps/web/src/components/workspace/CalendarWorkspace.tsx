"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { useMarketingPlans, useTasks } from '../../api/queries';
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { getCampaignTone } from '../../lib/campaign-colors';

export const CalendarWorkspace = () => {
  const { data: plansResponse, isLoading: plansLoading } = useMarketingPlans();
  const { data: tasksResponse, isLoading: tasksLoading } = useTasks();

  const [view, setView] = useState<'plans' | 'tasks'>('plans');

  const plans = plansResponse?.documents || [];
  const tasks = tasksResponse?.documents || [];

  const isLoading = plansLoading || tasksLoading;

  // Simple sort by date
  const sortedPlans = [...plans].sort((a: any, b: any) => 
    new Date(a.normalizedShareDate || a.handoverDate || a.dateToShare || 0).getTime() - new Date(b.normalizedShareDate || b.handoverDate || b.dateToShare || 0).getTime()
  );

  const sortedTasks = [...tasks].sort((a: any, b: any) => 
    new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime()
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Timeline & Calendar</h1>
        <div className="space-x-2 bg-slate-100 p-1 rounded-md">
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === 'plans' ? 'bg-white shadow-sm text-navy-700' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setView('plans')}
          >
            Marketing Plans
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === 'tasks' ? 'bg-white shadow-sm text-navy-700' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setView('tasks')}
          >
            Tasks
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-slate-500" />
            Upcoming Deadlines ({view === 'plans' ? 'Marketing Plans' : 'Tasks'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-navy-600 mb-4" />
              <p className="text-slate-500">Loading timeline...</p>
            </div>
          ) : view === 'plans' && sortedPlans.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No upcoming marketing plans.</div>
          ) : view === 'tasks' && sortedTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No upcoming tasks.</div>
          ) : (
            <div className="space-y-4">
              {(view === 'plans' ? sortedPlans : sortedTasks).map((item: any) => {
                const isPlan = view === 'plans';
                const dateRaw = isPlan ? (item.normalizedShareDate || item.handoverDate || item.dateToShare) : item.deadline;
                const date = dateRaw ? new Date(dateRaw).toLocaleDateString() : 'No Date';
                
                const title = isPlan ? item.title : item.title;
                const subtitle = isPlan ? item.campaign : (item.eventId || 'General Task');
                const status = isPlan ? (item.designStatus || 'Pending') : (item.status || 'IN_PROGRESS');
                const isCompleted = isPlan ? status === 'Approved' : status === 'COMPLETED';
                const campaignTone = isPlan ? getCampaignTone(item.campaign) : getCampaignTone();
                const isDarkCampaign = isPlan && (item.campaign || '').toLowerCase().includes('hackx') && !(item.campaign || '').toLowerCase().includes('jr');

                return (
                  <div key={item.$id} className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${campaignTone.surface}`}>
                    <div className="flex-shrink-0 w-24 pt-1">
                      <div className={`text-sm font-semibold ${isDarkCampaign ? 'text-blue-50' : 'text-slate-900'}`}>{date}</div>
                    </div>
                    
                    <div className="flex-shrink-0 pt-1">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-medium truncate ${isDarkCampaign ? 'text-white' : 'text-slate-900'}`}>
                        {title}
                      </p>
                      <p className={`text-sm truncate ${isDarkCampaign ? 'text-blue-100' : 'text-slate-500'}`}>
                        {subtitle}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Badge variant={isCompleted ? 'success' : 'outline'}>
                        {status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
