import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { apiClient } from '../../api/api-client'

export function ChiefCoordinatorWorkspace() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/overview')
      return res.data
    }
  })

  const { data: workload, isLoading: workloadLoading } = useQuery({
    queryKey: ['analytics', 'workload'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/workload')
      return res.data
    }
  })

  if (overviewLoading || workloadLoading) return <div className="p-8">Loading analytics...</div>

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-navy-900 mb-8">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Active Work (Tasks)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold-500">{overview?.activeWork || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Completed (Approved)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{overview?.totalApproved || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">On-Time Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy-700">{overview?.onTimeCompletionRate ? `${overview.onTimeCompletionRate * 100}%` : 'N/A'}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Avg. First Review (Hrs)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy-700">{overview?.averageFirstReviewTimeHours || 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-navy-900 mb-4">Designer Workload (Capacity)</h2>
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Designer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Active Tasks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Utilization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {workload?.map((designer: any) => (
              <tr key={designer.userId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{designer.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{designer.activeTasks} / {designer.capacity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${designer.utilizationPercentage >= 100 ? 'bg-red-500' : 'bg-gold-500'}`} 
                      style={{ width: `${Math.min(designer.utilizationPercentage, 100)}%` }}>
                    </div>
                  </div>
                  <span className="text-xs mt-1 inline-block">{designer.utilizationPercentage}%</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {designer.activeTasks >= designer.capacity ? 
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">At Capacity</span> :
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Available</span>
                  }
                </td>
              </tr>
            ))}
            {(!workload || workload.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">No active designers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
