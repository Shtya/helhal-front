
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ServiceCard from '../services/ServiceCard'; 
import TabList from '@/components/atoms/TabList';

function DiscoverySection() {
  const categories = ['Object Oriented Programming', 'Video Tracing', 'Honda'];
  const allTabs = ['All', ...categories];

  const imagePool = ['https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1508385082359-f38ae991e8f2?q=80&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?q=80&w=1200&auto=format&fit=crop'];

  const items = Array.from({ length: 16 }).map((_, i) => ({
    id: i + 1,
    category: categories[i % categories.length],
    slug: `kaviya-pariya-${i + 1}`,
    cover: imagePool[i % imagePool.length],
    name: 'Kaviya Pariya',
    seller: {
      name: 'Kaviya Pariya',
      avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=facearea&facepad=2&w=80&h=80&q=80',
      level: 'Level 1',
    },
    rating: 0,
    ratingCount: 0,
    priceFrom: 10,
  }));

  const [activeTab, setActiveTab] = useState('All');
  const filteredItems = useMemo(() => (activeTab === 'All' ? items : items.filter(it => it.category === activeTab)), [activeTab]);

  const view = filteredItems.slice(0, 8);

  return (
    <section className='mt-14'>
      <p className='text-3xl max-md:text-xl font-[900]'>Based on your browsing history</p>

      {/* Tabs */}
      <TabList allTabs={allTabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Cards grid */}
      <motion.div className='mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        {view.map(it => (
          <motion.div key={it.id} whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
            <ServiceCard
              service={{
                category: it.category,
                slug: it.slug,
                cover: it.cover,
                name: it.name,
                seller: it.seller,
                rating: it.rating,
                ratingCount: it.ratingCount,
                priceFrom: it.priceFrom,
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export default DiscoverySection;
