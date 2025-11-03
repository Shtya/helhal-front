'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Edit, Eye } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/dashboard/Table/Table';
import api, { baseImg } from '@/lib/axios';
import DashboardLayout from '@/components/dashboard/Layout';
import { MetricBadge, GlassCard } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import { useDebounce } from '@/hooks/useDebounce';
import ActionMenuPortal from '@/components/dashboard/Table/ActionMenuPortal';
import Img from '@/components/atoms/Img';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import InfoCard from '@/components/pages/profile/InfoCard';
import FormErrorMessage from '@/components/atoms/FormErrorMessage';
import { validateUsername, validatPhone } from '@/utils/profile';
import { useTranslations } from 'next-intl';
import PhoneInputWithCountry from '@/components/atoms/PhoneInputWithCountry';
import { Divider } from '@/components/UI/ui';


export default function AdminUsersDashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const debouncedSearch = useDebounce({ value: searchQuery });

  const [filters, setFilters] = useState({ role: '', status: 'all', page: 1, limit: 10, sortBy: 'newest', sortOrder: 'DESC' });
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const SORT_CONFIGS = {
    newest: { field: 'created_at', direction: 'DESC' },
    oldest: { field: 'created_at', direction: 'ASC' },
    az: { field: 'username', direction: 'ASC' },
    za: { field: 'username', direction: 'DESC' }
  };

  const tabs = [
    { value: 'all', label: 'All Users' },
    { value: 'buyer', label: 'Buyers' },
    { value: 'seller', label: 'Sellers' },
    { value: 'admin', label: 'Admins' },
  ];

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const sortConfig = SORT_CONFIGS[filters.sortBy] || SORT_CONFIGS.newest;


      const params = {
        ...filters, status: filters.status === 'all' ? '' : filters.status,
        filter: activeTab === 'all' ? '' : activeTab,
        search: debouncedSearch || undefined,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction
      };
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
  }, [fetchUsers]);

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
    handleFilterChange('sortBy', preset.id);
  };

  function applyStatusPreset(status) {
    handleFilterChange("status", status.id)
  }

  const handleStatusChange = async (userId, newStatus) => {
    const toastId = toast.loading(`Changing status to ${newStatus}...`);

    try {
      await api.put('/auth/status', { status: newStatus, userId });
      toast.success(`Status changed to ${newStatus} successfully`, {
        id: toastId,
      });
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change status', {
        id: toastId,
      });
      console.error('Error changing status:', err);
    }
  };

  const handleDeleteUser = async userId => {
    if (window.confirm('Delete this user?')) {
      let toastId;
      try {
        toastId = toast.loading('Deleting user...');
        await api.delete(`/auth/user/${userId}`);
        toast.success('User deleted', { id: toastId });
        fetchUsers();
      } catch (e) {
        console.error(e);
        toast.error('Failed to delete user', { id: toastId });
      }
    }
  };
  const viewUserDetails = async user => {
    try {

      setSelectedUser(user);
      setShowUserModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [savingUser, setSavingUser] = useState(false);

  // Add the handler for saving edited user
  const handleSaveUser = async (updatedData) => {
    if (phoneError || usernameError) return;
    setSavingUser(true);
    let toastId;
    try {
      toastId = toast.loading('Saving changes...');

      await api.put(`/auth/profile/${editingUser.id}`, updatedData);

      toast.success('User updated successfully', { id: toastId });
      fetchUsers(); // Refresh the list
      setEditMode(false);
      setShowUserModal(false);
      setEditingUser(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update user', { id: toastId });
      console.error(err);
    } finally {
      setSavingUser(false);
    }
  };

  // Update the Edit button click handler
  const handleEditClick = (user) => {
    setEditMode(true);
    setEditingUser(user);
    setShowUserModal(true);
  };

  const onRemoveEducation = idx => setEditingUser(a => ({ ...a, education: a.education.filter((_, i) => i !== idx) }));
  const onRemoveCertification = idx => setEditingUser(a => ({ ...a, certifications: a.certifications.filter((_, i) => i !== idx) }));

  const [usernameError, setUsernameError] = useState('');
  const t = useTranslations('auth');

  const handleChangeUsername = (value) => {
    const trimmed = value.trim();

    const msg = validateUsername(trimmed);
    setUsernameError(msg);
  };

  const [phoneError, setPhoneError] = useState('');

  const handleChangePhone = (val) => {
    const trimmed = val.phone.trim();
    const isInvalid = validatPhone(trimmed);

    setPhoneError(isInvalid ? 'inValidOptionalPhone' : '');
    setEditingUser(s => ({ ...s, ...val }));
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



  const UserActions = ({ row }) => {
    const user = row;
    return (
      <div className=" flex items-center gap-2">
        <button
          onClick={() => viewUserDetails(user)}
          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full"
          title="View Details"
        >
          <Eye size={16} />
        </button>

        <button
          onClick={() => handleEditClick(user)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
          title="Edit User"
        >
          <Edit size={16} />
        </button>
        <div className="relative">
          <ActionMenuPortal
          >
            {user.status !== 'active' && (
              <button
                onClick={() => handleStatusChange(user.id, 'active')}
                className="flex items-center w-full px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
              >
                Activate
              </button>
            )}
            {user.status !== 'suspended' && (
              <button
                onClick={() => handleStatusChange(user.id, 'suspended')}
                className="flex items-center w-full px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
              >
                Suspend
              </button>
            )}
            {user.status !== 'deleted' && (<button
              onClick={() => handleDeleteUser(user.id)}
              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Delete
            </button>)}
          </ActionMenuPortal>
        </div>
      </div>
    )
  }

  function handleNavigate() {
    router.push(`/profile/${selectedUser.id}`)
  }


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
                value={filters.sortBy}
                onChange={e => applySortPreset(e)}
                placeholder='order by'
                options={[
                  { id: 'newest', name: 'Newest' },
                  { id: 'oldest', name: 'Oldest' },
                  { id: 'az', name: 'A–Z' },
                  { id: 'za', name: 'Z–A' },
                ]}
              />

              <Select
                className='!w-fit'
                value={filters?.status}
                onChange={e => applyStatusPreset(e)}
                placeholder='order by'
                options={[
                  { id: 'all', name: 'All' },
                  { id: 'active', name: 'Active' },
                  { id: 'suspended', name: 'Suspended' },
                  { id: 'Deleted', name: 'Deleted' },
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
            Actions={UserActions}
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
        {showUserModal && (selectedUser || editingUser) && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className='bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ring-1 ring-slate-200 shadow-xl'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-semibold'>
                  {editMode ? 'Edit User' : 'User Details'}
                </h2>
                <button onClick={() => {
                  setShowUserModal(false);
                  setEditMode(false);
                  setEditingUser(null);
                }} className='text-slate-400 hover:text-slate-600'>
                  ✕
                </button>
              </div>
              {editMode ? (
                // Edit mode using InfoCard
                <>
                  <Input
                    required
                    label="Username"
                    value={editingUser.username}
                    onChange={e => {
                      const value = e.target.value.slice(0, 50);
                      setEditingUser(s => ({ ...s, username: value }));
                      handleChangeUsername(value);
                    }}
                    onBlur={e => handleChangeUsername(e.target.value)}
                  />
                  {usernameError && <FormErrorMessage message={t(`errors.${usernameError}`)} />}
                  <Divider />
                  <PhoneInputWithCountry
                    value={{ countryCode: editingUser.countryCode || { code: 'SA', dial_code: '+966' }, phone: editingUser.phone }}
                    onChange={handleChangePhone}
                  />
                  {phoneError && <FormErrorMessage message={t(`errors.${phoneError}`)} />}
                  <Divider />
                  <InfoCard
                    className='!border-none !bg-transparent  !shadow-none !p-0'
                    loading={false}
                    about={{
                      username: editingUser.username,
                      email: editingUser.email,
                      phone: editingUser.phone,
                      countryCode: editingUser.countryCode,
                      description: editingUser.description,
                      education: editingUser.education,
                      certifications: editingUser.certifications,
                      languages: editingUser.languages || [],
                      skills: editingUser.skills || [],
                      country: editingUser.country,
                      type: editingUser.type,
                    }}
                    setAbout={updater => {
                      setEditingUser(prev => ({ ...prev, ...(typeof updater === 'function' ? updater(prev) : updater) }));
                    }}
                    onCountryChange={code => setEditingUser(prev => ({ ...prev, country: code }))}
                    onTypeChange={type => setEditingUser(prev => ({ ...prev, type }))}
                    onRemoveEducation={onRemoveEducation}
                    onRemoveCertification={onRemoveCertification}
                    accountTypeOptions={[
                      { id: 'Business', name: 'Business' },
                      { id: 'Individual', name: 'Individual' },
                    ]}
                  />

                  <div className='mt-6 flex justify-end gap-3'>
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        setEditMode(false);
                        setEditingUser(null);
                      }}
                      className='px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50'
                      disabled={savingUser}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveUser(editingUser)}
                      disabled={savingUser || phoneError || usernameError}
                      className='px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50'
                    >
                      {savingUser ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='flex flex-col items-center text-center'>
                      <Img src={selectedUser.profileImage} alt={selectedUser.username} altSrc='/images/placeholder-avatar.png' className='w-28 h-28 rounded-full object-cover mb-4 ring-2 ring-white shadow-sm' />
                      <h3 className='text-lg font-semibold text-slate-900 hover:underline cursor-pointer' onClick={handleNavigate}>{selectedUser.username}</h3>
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
                        <p>
                          <span className='font-medium'>Referral Code:</span> {selectedUser.referralCode || 'No Referral Code'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className='mt-6 flex justify-end gap-3'>
                    <button onClick={() => setShowUserModal(false)} className='px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50'>
                      Close
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
