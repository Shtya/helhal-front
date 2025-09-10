'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Trash2, Clock, CheckCircle, XCircle, Users, DollarSign, Settings as SettingsIcon } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/dashboard/Table/Table';
import api from '@/lib/axios';
import DashboardLayout from '@/components/dashboard/Layout';
import { MetricBadge, Modal, GlassCard } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import { Switcher } from '@/components/atoms/Switcher';
import toast from 'react-hot-toast';

export default function AdminJobsDashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [orderBy, setOrderBy] = useState({ id: 'newest', name: 'Newest' });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  // Settings (inline toggle)
  const [jobsRequireApproval, setJobsRequireApproval] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const tabs = [
    { value: 'all', label: 'All Jobs' },
    { value: 'pending', label: 'Pending' }, // NEW
    { value: 'draft', label: 'Drafts' },
    { value: 'published', label: 'Published' },
    { value: 'awarded', label: 'Awarded' },
    { value: 'completed', label: 'Completed' },
    { value: 'closed', label: 'Closed' },
  ];

  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const res = await api.get('/settings');
      setJobsRequireApproval(!!res?.data?.jobsRequireApproval);
    } catch (e) {
       toast.error(e?.response?.data?.message || 'Failed to load platform settings');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const updateJobsApproval = async autoPublishEnabled => {
    const nextValue = !autoPublishEnabled;
    try {
      await api.put('/settings', { jobsRequireApproval: nextValue });
      setJobsRequireApproval(nextValue);
      toast.success(nextValue ? 'Jobs now require admin approval (status = pending on creation).' : 'Jobs will be auto-published on creation.');
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Failed to update job approval setting');
    }
  };

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);

      const q = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: debouncedSearch,
				filters : {status : ""}
      };
      if (activeTab !== 'all') q.filters.status = activeTab;

      const res = await api.get('/jobs', { params: q });

      const data = res.data || {};
      setRows(Array.isArray(data.records) ? data.records : []);
      setTotalCount(Number(data.total_records || 0));
    } catch (e) {
      console.error('Error fetching jobs:', e);
      setApiError(e?.response?.data?.message || 'Failed to fetch jobs.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleTabChange = tab => {
    const v = typeof tab === 'string' ? tab : tab?.value;
    setActiveTab(v);
    setFilters(p => ({ ...p, page: 1 }));
  };

  const applySortPreset = opt => {
    setOrderBy(opt);
    const id = opt?.id;
    if (id === 'newest') setFilters(p => ({ ...p, sortBy: 'created_at', sortOrder: 'DESC', page: 1 }));
    if (id === 'oldest') setFilters(p => ({ ...p, sortBy: 'created_at', sortOrder: 'ASC', page: 1 }));
    if (id === 'budget_high') setFilters(p => ({ ...p, sortBy: 'budget', sortOrder: 'DESC', page: 1 }));
    if (id === 'budget_low') setFilters(p => ({ ...p, sortBy: 'budget', sortOrder: 'ASC', page: 1 }));
  };

  const openView = async id => {
    try {
      setApiError(null);
      const res = await api.get(`/jobs/${id}`);
      setCurrent(res.data);
      setModalOpen(true);
    } catch (e) {
      setApiError(e?.response?.data?.message || 'Failed to load job.');
    }
  };

  const publishJob = async id => {
    try {
      await api.put(`/jobs/${id}/publish`);
      toast.success('Job published ✅');
      await fetchJobs();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error publishing job.');
    }
  };

  const updateJobStatus = async (id, status) => {
    try {
      // Publishing goes through the admin-only endpoint
      if (status === 'published') {
        return publishJob(id);
      }
      await api.put(`/jobs/${id}`, { status });
      toast.success(`Status set to ${status}`);
      await fetchJobs();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error updating job status.');
    }
  };

  const deleteJob = async id => {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job deleted');
      await fetchJobs();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error deleting job.');
    }
  };

  // Table columns
  const columns = [
    { key: 'title', label: 'Job Title' },
    {
      key: 'status',
      label: 'Status',
      render: v => {
        const s = v.status;
        const tone = s === 'completed' ? 'success' : s === 'awarded' ? 'success' : s === 'published' ? 'info' : s === 'closed' ? 'danger' : s === 'pending' ? 'amber' : 'neutral';
        const icons = {
          pending: <Clock size={14} className='mr-1' />,
          draft: <Clock size={14} className='mr-1' />,
          published: <Users size={14} className='mr-1' />,
          awarded: <CheckCircle size={14} className='mr-1' />,
          completed: <CheckCircle size={14} className='mr-1' />,
          closed: <XCircle size={14} className='mr-1' />,
        };
        return (
          <MetricBadge tone={tone}>
            {icons[s] || null} {s}
          </MetricBadge>
        );
      },
    },
    {
      key: 'budget',
      label: 'Budget',
      render: v => `$${v.budget}`,
    },
    {
      key: 'budgetType',
      label: 'Type',
      render: v => <MetricBadge tone='neutral'>{v.budgetType}</MetricBadge>,
    },
    {
      key: 'buyer',
      label: 'Posted By',
      render: v => v.buyer?.username || 'N/A',
    },
    {
      key: 'proposals',
      label: 'Proposals',
      render: v => <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs'>{v.proposals?.length || 0}</span>,
    },
    { key: 'created_at', label: 'Created', type: 'date' },
  ];

  const actions = row => (
    <div className='flex items-center gap-2'>
      <button onClick={() => openView(row.id)} className='p-2 text-blue-600 hover:bg-blue-50 rounded-full' title='View'>
        <Eye size={16} />
      </button>
      <Select
        value={row.status}
        onChange={e => updateJobStatus(row.id, e.id)}
        options={[
          { id: 'pending', name: 'Set Pending' },  
          { id: 'draft', name: 'Set Draft' },
          { id: 'published', name: 'Publish' }, // calls /publish
          { id: 'awarded', name: 'Mark Awarded' },
          { id: 'completed', name: 'Complete' },
          { id: 'closed', name: 'Close' },
        ]}
        className='!w-40 !text-xs'
        variant='minimal'
      />
      <button onClick={() => deleteJob(row.id)} className='p-2 text-red-600 hover:bg-red-50 rounded-full' title='Delete'>
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <DashboardLayout className='min-h-screen bg-gradient-to-b from-white via-slate-50 to-white'>
      <div className='p-6'>
        {/* Header with tabs + inline settings toggle */}
        <GlassCard gradient='from-indigo-400 via-blue-400 to-cyan-400' className='mb-6 !overflow-visible'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />

            <div className='flex flex-wrap items-center gap-3'>
              <Input iconLeft={<Search size={16} />} className='!w-fit' value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder='Search jobs…' />
              <Select
                className='!w-fit'
                onChange={applySortPreset}
                value={orderBy.id}
                placeholder='Order by'
                options={[
                  { id: 'newest', name: 'Newest' },
                  { id: 'oldest', name: 'Oldest' },
                  { id: 'budget_high', name: 'Budget: High to Low' },
                  { id: 'budget_low', name: 'Budget: Low to High' },
                ]}
              />
            </div>
          </div>

          {/* Inline jobs approval switch (admin-level) */}
          <div className='mt-4 flex items-center justify-between rounded-lg bg-white/60 p-3'>
            <div className='flex items-center gap-2'>
              <SettingsIcon size={18} className='text-indigo-600' />
              <div>
                <div className='text-sm font-semibold text-slate-800'>Job Approval Required</div>
                <div className='text-xs text-slate-600'>
                  If ON, new jobs are saved as <b>pending</b> until an admin publishes them.
                </div>
              </div>
            </div>
            <Switcher
              checked={!jobsRequireApproval} // checked = auto-publish
              onChange={updateJobsApproval}
              disabled={settingsLoading}
            />
          </div>
        </GlassCard>

        {apiError && <div className='mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800'>{apiError}</div>}

        <div className='bg-white border border-slate-200 card-glow rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden'>
          <Table data={rows} columns={columns} actions={actions} loading={loading} rowsPerPage={filters.limit} page={filters.page} totalCount={totalCount} onPageChange={p => setFilters(prev => ({ ...prev, page: p }))} />
        </div>

        <Modal open={modalOpen} title='Job Details' onClose={() => setModalOpen(false)} size='lg' hideFooter>
          <JobView value={current} onClose={() => setModalOpen(false)} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}

function JobView({ value, onClose }) {
  if (!value) return null;

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Job Title</label>
          <div className='p-2 bg-slate-50 rounded-md font-semibold'>{value.title}</div>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Status</label>
          <div className='p-2 bg-slate-50 rounded-md'>
            <MetricBadge tone={value.status === 'completed' ? 'success' : value.status === 'awarded' ? 'success' : value.status === 'published' ? 'info' : value.status === 'closed' ? 'danger' : value.status === 'pending' ? 'amber' : 'neutral'}>{value.status}</MetricBadge>
          </div>
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Description</label>
        <div className='p-3 bg-slate-50 rounded-md whitespace-pre-wrap'>{value.description}</div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Budget</label>
          <div className='p-2 bg-slate-50 rounded-md font-semibold'>${value.budget}</div>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Budget Type</label>
          <div className='p-2 bg-slate-50 rounded-md'>{value.budgetType}</div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Posted By</label>
          <div className='p-2 bg-slate-50 rounded-md'>{value.buyer?.username || 'N/A'}</div>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Proposals</label>
          <div className='p-2 bg-slate-50 rounded-md'>{value.proposals?.length || 0} proposals</div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Preferred Delivery</label>
          <div className='p-2 bg-slate-50 rounded-md'>{value.preferredDeliveryDays} days</div>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Skills Required</label>
          <div className='p-2 bg-slate-50 rounded-md'>
            {value.skillsRequired?.map((skill, i) => (
              <span key={i} className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1'>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {value.attachments?.length > 0 && (
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Attachments</label>
          <div className='p-3 bg-slate-50 rounded-md'>
            {value.attachments.map((a, i) => (
              <div key={i} className='flex items-center justify-between py-2 border-b last:border-b-0'>
                <span className='text-sm'>{a.name}</span>
                <a href={a.url} target='_blank' rel='noopener noreferrer' className='text-blue-600 hover:underline text-sm'>
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='flex justify-end'>
        <Button color='white' name='Close' onClick={onClose} className='!w-fit'>
          Close
        </Button>
      </div>
    </div>
  );
}
