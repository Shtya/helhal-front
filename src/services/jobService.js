// services/jobService.js
import api from '@/lib/axios';

export const createJob = async jobData => {
  const response = await api.post('/jobs', jobData);
  return response.data;
};

export const updateJob = async (id, jobData) => {
  const response = await api.put(`/jobs/${id}`, jobData);
  return response.data;
};

export const getJob = async id => {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
};

export const getMyJobs = async (status, page = 1, limit = 10, signal) => {
  let url = '/jobs/my-jobs';
  const params = {};
  params.limit = limit

  if (status) params.search = status;
  if (page !== 1) params.page = page;

  const queryString = new URLSearchParams(params).toString();

  if (queryString) url += `?${queryString}`;

  const response = await api.get(url, { signal });
  return response.data;
};

export const getJobProposals = async (jobId, page = 1) => {
  const response = await api.get(`/jobs/${jobId}/proposals?page=${page}`);
  return response.data;
};

export const updateProposalStatus = async (proposalId, status) => {
  const response = await api.put(`/jobs/proposals/${proposalId}/status`, { status });
  return response.data;
};

export const submitProposal = async (jobId, proposalData) => {
  const response = await api.post(`/jobs/${jobId}/proposals`, proposalData);
  return response.data;
};


export const deleteJob = async id => {
  const response = await api.delete(`/jobs/${id}`);
  return response.data;
};