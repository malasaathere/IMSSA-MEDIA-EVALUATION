import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Users, AlertTriangle, CheckCircle2 } from "lucide-react"

export function CapacityPanel() {
  // Mock data for capacity
  const reviewers = [
    { id: 1, name: "Alice Chen", active: 3, capacity: 3 },
    { id: 2, name: "Bob Smith", active: 1, capacity: 3 },
    { id: 3, name: "Charlie Davis", active: 2, capacity: 3 },
  ];

  const totalActive = reviewers.reduce((acc, r) => acc + r.active, 0);
  const totalCapacity = reviewers.reduce((acc, r) => acc + r.capacity, 0);
  const percentUsed = Math.round((totalActive / totalCapacity) * 100);

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Team Capacity
          </CardTitle>
          <span className="text-sm font-medium text-text-muted">
            {totalActive}/{totalCapacity} Tasks
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">Overall Utilization</span>
            <span className="font-semibold text-navy-900">{percentUsed}%</span>
          </div>
          <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${percentUsed > 80 ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wider">Reviewers</h4>
          {reviewers.map(reviewer => (
            <div key={reviewer.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary-soft text-primary font-medium flex items-center justify-center text-sm">
                  {reviewer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm font-medium text-navy-900">{reviewer.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {reviewer.active >= reviewer.capacity ? (
                  <AlertTriangle size={16} className="text-warning" />
                ) : (
                  <CheckCircle2 size={16} className="text-success" />
                )}
                <span className="text-sm text-text-muted">
                  <span className={reviewer.active >= reviewer.capacity ? 'text-warning font-semibold' : ''}>
                    {reviewer.active}
                  </span>
                  /{reviewer.capacity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
