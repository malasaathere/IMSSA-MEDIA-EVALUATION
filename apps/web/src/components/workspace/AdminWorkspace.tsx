import { useQuery } from '@tanstack/react-query'
import { databases } from '../../lib/appwrite'
import { COLLECTIONS, DATABASE_ID } from '../../lib/appwrite-collections'

export function AdminWorkspace() {
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS)
      return res.documents
    }
  })

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-navy-900">System Administration</h1>
        <button className="bg-navy-600 text-white px-4 py-2 rounded shadow hover:bg-navy-700">Invite User</button>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-navy-900 mb-4">User Management</h2>
        
        {usersLoading ? (
          <div>Loading users...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Roles</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users?.map((user: any) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex space-x-1">
                      {user.roles.map((r: any) => (
                        <span key={r.roleId} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                          {r.role.code}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit Roles</button>
                    <button className="text-red-600 hover:text-red-900">Deactivate</button>
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
