// MyJobsPage.jsx (light mode focused)
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { deleteJob, getMyJobs, updateJob } from '@/services/jobService';
import TabList from '@/components/atoms/TabList';
import PriceTag from '@/components/atoms/priceTag';
import { ItemSkills } from '../share-job-description/page';
import NoResults from '@/components/common/NoResults';
import { Divider } from '../services/[category]/[service]/page';
import AttachmentList from '@/components/common/AttachmentList';
import Button from '@/components/atoms/Button';
import TabsPagination from '@/components/common/TabsPagination';
import { Modal } from '@/components/common/Modal';
import { Switcher } from '@/components/atoms/Switcher';
import { CalendarDays, Mail, User2, Trash2, FolderOpen, ChevronRight } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import toast from 'react-hot-toast';

// -------------------------------------------------
// Visual Tokens (light mode only)
// -------------------------------------------------
const cardBase = ' !bg-gray-50/50 group relative overflow-hidden rounded-2xl border border-gray-200 bg-white  ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-[2px]';

const ribbonBar = 'absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 opacity-80';

const chip = 'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700';

// -------------------------------------------------
// Skeleton Loader (light mode)
// -------------------------------------------------
export const JobSkeleton = () => (
  <div className={cardBase + ' animate-pulse'}>
    <div className={ribbonBar} />
    <div className='p-6 sm:p-7'>
      <div className='h-6 w-2/3 rounded bg-slate-200' />
      <div className='mt-3 h-4 w-full rounded bg-slate-200' />
      <div className='mt-2 h-4 w-5/6 rounded bg-slate-200' />
      <div className='mt-5 flex gap-2'>
        <div className='h-6 w-24 rounded-full bg-slate-200' />
        <div className='h-6 w-20 rounded-full bg-slate-200' />
      </div>
      <Divider className='!my-6' />
      <div className='grid grid-cols-2 gap-4'>
        <div className='h-10 rounded bg-slate-200' />
        <div className='h-10 rounded bg-slate-200' />
      </div>
      <div className='mt-6 h-9 w-40 rounded bg-slate-200' />
    </div>
  </div>
);

// -------------------------------------------------
// Helpers
// -------------------------------------------------
const getStatusStyles = status => {
  switch (status) {
    case 'published':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'draft':
      return 'bg-slate-50 text-slate-700 border-slate-200';
    case 'awarded':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'completed':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const initials = name =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('');

// -------------------------------------------------
// Job Card
// -------------------------------------------------
const JobCard = ({ job, onPublishToggle, activeTab, onDeleteRequest }) => {
  const created = useMemo(() => job?.created_at?.split('T')[0] ?? '—', [job?.created_at]);
  const buyerInitials = useMemo(() => initials(job?.buyer?.username), [job?.buyer?.username]);

  return (
    <article className={cardBase}>
      <div className={ribbonBar} />

      {/* Top Content */}
      <div className='p-6 sm:p-7 !pb-24'>
        {/* Title */}
        <header className='flex items-start justify-between gap-3'>
          <h2 className='text-xl sm:text-2xl font-semibold tracking-tight text-slate-900'>{job.title}</h2>
          <span className={chip + ' ' + getStatusStyles(job.status)}>
            <span className='h-2 w-2 rounded-full bg-current opacity-70 [color:currentColor]' />
            <span className='capitalize'>{job.status}</span>
          </span>
        </header>

        {/* Description */}
        {job.description && <p className='mt-2 line-clamp-3 text-slate-600'>{job.description}</p>}

        {/* Skills & Budget */}
        <div className='mt-5 space-y-3'>
          {job?.skillsRequired?.length ? <ItemSkills cnLabel='max-w-fit text-sm !font-normal' label='Tech' value={job.skillsRequired} /> : null}

          <div className='flex flex-wrap items-center gap-3'>
            <span className='text-sm text-slate-500'>Budget</span>
            <span className={chip + ' !py-[6px]'}>
              <PriceTag color='green' price={job.budget} />
            </span>
            <span className='text-sm text-slate-500'>Created</span>
            <span className={chip + ' !py-[6px]'}>
              <CalendarDays className='h-4 w-4' />
              <span className='tabular-nums'>{created}</span>
            </span>
          </div>
        </div>

        <Divider className='!my-6' />

        {/* Buyer & Publish Toggle */}
        <section className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <div className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200'>
              <span className='text-sm font-semibold'>{buyerInitials}</span>
            </div>
            <div className='min-w-0'>
              <div className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
                <User2 className='h-4 w-4 opacity-70' /> {job?.buyer?.username}
              </div>
              <div className='mt-0.5 flex items-center gap-2 truncate text-sm text-slate-600'>
                <Mail className='h-4 w-4 opacity-70' />
                <span className='truncate'>{job?.buyer?.email}</span>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {(job.status === 'draft' || job.status === 'published') && (
              <div className={chip + ' !py-[6px] !pr-4'}>
                <span className='text-xs text-slate-500'>Draft</span>
                <Switcher checked={job.status === 'published'} onChange={() => onPublishToggle(job.id, job.status)} />
                <span className='text-xs text-slate-500'>Publish</span>
              </div>
            )}
          </div>
        </section>

        {/* Attachments */}
        {Array.isArray(job?.attachments) && job.attachments.length > 0 && (
          <div className='mt-5 rounded-xl border border-slate-200 p-3'>
            <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800'>
              <FolderOpen className='h-4 w-4' /> Attachments
            </div>
            <AttachmentList attachments={job.attachments} />
          </div>
        )}
      </div>

      {/* Footer Actions (pinned) */}
      <footer className='absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200'>
        <Button href={`/my-jobs/${job.id}/proposals`} name={`View Proposals (${job.proposals?.length || 0})`} className='min-w-[170px]' />
        <div className='flex items-center gap-2'>
          {/* <Button variant='ghost' className='!px-3' href={`/my-jobs/${job.id}`} name='Details' rightIcon={<ChevronRight className='h-4 w-4' />} /> */}
          <Button onClick={() => onDeleteRequest(job.id)} color='red' name='Cancel' leftIcon={<Trash2 className='h-4 w-4' />} />
        </div>
      </footer>

      {/* Focus ring */}
      <div className='pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5 transition-opacity group-hover:opacity-100' />
    </article>
  );
};

// -------------------------------------------------
// Page
// -------------------------------------------------
export default function MyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('itemsPerPage');
    if (saved) setItemsPerPage(Number(saved));
    setCurrentPage(1);
    loadJobs(1);
  }, [activeTab]);

  useEffect(() => {
    loadJobs(currentPage);
  }, [currentPage, itemsPerPage]);

  const loadJobs = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getMyJobs(activeTab === 'all' ? '' : activeTab, page, itemsPerPage);
      setJobs(response.records);
      setTotalPages(Math.ceil(response.total_records / response.per_page));
    } catch (e) {
      console.error('Error loading jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = page => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = size => {
    setItemsPerPage(size);
    sessionStorage.setItem('itemsPerPage', String(size));
    setCurrentPage(1);
  };

  const onPublishToggle = (id, status) => {
    const next = status === 'draft' ? 'published' : 'draft';
    updateJob(id, { status: next })
      .then(res => {
        setJobs(prev => prev.map(j => (j.id === id ? { ...j, status: next } : j)));
      })
      .catch(err => {
        toast.error(err.response.data.message);
      });
  };

  const confirmDelete = id => {
    setJobToDelete(id);
    setIsConfirmDelete(true);
  };

  const cancelDelete = () => setIsConfirmDelete(false);

  const handleDeleteJob = async id => {
    if (!id) return;
    try {
      setIsDeleteLoading(true);
      await deleteJob(id);
      setJobs(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      console.error('Error deleting job:', e);
    } finally {
      setIsDeleteLoading(false);
      setIsConfirmDelete(false);
    }
  };

  return (
    <div className='container !mb-12'>
      <div className='mt-8 mb-4 flex items-center justify-between'>
        <h1 className='text-3xl font-bold max-md:text-xl'>My Jobs</h1>
        <Button name='Create New Job' className='max-w-fit' href='share-job-description' />
      </div>

      <Tabs
        tabs={[
          { label: 'All', value: 'all' },
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
          { label: 'Awarded', value: 'awarded' },
          { label: 'Completed', value: 'completed' },
        ]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className='mt-6 grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => <JobSkeleton key={i} />)
        ) : jobs.length > 0 ? (
          jobs.map(job => <JobCard key={job.id} activeTab={activeTab} job={job} onPublishToggle={onPublishToggle} onDeleteRequest={confirmDelete} />)
        ) : (
          <div className='md:col-span-2 lg:col-span-3'>
            <NoResults mainText='No jobs available at the moment' additionalText='Looks like no jobs are available right now. Check back later!' buttonText='Create a New Job' buttonLink='/share-job-description' />
          </div>
        )}
      </div>

      <TabsPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} itemsPerPage={itemsPerPage} />

      {isConfirmDelete && (
        <Modal onClose={() => setIsConfirmDelete(false)} title={'Are you sure you want to delete this job?'}>
          <div className='mt-8 flex gap-4'>
            <Button name='Cancel' onClick={cancelDelete} />
            <Button name='Delete' color='red' onClick={() => handleDeleteJob(jobToDelete)} loading={isDeleteLoading} />
          </div>
        </Modal>
      )}
    </div>
  );
}
