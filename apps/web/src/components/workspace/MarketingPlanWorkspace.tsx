import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export const MarketingPlanWorkspace = () => {
  const [plans, setPlans] = useState([
    {
      id: '1',
      channel: 'FB',
      title: 'Launch Post',
      deadline: '2026-02-28',
      designStatus: 'Approved',
      captionStatus: 'Pending',
      syncStatus: 'SYNCED'
    },
    {
      id: '2',
      channel: 'IG',
      title: 'Speaker Reveal',
      deadline: '2026-06-25',
      designStatus: 'InProgress',
      captionStatus: 'Approved',
      syncStatus: 'PENDING'
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Plan</h1>
        <div className="space-x-2">
          <Button variant="outline">Import from Google Sheets</Button>
          <Button>Add Item</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deliverables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Channel</th>
                  <th className="px-6 py-3">Deadline</th>
                  <th className="px-6 py-3">Design</th>
                  <th className="px-6 py-3">Caption</th>
                  <th className="px-6 py-3">Sync Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(plan => (
                  <tr key={plan.id} className="border-b">
                    <td className="px-6 py-4 font-medium text-gray-900">{plan.title}</td>
                    <td className="px-6 py-4">{plan.channel}</td>
                    <td className="px-6 py-4">{plan.deadline}</td>
                    <td className="px-6 py-4">
                      <Badge variant={plan.designStatus === 'Approved' ? 'success' : 'warning'}>
                        {plan.designStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={plan.captionStatus === 'Approved' ? 'success' : 'warning'}>
                        {plan.captionStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={plan.syncStatus === 'SYNCED' ? 'success' : 'outline'}>
                        {plan.syncStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
