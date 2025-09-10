// src/components/dashboard/Analytics.js
import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/utils/api';

export default function Analytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
    activeServices: 0,
    abuseReports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard 
        title="Total Users" 
        value={stats.totalUsers} 
        icon="👥" 
        color="blue" 
      />
      <StatCard 
        title="Total Orders" 
        value={stats.totalOrders} 
        icon="📦" 
        color="green" 
      />
      <StatCard 
        title="Total Revenue" 
        value={`$${stats.totalRevenue}`} 
        icon="💰" 
        color="purple" 
      />
      <StatCard 
        title="Pending Withdrawals" 
        value={stats.pendingWithdrawals} 
        icon="⏳" 
        color="yellow" 
      />
      <StatCard 
        title="Active Services" 
        value={stats.activeServices} 
        icon="🛍️" 
        color="indigo" 
      />
      <StatCard 
        title="Abuse Reports" 
        value={stats.abuseReports} 
        icon="⚠️" 
        color="red" 
      />
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}