"use client"
import DashboardLayout from '@/components/dashboard/Layout';
import Analytics from '@/components/dashboard/Analytics';

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard Overview">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Statistics</h2>
        <Analytics />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
          {/* Recent activities component would go here */}
          <div className="text-gray-500 text-center py-8">
            Recent activities will be displayed here
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <div>Manage Users</div>
            </button>
            <button className="bg-green-100 text-green-700 p-4 rounded-lg hover:bg-green-200 transition-colors">
              <div className="text-2xl mb-2">🛍️</div>
              <div>Approve Services</div>
            </button>
            <button className="bg-yellow-100 text-yellow-700 p-4 rounded-lg hover:bg-yellow-200 transition-colors">
              <div className="text-2xl mb-2">💰</div>
              <div>Process Withdrawals</div>
            </button>
            <button className="bg-purple-100 text-purple-700 p-4 rounded-lg hover:bg-purple-200 transition-colors">
              <div className="text-2xl mb-2">⚠️</div>
              <div>Review Reports</div>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}