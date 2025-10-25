'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tabs from '@/components/common/Tabs';
import ActivityTab from '@/components/pages/ActivityLogs/ActivityTab';
import DetialsTab from '@/components/pages/ActivityLogs/DetialsTab';
import RequirementsTab from '@/components/pages/ActivityLogs/RequirmentsTab';
import { tabAnimation } from '../orders/page';


export default function Page() {
  const tabs = [
    { label: 'Activity', value: 'activity', element: <ActivityTab /> },
    { label: 'Details', value: 'details', element: <DetialsTab /> },
    { label: 'Requirements', value: 'requirements', element: <RequirementsTab /> },
  ];
  const [activeTab, setActiveTab] = useState('activity');


  return (
    <div className=' container  min-h-screen !py-12 '>
      {/* Tabs */}
      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <h1 className='text-3xl font-bold text-center mb-4'> Activity Logs </h1>
      </div>

      <Tabs setActiveTab={setActiveTab} activeTab={activeTab} tabs={tabs} />

      <AnimatePresence exitBeforeEnter >
        {tabs
          .filter(tab => tab.value === activeTab)
          .map(tab => (
            <motion.div key={tab.value} {...tabAnimation} className='mt-6'>
              {tab.element}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
