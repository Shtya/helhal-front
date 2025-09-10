"use client"
import { useState, useEffect } from 'react';
import Layout from '@/components/dashboard/Layout';
import DataTable from '@/components/dashboard/ui/DataTable';
import { getLevelUpRequests, updateLevelUpStatus } from '@/utils/api';

export default function LevelUp() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  useEffect(() => {
    fetchLevelUpRequests();
  }, [pagination.page]);

  const fetchLevelUpRequests = async () => {
    try {
      setIsLoading(true);
      const response = await getLevelUpRequests(pagination.page, pagination.limit);
      setRequests(response.requests);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching level up requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (request) => {
    try {
      const newStatus = request.status === 'pending' ? 'approved' : 'pending';
      await updateLevelUpStatus(request.id, newStatus);
      fetchLevelUpRequests(); // Refresh data
    } catch (error) {
      console.error('Error updating level up status:', error);
    }
  };

  const columns = [
    { key: 'id', title: 'ID', sortable: true },
    { key: 'user', title: 'User', sortable: true, render: (value) => value.username },
    { key: 'currentLevel', title: 'Current Level', sortable: true },
    { key: 'requestedLevel', title: 'Requested Level', sortable: true },
    { key: 'orderCount', title: 'Order Count', sortable: true },
    { 
      key: 'status', 
      title: 'Status', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          value === 'approved' ? 'bg-green-100 text-green-800' :
          value === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'created_at', title: 'Request Date', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
  ];

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Level Up Requests</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <DataTable
              columns={columns}
              data={requests}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
              pagination={pagination}
              onPageChange={(page) => setPagination({...pagination, page})}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}