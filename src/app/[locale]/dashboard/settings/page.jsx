'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, DollarSign, Shield, Globe, Mail, Phone, Briefcase } from 'lucide-react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/dashboard/Layout';
import { GlassCard, MetricBadge } from '@/components/dashboard/Ui';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Textarea from '@/components/atoms/Textarea';
import { Switcher } from '@/components/atoms/Switcher';

export default function AdminSettingsDashboard() {
  const [settings, setSettings] = useState ({
    siteName: '',
    siteLogo: '',
    privacyPolicy: '',
    termsOfService: '',
    contactEmail: '',
    supportPhone: '',
    platformPercent: 10,
    affiliatesEnabled: true,
    jobsRequireApproval: true,  
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState (null);
  const [successMessage, setSuccessMessage] = useState (null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await api.get('/settings');
      // Merge to keep default keys if backend is missing the new field
      setSettings((prev ) => ({ ...prev, ...res.data }));
    } catch (e ) {
      console.error('Error fetching settings:', e);
      setApiError(e?.response?.data?.message || 'Failed to fetch settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setApiError(null);
      setSuccessMessage(null);

      // Persist entire settings object
      await api.put('/settings', settings);

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e ) {
      console.error('Error saving settings:', e);
      setApiError(e?.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAffiliateToggle = async (enabled ) => {
    try {
      await api.put('/settings/affiliate', { affiliatesEnabled: enabled });
      setSettings((prev ) => ({ ...prev, affiliatesEnabled: enabled }));
      setSuccessMessage('Affiliate settings updated!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e ) {
      console.error('Error updating affiliate settings:', e);
      setApiError(e?.response?.data?.message || 'Failed to update affiliate settings.');
    }
  };

  const handleJobsAutoPublishToggle = async (autoPublishEnabled ) => {
    // Switcher returns "enabled" for auto-publish; we store the inverse in jobsRequireApproval
    const next = { ...settings, jobsRequireApproval: !autoPublishEnabled };
    try {
      setSaving(true);
      setApiError(null);
      setSuccessMessage(null);

      const res = await api.put('/settings', next);
      setSettings((prev ) => ({ ...prev, ...res.data }));
      setSuccessMessage(
        autoPublishEnabled
          ? 'Jobs will be published immediately.'
          : 'Jobs now require admin approval before publishing.'
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e ) {
      console.error('Error updating job approval setting:', e);
      setApiError(e?.response?.data?.message || 'Failed to update job approval setting.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field , value ) => {
    setSettings((prev ) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="p-6">
        <GlassCard gradient="from-purple-400 via-pink-400 to-rose-400" className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
              <p className="text-purple-100">Manage your platform configuration</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              {saving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </GlassCard>

        {apiError && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {apiError}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {successMessage}
          </div>
        )}

        {/* Top row: General + Financial */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* General Settings */}
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <Globe size={20} className="text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold">General Settings</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Site Name</label>
                <Input
                  value={settings.siteName}
                  onChange={(e) => updateField('siteName', e.target.value)}
                  placeholder="Your Platform Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Site Logo URL</label>
                <Input
                  value={settings.siteLogo}
                  onChange={(e) => updateField('siteLogo', e.target.value)}
                  placeholder="/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                <Input
                  value={settings.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  placeholder="support@example.com"
                  iconLeft={<Mail size={16} />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Support Phone</label>
                <Input
                  value={settings.supportPhone}
                  onChange={(e) => updateField('supportPhone', e.target.value)}
                  placeholder="+1234567890"
                  iconLeft={<Phone size={16} />}
                />
              </div>
            </div>
          </GlassCard>

          {/* Financial Settings */}
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <DollarSign size={20} className="text-green-600 mr-2" />
              <h2 className="text-lg font-semibold">Financial Settings</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Platform Fee Percentage</label>
                <Input
                  type="number"
                  value={settings.platformPercent}
                  onChange={(e) => updateField('platformPercent', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  iconLeft={<span>%</span>}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Affiliate System</label>
                  <p className="text-sm text-slate-600">Enable or disable the affiliate program</p>
                </div>
                <Switcher checked={settings.affiliatesEnabled} onChange={handleAffiliateToggle} />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Jobs Settings */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <Briefcase size={20} className="text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold">Jobs Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Job Posting Auto-Publish
                  </label>
                  <p className="text-sm text-slate-600">
                    If enabled, new jobs go live immediately. If disabled, jobs remain pending (draft) until an
                    admin approves and publishes them.
                  </p>
                </div>
                <Switcher
                  checked={!settings.jobsRequireApproval} // checked = auto-publish
                  onChange={handleJobsAutoPublishToggle}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Legal */}
        <div className="grid grid-cols-1 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <Shield size={20} className="text-amber-600 mr-2" />
              <h2 className="text-lg font-semibold">Legal & Compliance</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Privacy Policy</label>
                <Textarea
                  value={settings.privacyPolicy}
                  onChange={(e) => updateField('privacyPolicy', e.target.value)}
                  rows={6}
                  placeholder="Enter your privacy policy content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Terms of Service</label>
                <Textarea
                  value={settings.termsOfService}
                  onChange={(e) => updateField('termsOfService', e.target.value)}
                  rows={6}
                  placeholder="Enter your terms of service content..."
                />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
