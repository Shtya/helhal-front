'use client';
import React, { useState } from 'react';
import { CreditCard, AlertTriangle, FileText, PieChart, UserX, Flag, BarChart3, DollarSign } from 'lucide-react';
import { GlassCard, MetricBadge } from '@/components/dashboard/Ui';
import Button from '@/components/atoms/Button';

export default function AdminManagementDashboard() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'disputes', name: 'Disputes', icon: AlertTriangle },
    { id: 'blogs', name: 'Blogs', icon: FileText },
    { id: 'accounting', name: 'Accounting', icon: PieChart },
    { id: 'deactivation', name: 'Deactivations', icon: UserX },
    { id: 'abuse-reports', name: 'Abuse Reports', icon: Flag },
  ];

  const stats = {
    payments: { total: 1245, pending: 23, completed: 1201, failed: 21 },
    disputes: { total: 67, open: 12, inReview: 8, resolved: 47 },
    blogs: { total: 89, published: 67, draft: 22, comments: 456 },
    accounting: { revenue: 45289.67, expenses: 12345.32, net: 32944.35 },
  };

  const renderOverview = () => (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      <GlassCard className='p-6 text-center'>
        <CreditCard size={32} className='text-blue-600 mx-auto mb-3' />
        <h3 className='text-lg font-semibold mb-2'>Payments</h3>
        <p className='text-3xl font-bold text-blue-600'>{stats.payments.total}</p>
        <div className='flex justify-center gap-2 mt-2'>
          <MetricBadge tone='success'>{stats.payments.completed} completed</MetricBadge>
          <MetricBadge tone='warning'>{stats.payments.pending} pending</MetricBadge>
        </div>
      </GlassCard>

      <GlassCard className='p-6 text-center'>
        <AlertTriangle size={32} className='text-amber-600 mx-auto mb-3' />
        <h3 className='text-lg font-semibold mb-2'>Disputes</h3>
        <p className='text-3xl font-bold text-amber-600'>{stats.disputes.total}</p>
        <div className='flex justify-center gap-2 mt-2'>
          <MetricBadge tone='warning'>{stats.disputes.open} open</MetricBadge>
          <MetricBadge tone='success'>{stats.disputes.resolved} resolved</MetricBadge>
        </div>
      </GlassCard>

      <GlassCard className='p-6 text-center'>
        <FileText size={32} className='text-green-600 mx-auto mb-3' />
        <h3 className='text-lg font-semibold mb-2'>Blogs</h3>
        <p className='text-3xl font-bold text-green-600'>{stats.blogs.total}</p>
        <div className='flex justify-center gap-2 mt-2'>
          <MetricBadge tone='success'>{stats.blogs.published} published</MetricBadge>
          <MetricBadge tone='neutral'>{stats.blogs.draft} draft</MetricBadge>
        </div>
      </GlassCard>

      <GlassCard className='p-6 text-center'>
        <DollarSign size={32} className='text-purple-600 mx-auto mb-3' />
        <h3 className='text-lg font-semibold mb-2'>Revenue</h3>
        <p className='text-3xl font-bold text-purple-600'>${stats.accounting.revenue.toLocaleString()}</p>
        <div className='text-sm text-slate-600 mt-2'>Net: ${stats.accounting.net.toLocaleString()}</div>
      </GlassCard>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'payments':
        return (
          <GlassCard className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Payment Management</h2>
            <p className='text-slate-600'>Manage payment transactions, refunds, and payment methods.</p>
            <div className='mt-4'>
              <Button>View All Payments</Button>
            </div>
          </GlassCard>
        );
      case 'disputes':
        return (
          <GlassCard className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Dispute Resolution</h2>
            <p className='text-slate-600'>Review and resolve order disputes between buyers and sellers.</p>
            <div className='mt-4'>
              <Button>Manage Disputes</Button>
            </div>
          </GlassCard>
        );
      case 'blogs':
        return (
          <GlassCard className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Blog Management</h2>
            <p className='text-slate-600'>Manage blog posts, categories, and comments.</p>
            <div className='mt-4'>
              <Button>Manage Blogs</Button>
            </div>
          </GlassCard>
        );
      case 'accounting':
        return (
          <GlassCard className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Accounting</h2>
            <p className='text-slate-600'>View financial reports, transactions, and balance management.</p>
            <div className='mt-4'>
              <Button>View Financial Reports</Button>
            </div>
          </GlassCard>
        );
      case 'deactivation':
        return (
          <GlassCard className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Account Deactivations</h2>
            <p className='text-slate-600'>Manage user account deactivation requests and reactivations.</p>
            <div className='mt-4'>
              <Button>View Deactivation Requests</Button>
            </div>
          </GlassCard>
        );
      case 'abuse-reports':
        return (
          <GlassCard className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Abuse Reports</h2>
            <p className='text-slate-600'>Review and take action on abuse reports.</p>
            <div className='mt-4'>
              <Button>Manage Reports</Button>
            </div>
          </GlassCard>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div>
      <div className='p-6'>
        <GlassCard gradient='from-gray-400 via-slate-400 to-slate-500' className='mb-6'>
          <h1 className='text-2xl font-bold text-white'>Management Dashboard</h1>
          <p className='text-slate-100'>Comprehensive platform management and monitoring</p>
        </GlassCard>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Sidebar Navigation */}
          <div className='lg:col-span-1'>
            <GlassCard className='p-4'>
              <nav className='space-y-2'>
                {sections.map(section => {
                  const Icon = section.icon;
                  return (
                    <button key={section.id} onClick={() => setActiveSection(section.id)} className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${activeSection === section.id ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-slate-700 hover:bg-slate-100'}`}>
                      <Icon size={18} className='mr-3' />
                      <span className='font-medium'>{section.name}</span>
                    </button>
                  );
                })}
              </nav>
            </GlassCard>
          </div>

          {/* Main Content */}
          <div className='lg:col-span-3'>{renderSectionContent()}</div>
        </div>
      </div>
    </div>
  );
}
