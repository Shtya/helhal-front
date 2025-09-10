'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, MoreVertical, Eye, UserPlus, RefreshCw, Download, Upload, Shield, UserCheck, UserX } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/dashboard/Table/Table';
import api, { baseImg } from '@/lib/axios';
import DashboardLayout from '@/components/dashboard/Layout';
import { MetricBadge, StatCard, KPIGrid, GlassCard } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';

export default function AdminUsersDashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ role: '', status: '', page: 1, limit: 10, sortBy: 'created_at', sortOrder: 'DESC' });
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const tabs = [
    { value: 'all', label: 'All Users' },
    { value: 'buyer', label: 'Buyers' },
    { value: 'seller', label: 'Sellers' },
    { value: 'admin', label: 'Admins' },
  ];

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { ...filters, filter: activeTab === 'all' ? '' : activeTab, search: debouncedSearch || undefined };
      const res = await api.get('/auth/users', { params });
      // SERVER PAGINATION: use API payload fields
      setUsers(res?.data?.records || []);
      setTotalUsers(res?.data?.total_records ?? 0);
      setFilters(prev => ({
        ...prev,
        page: res?.data?.current_page ?? prev.page,
        limit: res?.data?.per_page ?? prev.limit,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, filters.page, filters.limit, filters.sortBy, filters.sortOrder, filters.status, filters.role]);

  useEffect(() => {
    fetchUsers();
  }, [activeTab, debouncedSearch, filters.page, filters.limit, filters.sortBy, filters.sortOrder, filters.status, filters.role]);

  const handleTabChange = tab => {
    setActiveTab(tab);
    setFilters(p => ({ ...p, page: 1, role: tab === 'all' ? '' : tab }));
  };
  const handleSearch = e => {
    setSearchQuery(e.target.value);
    setFilters(p => ({ ...p, page: 1 }));
  };
  const handleFilterChange = (k, v) => setFilters(p => ({ ...p, [k]: v, page: 1 }));
  const applySortPreset = preset => {
    if (preset.id === 'newest') return handleFilterChange('sortBy', 'created_at'), handleFilterChange('sortOrder', 'DESC');
    if (preset.id === 'oldest') return handleFilterChange('sortOrder', 'ASC'), handleFilterChange('sortBy', 'created_at');
    if (preset.id === 'az') return handleFilterChange('sortBy', 'username'), handleFilterChange('sortOrder', 'ASC');
    if (preset.id === 'za') return handleFilterChange('sortBy', 'username'), handleFilterChange('sortOrder', 'DESC');
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await api.put('/auth/status', { status: newStatus, userId });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };
  const handleDeleteUser = async userId => {
    if (window.confirm('Delete this user?')) {
      try {
        await api.delete(`/auth/user/${userId}`);
        fetchUsers();
      } catch (e) {
        console.error(e);
      }
    }
  };
  const viewUserDetails = async userId => {
    try {
      const res = await api.get(`/auth/profile/${userId}`);
      setSelectedUser(res?.data);
      setShowUserModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Columns
  const userColumns = [
    { key: 'profileImage', label: 'Avatar', type: 'img' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'status',
      label: 'Status',
      status: [
        ['active', 'inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-xs'],
        ['suspended', 'inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs'],
        ['pending_verification', 'inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs'],
        ['deleted', 'inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-full text-xs'],
      ],
    },
    { key: 'memberSince', label: 'Joined', type: 'date' },
    { key: 'lastLogin', label: 'Last Login', type: 'date' },
  ];

  const userActions = user => (
    <div className='flex items-center gap-2'>
      <button onClick={() => viewUserDetails(user.id)} className='p-2 text-emerald-600 hover:bg-emerald-50 rounded-full' title='View Details'>
        <Eye size={16} />
      </button>
      <div className='relative group'>
        <button className='p-2 text-slate-600 hover:bg-slate-100 rounded-full'>
          <MoreVertical size={16} />
        </button>
        <div className='absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10'>
          <div className='py-1'>
            {user.status !== 'active' && (
              <button onClick={() => handleStatusChange(user.id, 'active')} className='flex items-center w-full px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50'>
                Activate
              </button>
            )}
            {user.status !== 'suspended' && (
              <button onClick={() => handleStatusChange(user.id, 'suspended')} className='flex items-center w-full px-4 py-2 text-sm text-amber-700 hover:bg-amber-50'>
                Suspend
              </button>
            )}
            <button className='flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50'>Email User</button>
            <button onClick={() => handleDeleteUser(user.id)} className='flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50'>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout className='min-h-screen bg-gradient-to-b from-white via-slate-50 to-white'>
      <div className=' '>
        {/* Controls */}
        <GlassCard gradient='from-rose-400 via-orange-400 to-amber-400' className='mt-6 mb-6'>
          <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} className=' ' />
            <div className='flex flex-wrap items-center gap-3'>
              <Input iconLeft={'/icons/search.svg'} className='!w-fit' value={searchQuery} onChange={handleSearch} placeholder='Search users…' c />
              <Select
                className='!w-fit'
                value={'newest'}
                onChange={e => applySortPreset(e)}
                placeholder='order by'
                options={[
                  { id: 'newest', name: 'Newest' },
                  { id: 'oldest', name: 'Oldest' },
                  { id: 'az', name: 'A–Z' },
                  { id: 'za', name: 'Z–A' },
                ]}
              />
            </div>
          </div>
        </GlassCard>

        {/* Table */}
        <div className='bg-white border border-slate-200 card-glow rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden'>
          <Table
            data={users}
            columns={userColumns}
            actions={userActions}
            loading={loading}
            rowsPerPage={filters.limit}
            page={filters.page} // NEW: current page from server
            totalCount={totalUsers} // NEW: total_records from server
            onPageChange={(
              p, // NEW: updates server-side page
            ) => setFilters(prev => ({ ...prev, page: p }))}
          />
        </div>

        {/* Modal */}
        {showUserModal && selectedUser && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className='bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ring-1 ring-slate-200 shadow-xl'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-semibold'>User Details</h2>
                <button onClick={() => setShowUserModal(false)} className='text-slate-400 hover:text-slate-600'>
                  ✕
                </button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='flex flex-col items-center text-center'>
                  <img src={selectedUser.profileImage || `${baseImg}default-avatar.png`} alt={selectedUser.username} className='w-28 h-28 rounded-full object-cover mb-4 ring-2 ring-white shadow-sm' />
                  <h3 className='text-lg font-semibold text-slate-900'>{selectedUser.username}</h3>
                  <p className='text-slate-600'>{selectedUser.email}</p>
                  <div className='mt-4 flex flex-wrap gap-2'>
                    <MetricBadge tone={selectedUser.status === 'active' ? 'success' : selectedUser.status === 'suspended' ? 'danger' : 'warning'}>{selectedUser.status}</MetricBadge>
                    <MetricBadge tone='info'>{selectedUser.role}</MetricBadge>
                  </div>
                </div>
                <div>
                  <h4 className='font-semibold mb-3 text-slate-900'>User Information</h4>
                  <div className='space-y-2 text-sm text-slate-700'>
                    <p>
                      <span className='font-medium'>Member Since:</span> {new Date(selectedUser.memberSince).toLocaleDateString()}
                    </p>
                    <p>
                      <span className='font-medium'>Last Login:</span> {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                    </p>
                    <p>
                      <span className='font-medium'>Description:</span> {selectedUser.description || 'No description'}
                    </p>
                    <p>
                      <span className='font-medium'>Skills:</span> {selectedUser.skills?.join(', ') || 'No skills listed'}
                    </p>
                    <p>
                      <span className='font-medium'>Languages:</span> {selectedUser.languages?.join(', ') || 'No languages listed'}
                    </p>
                  </div>
                </div>
              </div>
              <div className='mt-6 flex justify-end gap-3'>
                <button onClick={() => setShowUserModal(false)} className='px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50'>
                  Close
                </button>
                <button className='px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700'>Edit User</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
