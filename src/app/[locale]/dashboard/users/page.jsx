'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Edit, Eye } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/dashboard/Table/Table';
import api, { baseImg } from '@/lib/axios';
import { MetricBadge, GlassCard, Modal } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
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
import { isErrorAbort } from '@/utils/helper';
import SearchBox from '@/components/common/Filters/SearchBox';

const SellerLevel = {
  LVL1: 'lvl1',
  LVL2: 'lvl2',
  NEW: 'new',
  TOP: 'top',
}


export default function AdminUsersDashboard() {
  const t = useTranslations('Dashboard.users');
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [debouncedSearch, setDebouncedSearch] = useState('');

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
    { value: 'all', label: t('tabs.all') },
    { value: 'buyer', label: t('tabs.buyer') },
    { value: 'seller', label: t('tabs.seller') },
    { value: 'admin', label: t('tabs.admin') },
  ];
  const controllerRef = useRef();
  const fetchUsers = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);

      const sortConfig = SORT_CONFIGS[filters.sortBy] || SORT_CONFIGS.newest;


      const params = {
        ...filters, status: filters.status === 'all' ? '' : filters.status,
        filter: activeTab === 'all' ? '' : activeTab,
        search: debouncedSearch?.trim() || undefined,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction
      };
      const res = await api.get('/auth/users', { params, signal: controller.signal });
      // SERVER PAGINATION: use API payload fields
      setUsers(res?.data?.records || []);
      setTotalUsers(res?.data?.total_records ?? 0);
    } catch (e) {
      if (!isErrorAbort(e)) {
        console.error(e);
      }
    } finally {

      if (controllerRef.current === controller)
        setLoading(false);
    }
  }, [activeTab, debouncedSearch?.trim(), filters.page, filters.limit, filters.sortBy, filters.sortOrder, filters.status, filters.role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleTabChange = tab => {
    setActiveTab(tab);
    setFilters(p => ({ ...p, page: 1, role: tab === 'all' ? '' : tab }));
  };
  const handleSearch = value => {
    setDebouncedSearch(value);
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
    const toastId = toast.loading(t('toast.changingStatus', { status: newStatus }));

    try {
      await api.put('/auth/status', { status: newStatus, userId });
      toast.success(t('toast.statusChanged', { status: newStatus }), {
        id: toastId,
      });
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('toast.statusError'), {
        id: toastId,
      });
      console.error('Error changing status:', err);
    }
  };

  const handleDeleteUser = async userId => {
    if (window.confirm(t('toast.deleteConfirm'))) {
      let toastId;
      try {
        toastId = toast.loading(t('toast.deleting'));
        await api.delete(`/auth/user/${userId}`);
        toast.success(t('toast.deleted'), { id: toastId });
        fetchUsers();
      } catch (e) {
        console.error(e);
        toast.error(t('toast.deleteError'), { id: toastId });
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
    const finalUpdatedata = {
      ...updatedData,
      countryId: updatedData.country,
    }
    setSavingUser(true);
    let toastId;
    try {
      toastId = toast.loading(t('toast.saving'));

      await api.put(`/auth/profile/${editingUser.id}`, finalUpdatedata);

      toast.success(t('toast.saved'), { id: toastId });
      fetchUsers(); // Refresh the list
      setEditMode(false);
      setShowUserModal(false);
      setEditingUser(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || t('toast.saveError'), { id: toastId });
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

  const updateUserLevel = async (id, level) => {
    let toastId;
    try {
      toastId = toast.loading(t('toast.changingLevel', { level }));
      await api.put(`/auth/users/${id}/level`, { sellerLevel: level });
      toast.success(t('toast.levelSet', { level }), { id: toastId });
      await fetchUsers(); // refresh list
    } catch (e) {
      toast.error(e?.response?.data?.message || t('toast.levelError'), { id: toastId });
    }
  };


  // Columns
  const userColumns = [
    { key: 'profileImage', label: t('columns.avatar'), type: 'img' },
    { key: 'username', label: t('columns.username') },
    { key: 'email', label: t('columns.email') },
    { key: 'role', label: t('columns.role') },
    {
      key: 'status',
      label: t('columns.status'),
      status: [
        ['active', 'inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-xs'],
        ['suspended', 'inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs'],
        ['pending_verification', 'inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs'],
        ['deleted', 'inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-full text-xs'],
      ],
    },
    { key: 'memberSince', label: t('columns.joined'), type: 'date' },
    { key: 'lastLogin', label: t('columns.lastLogin'), type: 'date' },
  ];


  const UserActions = ({ row }) => {
    const user = row;
    return (
      <div className=" flex items-center gap-2">
        <button
          onClick={() => viewUserDetails(user)}
          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full"
          title={t('actions.viewDetails')}
        >
          <Eye size={16} />
        </button>
        {/* New Level Selector */}
        <Select
          value={user?.sellerLevel}
          onChange={(e) => {
            if (user?.sellerLevel !== e.id) {
              updateUserLevel(user.id, e.id);
            }
          }}
          options={[
            { id: SellerLevel.NEW, name: t('actions.levels.new') },
            { id: SellerLevel.LVL1, name: t('actions.levels.lvl1') },
            { id: SellerLevel.LVL2, name: t('actions.levels.lvl2') },
            { id: SellerLevel.TOP, name: t('actions.levels.top') },
          ]}
          className="!w-40 !text-xs"
          variant="minimal"
        />
        <button
          onClick={() => handleEditClick(user)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
          title={t('actions.editUser')}
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
                {t('actions.activate')}
              </button>
            )}
            {user.status !== 'suspended' && (
              <button
                onClick={() => handleStatusChange(user.id, 'suspended')}
                className="flex items-center w-full px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
              >
                {t('actions.suspend')}
              </button>
            )}
            {user.status !== 'deleted' && (<button
              onClick={() => handleDeleteUser(user.id)}
              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              {t('actions.delete')}
            </button>)}
          </ActionMenuPortal>
        </div>
      </div>
    )
  }

  function handleNavigate() {
    router.push(`/profile/${selectedUser?.id}`)
  }


  return (
    <div>
      <div className=' '>
        {/* Controls */}
        <GlassCard gradient='from-rose-400 via-orange-400 to-amber-400' className='mt-6 mb-6'>
          <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} className=' ' />
            <div className='flex flex-wrap items-center gap-3'>
              <SearchBox placeholder={t('searchPlaceholder')} onSearch={handleSearch} />
              <Select
                className='!w-fit'
                value={filters.sortBy}
                onChange={e => applySortPreset(e)}
                placeholder={t('orderBy')}
                options={[
                  { id: 'newest', name: t('sortOptions.newest') },
                  { id: 'oldest', name: t('sortOptions.oldest') },
                  { id: 'az', name: t('sortOptions.az') },
                  { id: 'za', name: t('sortOptions.za') },
                ]}
              />

              <Select
                className='!w-fit'
                value={filters?.status}
                onChange={e => applyStatusPreset(e)}
                placeholder={t('filterBy')}
                options={[
                  { id: 'all', name: t('filterOptions.all') },
                  { id: 'active', name: t('filterOptions.active') },
                  { id: 'suspended', name: t('filterOptions.suspended') },
                  { id: 'deleted', name: t('filterOptions.deleted') },
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
        <Modal open={showUserModal && (selectedUser || editingUser)} title={editMode ? t('modal.editTitle', { username: editingUser?.username || '' }) : t('modal.title')} onClose={() => {
          setShowUserModal(false);
          setEditMode(false);
          setEditingUser(null);
        }} size='lg' hideFooter>


          {editMode ? (
            // Edit mode using InfoCard
            <>
              <UserBasicInfoForm
                username={editingUser?.username}
                phone={editingUser?.phone}
                countryCode={editingUser?.countryCode}
                onChange={data => setEditingUser(s => ({ ...s, ...data }))}
              />

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
                  countryId: editingUser.countryId,
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
                  {t('modal.cancel')}
                </button>
                <button
                  onClick={() => handleSaveUser(editingUser)}
                  disabled={savingUser || phoneError || usernameError}
                  className='px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50'
                >
                  {savingUser ? t('modal.saving') : t('modal.saveChanges')}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='flex flex-col items-center text-center'>
                  <Img src={selectedUser?.profileImage} alt={selectedUser?.username} altSrc='/images/placeholder-avatar.png' className='w-28 h-28 rounded-full object-cover mb-4 ring-2 ring-white shadow-sm' />
                  <h3 className='text-lg font-semibold text-slate-900 hover:underline cursor-pointer' onClick={handleNavigate}>{selectedUser?.username}</h3>
                  <p className='text-slate-600'>{selectedUser?.email}</p>
                  <div className='mt-4 flex flex-wrap gap-2'>
                    <MetricBadge tone={selectedUser?.status === 'active' ? 'success' : selectedUser?.status === 'suspended' ? 'danger' : 'warning'}>{selectedUser?.status}</MetricBadge>
                    <MetricBadge tone='info'>{selectedUser?.role}</MetricBadge>
                  </div>
                </div>
                <div>
                  <h4 className='font-semibold mb-3 text-slate-900'>{t('modal.userInformation')}</h4>
                  <div className='space-y-2 text-sm text-slate-700'>
                    <p>
                      <span className='font-medium'>{t('modal.memberSince')}</span> {new Date(selectedUser?.memberSince).toLocaleDateString()}
                    </p>
                    <p>
                      <span className='font-medium'>{t('modal.lastLogin')}</span> {selectedUser?.lastLogin ? new Date(selectedUser?.lastLogin).toLocaleString() : t('modal.never')}
                    </p>
                    <p>
                      <span className='font-medium'>{t('modal.description')}</span> {selectedUser?.description || t('modal.noDescription')}
                    </p>
                    <p>
                      <span className='font-medium'>{t('modal.skills')}</span> {selectedUser?.skills?.join(', ') || t('modal.noSkills')}
                    </p>
                    <p>
                      <span className='font-medium'>{t('modal.languages')}</span> {selectedUser?.languages?.join(', ') || t('modal.noLanguages')}
                    </p>
                    <p>
                      <span className='font-medium'>{t('modal.referralCode')}</span> {selectedUser?.referralCode || t('modal.noReferralCode')}
                    </p>
                  </div>
                </div>
              </div>
              <div className='mt-6 flex justify-end gap-3'>
                <button onClick={() => setShowUserModal(false)} className='px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50'>
                  {t('modal.close')}
                </button>
              </div>
            </>
          )}


        </Modal>
      </div>
    </div>
  );
}



function UserBasicInfoForm({ username: initialUsername, phone: initialPhone, countryCode: initialCountryCode, onChange }) {
  const tAuth = useTranslations('auth');
  const tUsers = useTranslations('Dashboard.users');
  const [username, setUsername] = useState(initialUsername || '');
  const [phoneValue, setPhoneValue] = useState(initialPhone || '');
  const [country, setCountry] = useState(initialCountryCode || { code: 'SA', dial_code: '+966' });
  const [usernameError, setUsernameError] = useState(null);
  const [phoneError, setPhoneError] = useState(false);

  // Update parent on change
  useEffect(() => {
    onChange({ username, phone: phoneValue, countryCode: country });
  }, [phoneValue, country]);

  const handleUsernameChange = (value) => {
    setUsername(value.slice(0, 50));
    const msg = validateUsername(value);
    setUsernameError(msg);
  };

  const handlePhoneChange = (val) => {
    setPhoneValue(val.phone);
    setCountry(val.countryCode);
    const invalid = validatPhone(val.phone);
    setPhoneError(invalid);
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        required
        label={tUsers('modal.username')}
        value={username}
        onChange={e => handleUsernameChange(e.target.value)}
        onBlur={e => {
          onChange({ username })
        }}
      />
      {usernameError && <FormErrorMessage message={tAuth(`errors.${usernameError}`)} />}
      <Divider />

      <PhoneInputWithCountry
        value={{ phone: phoneValue, countryCode: country }}
        onChange={handlePhoneChange}
      />
      {phoneError && <FormErrorMessage message={tUsers('validation.invalidPhone')} />}
      <Divider />
    </div>
  );
}