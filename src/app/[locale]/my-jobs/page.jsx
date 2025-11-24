// MyJobsPage.jsx (light mode focused)
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { deleteJob, getMyJobs, updateJob } from '@/services/jobService';

import NoResults from '@/components/common/NoResults';
import Button from '@/components/atoms/Button';
import TabsPagination from '@/components/common/TabsPagination';
import { Modal } from '@/components/common/Modal';
import Tabs from '@/components/common/Tabs';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { fmtMoney, isErrorAbort, updateUrlParams } from '@/utils/helper';
import { usePathname } from '@/i18n/navigation';
import JobCard, { JobSkeleton } from '@/components/pages/my-jobs/JobCard';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, CheckCircle2, CircleX, FolderOpen, X } from 'lucide-react';
import AttachmentList from '@/components/common/AttachmentList';
import api from '@/lib/axios';


// -------------------------------------------------
// Helpers
// -------------------------------------------------


const initials = name =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('');


// -------------------------------------------------
// Page
// -------------------------------------------------
export default function MyJobsPage() {
  const t = useTranslations('MyJobs.page');
  const tabs = [
    { label: t('tabs.all'), value: 'all' },
    // { label: 'Draft', value: 'draft' },
    { label: t('tabs.pending'), value: 'pending' },
    { label: t('tabs.published'), value: 'published' },
    { label: t('tabs.awarded'), value: 'awarded' },
    { label: t('tabs.completed'), value: 'completed' },
  ]


  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab')
    if (!tab || !tabs.some(t => t.value === tab)) return 'all'; else tab;

  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [loadingJobId, setLoadingJobId] = useState(null);


  function handleChangeTab(tab) {
    setActiveTab(tab)
    const saved = sessionStorage.getItem('itemsPerPage');
    if (saved) setItemsPerPage(Number(saved));
    setCurrentPage(1);
  }


  useEffect(() => {
    if (!activeTab) return;

    const params = new URLSearchParams();
    params.set('tab', activeTab);
    updateUrlParams(pathname, params);
  }, [activeTab]);


  const paramsTab = searchParams.get('tab') ?? '';
  useEffect(() => {
    if (!paramsTab || !tabs.some(t => t.value === paramsTab)) return;

    handleChangeTab(paramsTab);
  }, [paramsTab]);
  const controllerRef = useRef();
  useEffect(() => {
    loadJobs(currentPage);
  }, [currentPage, itemsPerPage, activeTab]);

  const loadJobs = async (page = 1) => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      const response = await getMyJobs(activeTab === 'all' ? '' : activeTab, page, itemsPerPage, controller.signal);
      setJobs(response.records);
      setTotalPages(Math.ceil(response.total_records / response.per_page));
    } catch (e) {
      if (!isErrorAbort(e))
        console.error('Error loading jobs:', e);
    } finally {
      if (controllerRef.current === controller)
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

  const onPublishToggle = async (id, status) => {
    const next = status === 'draft' ? 'published' : 'draft';

    try {
      setLoadingJobId(id);
      await updateJob(id, { status: next });
      setJobs(prev =>
        prev.map(j => (j.id === id ? { ...j, status: next } : j))
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || t('errors.failedToUpdateStatus'));
    }
    finally {
      setLoadingJobId(null);
    }
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


  // Drawer state
  // keep job id in sync with URL
  const jobIdFromUrl = searchParams.get('job') || null;
  const [drawerOpen, setDrawerOpen] = useState(!!jobIdFromUrl);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(jobIdFromUrl);

  const jobId = searchParams.get('job') || null;
  useEffect(() => {
    if (jobId !== selectedJobId) {
      setSelectedJobId(jobId)

      if (jobId)
        setDrawerOpen(true);
    }

  }, [jobId]);

  const openDrawerForJob = async job => {
    try {
      setSelectedJob(job);
      setSelectedJobId(job?.id)
      setDrawerOpen(true);
    } catch (e) {
      toast.error(e?.response?.data?.message || t('errors.unableToOpen'));
    }
  };

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedJob(null);
    setSelectedJobId(null);
  }



  useEffect(() => {
    const params = new URLSearchParams();
    // keep job id in URL when a job is selected
    if (selectedJobId) {
      if (selectedJobId) params.set('job', String(selectedJobId));
    } else {
      params.delete('job');
    } updateUrlParams(pathname, params);
  }, [selectedJobId]);



  return (
    <div className='container !mb-12'>
      <div className='mt-8 mb-4 flex items-center justify-between'>
        <h1 className='text-3xl font-bold max-md:text-xl'>{t('title')}</h1>
        <Button name={t('createNewJob')} className='max-w-fit' href='share-job-description' />
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={handleChangeTab}
        className='max-w-full'
      />

      <div className='mt-6 grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3'>

        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <JobSkeleton key={i} />)
        ) : jobs.length > 0 ? (
          jobs.map(job => <JobCard onOpen={() => openDrawerForJob(job)} key={job.id} activeTab={activeTab} loadingJobId={loadingJobId} job={job} onPublishToggle={onPublishToggle} onDeleteRequest={confirmDelete} />)
        ) : (
          <div className='md:col-span-2 lg:col-span-3'>
            <NoResults mainText={t('noJobs')} additionalText={t('noJobsDescription')} buttonText={t('createNewJobButton')} buttonLink='/share-job-description' />
          </div>
        )}
      </div>

      <TabsPagination loading={loading} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} itemsPerPage={itemsPerPage}
        options={[
          { id: 5, name: '5' },
          { id: 10, name: '10' },
          { id: 12, name: '12' },
          { id: 20, name: '20' },
          { id: 50, name: '50' },
        ]} />

      {isConfirmDelete && (
        <Modal onClose={() => setIsConfirmDelete(false)} title={t('deleteConfirm')}>
          <div className='mt-8 flex gap-4'>
            <Button name={t('cancel')} onClick={cancelDelete} />
            <Button name={t('delete')} color='red' onClick={() => handleDeleteJob(jobToDelete)} loading={isDeleteLoading} />
          </div>
        </Modal>
      )}

      {/* Drawer (details + apply) */}
      <JobDrawer
        open={drawerOpen}
        job={selectedJob}
        jobId={selectedJobId}
        onClose={closeDrawer} />
    </div>
  );
}



function JobDrawer({ open, onClose, job, jobId }) {
  const t = useTranslations('MyJobs.page');
  const [localJob, setLocalJob] = useState(job);
  const [jobLoading, setJobLoading] = useState(false);

  useEffect(() => {

    if (!job) return;

    if (job?.id !== localJob?.Id) {
      setLocalJob(job);
    }
  }, [job])
  // synchronize when parent provides an object job
  useEffect(() => {

    if (!jobId) return;

    if (job?.id === jobId) {
      return;
    }

    let mounted = true;
    const fetchJob = async id => {
      setJobLoading(true);
      try {
        const res = await api.get(`/jobs/${id}`);
        if (!mounted) return;
        // support both API shapes
        const j = res?.data?.job ?? res?.data ?? null;
        setLocalJob(j);
      } catch (err) {
        console.error(err);
        toast.error(err?.response?.data?.message || t('errors.failedToLoadJob'));
        setLocalJob(null);
      } finally {
        if (mounted) setJobLoading(false);
      }
    };
    fetchJob(String(jobId));
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const budget = localJob?.budget ?? localJob?.estimatedBudget;
  const priceType = localJob?.budgetType === 'hourly' ? t('hourly') : t('fixedPrice');

  const created = (localJob?.created_at || '').split('T')[0];
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div className='fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40' onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

          {/* Drawer */}
          <motion.aside className='fixed inset-y-0 left-0 z-50 w-full max-w-[560px] bg-white shadow-2xl flex flex-col' initial={{ x: -580 }} animate={{ x: 0 }} exit={{ x: -580 }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
            {jobLoading ? (
              <JobDrawerSkeleton onClose={onClose} />
            ) : (
              <>
                {/* Header */}
                <div className='flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200'>
                  <div className='flex items-center flex-wrap gap-3'>
                    <h3 className='text-lg font-semibold text-slate-900 line-clamp-1'>{localJob?.title || t('jobDetails')}</h3>

                  </div>
                  <button onClick={onClose} className='rounded-full p-2 hover:bg-slate-100'>
                    <X className='h-5 w-5 text-slate-700' />
                  </button>
                </div>

                {/* Scrollable body */}
                <div className='flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6'>
                  {/* Summary */}
                  {localJob?.description && (
                    <section>
                      <h4 className='text-sm font-semibold text-slate-900 mb-2'>{t('summary')}</h4>

                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {localJob?.description}
                      </p>

                    </section>
                  )}


                  {/* Basic meta */}
                  <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Budget + Price Type */}
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-slate-900 font-semibold">{fmtMoney(budget)}</div>
                      <div className="text-xs text-slate-500">{priceType}</div>
                    </div>

                    {/* Preferred Delivery */}
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-slate-900 font-semibold">
                        {localJob?.preferredDeliveryDays} {localJob?.preferredDeliveryDays === 1 ? t('day') : t('days')}
                      </div>
                      <div className="text-xs text-slate-500">{t('preferredDelivery')}</div>
                    </div>
                  </section>

                  {/* Skills */}
                  {Array.isArray(localJob?.skillsRequired) && localJob?.skillsRequired.length > 0 && (
                    <section>
                      <h4 className='text-sm font-semibold text-slate-900 mb-2'>{t('skillsAndExpertise')}</h4>
                      <div className='flex flex-wrap gap-2'>
                        {localJob?.skillsRequired.map((s, i) => (
                          <span key={i} className='inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold border border-slate-200'>
                            {s}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Client */}
                  <section>
                    <h4 className='text-sm font-semibold text-slate-900 mb-2'>{t('aboutTheClient')}</h4>
                    <div className='mt-3 space-y-2 text-sm'>
                      <div className='flex items-center gap-2'>

                      </div>
                      <div className='flex items-center gap-2 text-slate-700'>
                        <CalendarDays className='h-4 w-4' />
                        <span>{t('posted')} {created || '—'}</span>
                      </div>
                    </div>
                  </section>

                  {/* Attachments */}
                  {Array.isArray(localJob?.attachments) && localJob?.attachments.length > 0 && (
                    <section>
                      <h4 className='text-sm font-semibold text-slate-900 mb-2'>{t('attachments')}</h4>
                      <div className='rounded-xl border border-slate-200 p-3'>
                        <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800'>
                          <FolderOpen className='h-4 w-4' /> {t('files')}
                        </div>
                        <AttachmentList attachments={localJob?.attachments} />
                      </div>
                    </section>
                  )}
                  {/* additionalInfo */}
                  {localJob?.additionalInfo && (
                    <section>
                      <h4 className='text-sm font-semibold text-slate-900 mb-2'>{t('additionalDetails')}</h4>
                      <p className='text-sm text-slate-700 whitespace-pre-wrap'>{localJob?.additionalInfo}</p>
                    </section>
                  )}
                </div>
              </>)}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}



function JobDrawerSkeleton({ onClose }) {
  return (
    <div className="space-y-6 animate-pulse p-4">
      {/* header */}
      <div className='flex items-center justify-between  pb-4 border-b border-slate-200'>

        <div className="h-6 w-2/3 bg-slate-200 rounded" />

        <button onClick={onClose} className='rounded-full p-2 hover:bg-slate-100'>
          <X className='h-5 w-5 text-slate-700' />
        </button>
      </div>

      {/* summary */}
      <div className="space-y-2">
        <div className="h-4 w-1/3 bg-slate-200 rounded" />
        <div className="h-3 w-full bg-slate-200 rounded" />
        <div className="h-3 w-full bg-slate-200 rounded" />
        <div className="h-3 w-full bg-slate-200 rounded" />

        <div className="h-3 w-5/6 bg-slate-200 rounded" />
      </div>

      {/* meta grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="h-5 w-24 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-16 bg-slate-200 rounded" />
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="h-5 w-20 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
        </div>
      </div>

      {/* skills */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 w-20 bg-slate-200 rounded-full" />
        ))}
      </div>

      {/* client */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-4 w-36 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
        </div>
      </div>

      {/* attachments */}
      <div className="rounded-xl border border-slate-200 p-3 space-y-2">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="h-8 w-full bg-slate-200 rounded" />
      </div>

      {/* additional info */}
      <div className="h-12 w-full bg-slate-200 rounded" />
    </div>
  );
}