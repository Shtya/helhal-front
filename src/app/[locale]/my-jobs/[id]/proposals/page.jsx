'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getJobProposals, updateProposalStatus } from '@/services/jobService';
import { toast } from 'react-hot-toast';
import TabsPagination from '@/components/common/TabsPagination';
import NoResults from '@/components/common/NoResults';
import AttachmentList from '@/components/common/AttachmentList';

// Improved Skeleton Loader
const SkeletonLoader = () => (
  <div className='space-y-6'>
    {[...Array(3)].map((_, idx) => (
      <div key={idx} className='bg-white rounded-lg shadow-lg p-6 animate-pulse'>
        <div className='flex justify-between items-start mb-4'>
          <div className='flex items-center gap-4'>
            <div className='w-16 h-16 bg-gray-300 rounded-full'></div>
            <div className='space-y-2'>
              <div className='h-5 bg-gray-300 rounded w-32'></div>
              <div className='h-4 bg-gray-300 rounded w-24'></div>
              <div className='h-4 bg-gray-300 rounded w-40'></div>
            </div>
          </div>
          <div className='space-y-2'>
            <div className='h-7 bg-gray-300 rounded w-20 ml-auto'></div>
            <div className='h-4 bg-gray-300 rounded w-28 ml-auto'></div>
          </div>
        </div>
        <div className='space-y-2 mt-4'>
          <div className='h-4 bg-gray-300 rounded w-full'></div>
          <div className='h-4 bg-gray-300 rounded w-5/6'></div>
          <div className='h-4 bg-gray-300 rounded w-4/6'></div>
        </div>
        <div className='flex justify-between items-center mt-6'>
          <div className='h-6 bg-gray-300 rounded w-20'></div>
          <div className='flex gap-3'>
            <div className='h-10 bg-gray-300 rounded w-24'></div>
            <div className='h-10 bg-gray-300 rounded w-24'></div>
            <div className='h-10 bg-gray-300 rounded w-28'></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Proposal Card Component
const ProposalCard = ({ proposal, onStatusUpdate }) => {
  const getStatusColor = status => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
 
  return (
    <div className='bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-gray-100'>
      <div className='flex flex-col md:flex-row justify-between items-start gap-4 mb-5'>
        <div className='flex items-center gap-4'>
          <div className='w-14 h-14 rounded-full flex items-center justify-center gradient text-white border-2 border-gray-200 transition-transform hover:scale-105'>
            <span className='text-xl capitalize font-bold'>{proposal.seller.username[0].toUpperCase()}</span>
          </div>
          <div>
            <h3 className='font-semibold text-lg text-gray-900'>{proposal.seller.username}</h3>
            <h3 className='font-semibold text-sm text-gray-900'>{proposal.seller.email}</h3>
          </div>
        </div>

        <div className='text-right'>
          <p className='text-2xl font-bold text-green-600'>${proposal.bidAmount}</p>
          <p className='text-gray-600 text-sm'>{proposal.estimatedTimeDays} days delivery</p>
        </div>
      </div>

      <div className='mb-5'>
        <h4 className='font-[600] text-gray-900 mb-1'>Cover Letter</h4>
        <p className='text-gray-700 leading-relaxed'>{proposal.coverLetter}</p>
      </div>

      {proposal.attachments.length > 0 && (
        <div className='mb-5'>
          <h4 className='font-[600] text-gray-900 mb-1'>Attachments</h4>
          <ul className='space-y-2'>
            <AttachmentList className={" lg:grid-cols-3 xl:grid-cols-4"} attachments={proposal.attachments} />
          </ul>
        </div>
      )}

      <div className='flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100'>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>{proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}</span>

        <div className='flex flex-wrap gap-2'>
          {proposal.status === 'submitted' && (
            <>
              <button onClick={() => onStatusUpdate(proposal.id, 'accepted')} className='px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md'>
                Accept Proposal
              </button>
              <button onClick={() => onStatusUpdate(proposal.id, 'rejected')} className='px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300 transition-all duration-200'>
                Reject
              </button>
            </>
          )}
          <Link href={`/chat?userId=${proposal.seller.id}`} className='px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-all duration-200 flex items-center gap-1'>
            <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' />
            </svg>
            Message
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function JobProposalsPage() {
  const params = useParams();
  const jobId = params.id;

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadProposals();
  }, [jobId]);

  const loadProposals = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getJobProposals(jobId, page);
      setProposals(response.proposals);
      setJob(response.job);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading proposals:', error);
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (proposalId, status) => {
    try {
      await updateProposalStatus(proposalId, status);
      toast.success(`Proposal ${status} successfully`);
      loadProposals(pagination.page);
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error('Failed to update proposal status');
    }
  };

  return (
    <div className='container min-h-[600px] !py-8 '>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>{job?.title}</h1>
        <p className='text-lg text-gray-600'>
          {proposals.length} {proposals.length === 1 ? 'proposal' : 'proposals'} received
        </p>
      </div>

      {loading ? (
        <SkeletonLoader />
      ) : proposals.length === 0 ? (
        <NoResults mainText='No proposals yet!' additionalText="Your job posting hasn't received any proposals yet. Check back later or try editing your job to attract more freelancers." buttonText='Show your jobs' buttonLink={`/my-jobs`} />
      ) : (
        <div className='space-y-6'>
          {proposals.map(proposal => (
            <ProposalCard key={proposal.id} proposal={proposal} onStatusUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}

      {!loading && proposals.length > 0 && (
        <div className='mt-8'>
          <TabsPagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={page => loadProposals(page)} onItemsPerPageChange={pageSize => loadProposals(1)} itemsPerPage={pagination.limit} />
        </div>
      )}
    </div>
  );
}
