'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, Trash2, Settings as SettingsIcon } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/dashboard/Table/Table';
import api from '@/lib/axios';
import { MetricBadge, Modal, GlassCard } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import Button from '@/components/atoms/Button';
import toast from 'react-hot-toast';
import { getDateAgo } from '@/utils/date';
import Client from '@/components/pages/jobs/Client';
import StatusBadge from '@/components/pages/jobs/StatusBadge';
import { isErrorAbort } from '@/utils/helper';
import SearchBox from '@/components/common/Filters/SearchBox';
import TruncatedText from '@/components/dashboard/TruncatedText';

export default function AdminJobsDashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [orderBy, setOrderBy] = useState({ id: 'newest', name: 'Newest' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  const handleSearch = value => {
    setDebouncedSearch(value);
    setFilters(p => ({ ...p, page: 1 }));
  };

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [current, setCurrent] = useState(null);


  const tabs = [
    { value: 'all', label: 'All Jobs' },
    { value: 'pending', label: 'Pending' }, // NEW
    { value: 'published', label: 'Published' },
    { value: 'awarded', label: 'Awarded' },
    { value: 'completed', label: 'Completed' },
    { value: 'closed', label: 'Closed' },
  ];

  const controllerRef = useRef();
  const fetchJobs = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setApiError(null);

      const q = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: debouncedSearch?.trim(),
        status: ''
      };
      if (activeTab !== 'all') q.status = activeTab;

      const res = await api.get('/jobs/admin', { params: q, signal: controller.signal });

      const data = res.data || {};
      setRows(Array.isArray(data.records) ? data.records : []);
      setTotalCount(Number(data.total_records || 0));
    } catch (e) {
      if (!isErrorAbort(e)) {
        console.error('Error fetching jobs:', e);
        setApiError(e?.response?.data?.message || 'Failed to fetch jobs.');
      }
    } finally {
      if (controllerRef.current === controller)
        setLoading(false);
    }
  }, [activeTab, debouncedSearch?.trim(), filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

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

  const openView = async raw => {

    setCurrent(raw);
    setModalOpen(true);

  };

  const publishJob = async id => {
    const toastId = toast.loading('Publishing job...');

    try {
      await api.put(`/jobs/${id}/publish`);
      toast.success('Job published ✅', { id: toastId });
      await fetchJobs();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error publishing job.', { id: toastId });
    }
  };

  const updateJobStatus = async (id, status) => {
    let toastId;

    try {
      if (status === 'published') {
        return publishJob(id); // already has its own toast
      }

      toastId = toast.loading(`Changing status to ${status}...`);
      await api.put(`/jobs/${id}`, { status });
      toast.success(`Status set to ${status}`, { id: toastId });
      await fetchJobs();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error updating job status.', { id: toastId });
    }
  };

  const deleteJob = async id => {
    const ok = confirm('Delete this job? This cannot be undone.');
    if (!ok) return;

    const toastId = toast.loading('Deleting job...');

    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job deleted', { id: toastId });
      await fetchJobs();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error deleting job.', { id: toastId });
    }
  };

  // Table columns
  const columns = [
    { key: 'title', label: 'Job Title', render: (value) => <TruncatedText text={value?.title} maxLength={300} /> },
    {
      key: 'status',
      label: 'Status',
      render: v => {
        const s = v.status;
        return <StatusBadge status={s} />
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
      render: v => <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs'>{v.proposalsLength || 0}</span>,
    },
    { key: 'created_at', label: 'Created', type: 'date' },
  ];

  const Actions = ({ row }) => (
    <div className='flex items-center gap-2'>
      <button onClick={() => openView(row)} className='p-2 text-blue-600 hover:bg-blue-50 rounded-full' title='View'>
        <Eye size={16} />
      </button>
      <Select
        value={row?.status}
        onChange={e => {
          if (row?.status !== e.id)
            updateJobStatus(row.id, e.id)
        }}
        options={[
          { id: 'pending', name: 'Set Pending' },
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
    <div>
      <div className='p-6'>
        {/* Header with tabs + inline settings toggle */}
        <GlassCard gradient='from-indigo-400 via-blue-400 to-cyan-400' className='mb-6 !overflow-visible'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />

            <div className='flex flex-wrap items-center gap-3'>
              <SearchBox placeholder='Search jobs…' onSearch={handleSearch} />
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


        </GlassCard>

        {apiError && <div className='mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800'>{apiError}</div>}

        <div className='bg-white border border-slate-200 card-glow rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden'>
          <Table data={rows} columns={columns} Actions={Actions} loading={loading} rowsPerPage={filters.limit} page={filters.page} totalCount={totalCount} onPageChange={p => setFilters(prev => ({ ...prev, page: p }))} />
        </div>

        <Modal open={modalOpen} title='Job Details' onClose={() => setModalOpen(false)} size='lg' hideFooter>
          <JobView value={current} onClose={() => setModalOpen(false)} />
        </Modal>
      </div>
    </div>
  );
}

function JobView({ value, onClose }) {
  if (!value) return null;
  const createdAt = value?.created_at;
  const formatted = createdAt
    ? new Date(createdAt).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    : '—';

  return (
    <div className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Job Title</label>
        <div className='p-2 bg-slate-50 rounded-md font-semibold'>{value.title}</div>
      </div>
      <div className='grid grid-cols-1 items-center md:grid-cols-2 gap-4'>

        <div className='text-sm'>{getDateAgo(value?.created_at)}</div>
        <div className='flex gap-2 items-center'>
          <label className='text-sm font-medium text-slate-700'>Status:</label>
          <div className='p-2 bg-slate-50 rounded-md'>
            <MetricBadge tone={value.status === 'completed' ? 'success' : value.status === 'awarded' ? 'success' : value.status === 'published' ? 'info' : value.status === 'closed' ? 'danger' : value.status === 'pending' ? 'neutral' : 'neutral'}>{value.status}</MetricBadge>
          </div>
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Description</label>
        <div className='p-3 bg-slate-50 rounded-md whitespace-pre-wrap'>{value.description}</div>
      </div>

      <Client name={value.buyer?.username} subtitle={value.buyer?.email} id={value.buyer?.id} />

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
          <label className='block text-sm font-medium text-slate-700 mb-1'>Preferred Delivery</label>
          <div className='p-2 bg-slate-50 rounded-md'>{value.preferredDeliveryDays} days</div>
        </div>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Proposals</label>
          <div className='p-2 bg-slate-50 rounded-md'>{value.proposals?.length || 0} proposals</div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>


        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Posted</label>
          <div className='p-2 bg-slate-50 rounded-md'>{formatted}</div>
        </div>

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

      {value?.additionalInfo && (
        <section>
          <h4 className='text-sm font-semibold text-slate-900 mb-2'>Additional Details</h4>
          <p className='text-sm text-slate-700 whitespace-pre-wrap'>{value?.additionalInfo}</p>
        </section>
      )}

      <div className='flex justify-end'>
        <Button color='white' name='Close' onClick={onClose} className='!w-fit'>
          Close
        </Button>
      </div>
    </div>
  );
}
