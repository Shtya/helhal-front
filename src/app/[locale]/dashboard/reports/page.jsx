'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Download, Filter, Calendar, DollarSign, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import api from '@/lib/axios';
import { GlassCard, MetricBadge, KPIGrid } from '@/components/dashboard/Ui';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';

export default function AdminReportsDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [reportType, setReportType] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  const timeRanges = [
    { id: '7d', name: 'Last 7 days' },
    { id: '30d', name: 'Last 30 days' },
    { id: '90d', name: 'Last 90 days' },
    { id: 'ytd', name: 'Year to date' },
    { id: 'custom', name: 'Custom range' },
  ];

  const reportTypes = [
    { id: 'sales', name: 'Sales Report' },
    { id: 'earnings', name: 'Earnings Report' },
    { id: 'user-activity', name: 'User Activity' },
    { id: 'summary', name: 'Platform Summary' },
  ];

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);

      let endpoint = '/reports/admin/summary';
      let params = {};

      // Calculate date range based on selection
      const now = new Date();
      let startDate,
        endDate = now.toISOString().split('T')[0];

      switch (timeRange) {
        case '7d':
          startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
          break;
        case '30d':
          startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
          break;
        case '90d':
          startDate = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
          break;
        case 'ytd':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
      }

      params = { startDate, endDate };

      let response;
      switch (reportType) {
        case 'summary':
          response = await api.get('/reports/admin/summary', { params });
          setSummaryData(response.data);
          break;
        case 'user-activity':
          response = await api.get('/reports/admin/user-activity', { params });
          setReportData(response.data);
          break;
        case 'sales':
          response = await api.get('/reports/sales', { params });
          setReportData(response.data);
          break;
        case 'earnings':
          response = await api.get('/reports/earnings', { params });
          setReportData(response.data);
          break;
      }
    } catch (e) {
      console.error('Error fetching report data:', e);
      setApiError(e?.response?.data?.message || 'Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  }, [timeRange, reportType]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const exportReport = async (format = 'csv') => {
    try {
      // This would typically generate and download a report file
      alert(`Exporting ${reportType} report as ${format}...`);
      // Actual implementation would depend on your backend API
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report.');
    }
  };

  const renderSummaryCards = () => {
    if (!summaryData) return null;

    return (
      <KPIGrid>
        <div className='bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg'>
          <Users size={24} />
          <h3 className='text-lg font-semibold mt-2'>Total Users</h3>
          <p className='text-3xl font-bold'>{summaryData.users?.total?.toLocaleString()}</p>
          <p className='text-blue-100'>{summaryData.users?.new} new this period</p>
        </div>

        <div className='bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg'>
          <ShoppingCart size={24} />
          <h3 className='text-lg font-semibold mt-2'>Total Orders</h3>
          <p className='text-3xl font-bold'>{summaryData.orders?.total?.toLocaleString()}</p>
          <p className='text-green-100'>{summaryData.orders?.period} this period</p>
        </div>

        <div className='bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg'>
          <DollarSign size={24} />
          <h3 className='text-lg font-semibold mt-2'>Total Revenue</h3>
          <p className='text-3xl font-bold'>${summaryData.financials?.totalRevenue}</p>
          <p className='text-purple-100'>Platform: ${summaryData.financials?.platformEarnings}</p>
        </div>

        <div className='bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-lg'>
          <TrendingUp size={24} />
          <h3 className='text-lg font-semibold mt-2'>Completion Rate</h3>
          <p className='text-3xl font-bold'>{summaryData.orders?.completionRate}%</p>
          <p className='text-amber-100'>{summaryData.orders?.completed} completed orders</p>
        </div>
      </KPIGrid>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-slate-200 rounded w-1/3'></div>
          <div className='h-64 bg-slate-200 rounded'></div>
        </div>
      );
    }

    if (reportType === 'summary') {
      return renderSummaryCards();
    }

    if (!reportData) return null;

    return (
      <div className='bg-white rounded-lg border border-slate-200 p-6'>
        <h3 className='text-lg font-semibold mb-4'>
          {reportTypes.find(r => r.id === reportType)?.name} - {timeRanges.find(t => t.id === timeRange)?.name}
        </h3>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-slate-50'>
              <tr>
                {reportType === 'sales' && (
                  <>
                    <th className='p-3'>Date</th>
                    <th className='p-3'>Orders</th>
                    <th className='p-3'>Revenue</th>
                    <th className='p-3'>Completed</th>
                  </>
                )}
                {reportType === 'earnings' && (
                  <>
                    <th className='p-3'>Date</th>
                    <th className='p-3'>Type</th>
                    <th className='p-3'>Amount</th>
                    <th className='p-3'>Description</th>
                  </>
                )}
                {reportType === 'user-activity' && (
                  <>
                    <th className='p-3'>User</th>
                    <th className='p-3'>Orders</th>
                    <th className='p-3'>Spent</th>
                    <th className='p-3'>Earned</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {reportType === 'sales' &&
                reportData.orders?.slice(0, 10).map((order, index) => (
                  <tr key={index} className='border-b'>
                    <td className='p-3'>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className='p-3'>{order.quantity}</td>
                    <td className='p-3'>${order.totalAmount}</td>
                    <td className='p-3'>
                      <MetricBadge tone={order.status === 'Completed' ? 'success' : 'neutral'}>{order.status}</MetricBadge>
                    </td>
                  </tr>
                ))}

              {reportType === 'user-activity' &&
                reportData.users?.slice(0, 10).map((user, index) => (
                  <tr key={index} className='border-b'>
                    <td className='p-3'>{user.username}</td>
                    <td className='p-3'>{user.totalOrders}</td>
                    <td className='p-3'>${user.totalSpent}</td>
                    <td className='p-3'>${user.totalEarned}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className='p-6'>
        <GlassCard gradient='from-indigo-400 via-blue-400 to-cyan-400' className='mb-6'>
          <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-white'>Analytics & Reports</h1>
              <p className='text-blue-100'>Platform performance insights and analytics</p>
            </div>
            <div className='flex flex-wrap gap-3'>
              <Button onClick={() => exportReport('csv')} className='bg-white text-blue-600'>
                <Download size={16} className='mr-2' />
                Export CSV
              </Button>
              <Button onClick={() => exportReport('pdf')} className='bg-white text-blue-600'>
                <Download size={16} className='mr-2' />
                Export PDF
              </Button>
            </div>
          </div>
        </GlassCard>

        {apiError && <div className='mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800'>{apiError}</div>}

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6'>
          <GlassCard className='p-4'>
            <div className='flex items-center mb-3'>
              <Filter size={18} className='text-slate-600 mr-2' />
              <label className='text-sm font-medium text-slate-700'>Report Type</label>
            </div>
            <Select value={reportType} onChange={e => setReportType(e.target.value)} options={reportTypes} />
          </GlassCard>

          <GlassCard className='p-4'>
            <div className='flex items-center mb-3'>
              <Calendar size={18} className='text-slate-600 mr-2' />
              <label className='text-sm font-medium text-slate-700'>Time Range</label>
            </div>
            <Select value={timeRange} onChange={e => setTimeRange(e.target.value)} options={timeRanges} />
          </GlassCard>

          {timeRange === 'custom' && (
            <>
              <GlassCard className='p-4'>
                <label className='block text-sm font-medium text-slate-700 mb-2'>Start Date</label>
                <Input type='date' />
              </GlassCard>
              <GlassCard className='p-4'>
                <label className='block text-sm font-medium text-slate-700 mb-2'>End Date</label>
                <Input type='date' />
              </GlassCard>
            </>
          )}
        </div>

        {renderReportContent()}
      </div>
    </div>
  );
}
