// MyJobsPage.jsx (light mode focused)
'use client';

import React, { useEffect, useState } from 'react';
import { deleteJob, getMyJobs, updateJob } from '@/services/jobService';

import NoResults from '@/components/common/NoResults';
import Button from '@/components/atoms/Button';
import TabsPagination from '@/components/common/TabsPagination';
import { Modal } from '@/components/common/Modal';
import Tabs from '@/components/common/Tabs';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { updateUrlParams } from '@/utils/helper';
import { usePathname } from '@/i18n/navigation';
import JobCard, { JobSkeleton } from '@/components/pages/my-jobs/JobCard';


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
  const tabs = [
    { label: 'All', value: 'all' },
    // { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'Published', value: 'published' },
    { label: 'Awarded', value: 'awarded' },
    { label: 'Completed', value: 'completed' },
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  useEffect(() => {
    loadJobs(currentPage);
  }, [currentPage, itemsPerPage, activeTab]);

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

  const onPublishToggle = async (id, status) => {
    const next = status === 'draft' ? 'published' : 'draft';

    try {
      setLoadingJobId(id);
      await updateJob(id, { status: next });
      setJobs(prev =>
        prev.map(j => (j.id === id ? { ...j, status: next } : j))
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update job status');
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

  return (
    <div className='container !mb-12'>
      <div className='mt-8 mb-4 flex items-center justify-between'>
        <h1 className='text-3xl font-bold max-md:text-xl'>My Jobs</h1>
        <Button name='Create New Job' className='max-w-fit' href='share-job-description' />
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
          jobs.map(job => <JobCard key={job.id} activeTab={activeTab} loadingJobId={loadingJobId} job={job} onPublishToggle={onPublishToggle} onDeleteRequest={confirmDelete} />)
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


function Skill({ label, value, cnLabel }) {
  return (
    <div className='flex items-center gap-4 '>
      {label && <div className={`text-base text-slate-500 font-semibold w-full max-w-[140px] ${cnLabel}`}>{label}</div>}
      <div className='flex flex-wrap gap-2'>
        {value?.map((skill, index) => (
          <span key={index} className='bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium flex items-center'>
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
