"use client"
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/Layout';
import DataTable from '@/components/dashboard/ui/DataTable';
import { getWithdrawals, processWithdrawal } from '@/utils/api';

export default function WithdrawManagement() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const data = await getWithdrawals(statusFilter);
      setWithdrawals(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (withdrawalId, action) => {
    try {
      await processWithdrawal(withdrawalId, action);
      fetchWithdrawals(); // Refresh the list
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    }
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { 
      key: 'user', 
      title: 'User',
      render: (value) => value.username
    },
    { 
      key: 'amount', 
      title: 'Amount',
      render: (value) => `$${value}`
    },
    { 
      key: 'paymentMethod', 
      title: 'Payment Method',
      render: (value) => value.methodType
    },
    { 
      key: 'created_at', 
      title: 'Request Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'status', 
      title: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, item) => (
        item.status === 'pending' && (
          <div className="space-x-2">
            <button
              onClick={() => handleProcess(item.id, 'approve')}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => handleProcess(item.id, 'reject')}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        )
      )
    },
  ];

  return (
    <DashboardLayout title="Withdrawal Management">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'pending' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'completed' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'rejected' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={withdrawals}
        loading={loading}
        actions={false}
      />
    </DashboardLayout>
  );
}