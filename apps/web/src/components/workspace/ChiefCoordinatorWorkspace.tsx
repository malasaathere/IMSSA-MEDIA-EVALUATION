import { useTasks, useUsers } from '../../api/queries'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Loader2, AlertCircle, Inbox } from 'lucide-react'

export function ChiefCoordinatorWorkspace() {
  const { data: response, isLoading, isError, error } = useTasks()
  const { data: usersResponse } = useUsers()
  
  if (isLoading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-[60vh] bg-slate-50">
        <Loader2 className="animate-spin text-navy-600 h-10 w-10 mb-4" />
        <p className="text-slate-500 font-medium">Loading analytics data...</p>
      </div>
    )
  }

  if (isError) {
    const isPermissionError = (error as any)?.code === 401 || (error as any)?.code === 403;
    if (isPermissionError) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-slate-500 bg-slate-50">
           <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
           <h3 className="text-xl font-bold text-navy-900 mb-2">Permission Denied</h3>
           <p>You do not have the required role to view the analytics dashboard.</p>
        </div>
      )
    }
    // Throw fatal errors to the Next.js Error Boundary
    throw error;
  }

  const tasks = response?.documents;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-slate-500 bg-slate-50">
         <Inbox className="w-12 h-12 text-slate-300 mb-4" />
         <h3 className="text-xl font-bold text-navy-900 mb-2">No Data Available</h3>
         <p>There are currently no tasks to analyze.</p>
      </div>
    )
  }

  const allUsers = usersResponse?.documents || [];

  const activeWorkCount = tasks.filter(t => t?.status !== 'COMPLETED' && t?.status !== 'CANCELLED').length;
  const totalApprovedCount = tasks.filter(t => t?.status === 'COMPLETED').length;

  // Aggregate designer workload from active tasks, joining with users for real names
  const designersMap = new Map<string, number>();
  tasks.forEach(t => {
    if (t?.status !== 'COMPLETED' && t?.status !== 'CANCELLED' && t?.currentAssigneeId) {
      designersMap.set(t.currentAssigneeId, (designersMap.get(t.currentAssigneeId) || 0) + 1);
    }
  });

  const workload = Array.from(designersMap.entries()).map(([userId, count]) => {
    const userDoc = allUsers.find((u: any) => u.authUserId === userId);
    return {
      userId,
      name: userDoc?.name || userId,
      activeTasks: count,
      capacity: 3,
      utilizationPercentage: Math.round((count / 3) * 100)
    };
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-navy-900 mb-8">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Active Work (Tasks)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold-500">{activeWorkCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Completed (Approved)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{totalApprovedCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy-700">{tasks.filter(t => t?.status === 'IN_REVIEW').length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy-700">{tasks.filter(t => t?.status === 'IN_PROGRESS').length}</div>
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
