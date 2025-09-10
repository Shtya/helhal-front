'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useValues } from '@/context/GlobalContext';

export default function FavoriteButton({ className = '', service, packageType = 'Basic', quantity = 1, extraServices = [], syncWithCart = true, onAdded, onRemoved }) {
  const resolvedServiceId = service?.id ?? service?._id ?? null;
  const { cart } = useValues();

  // default packageType: service.packages[0].name -> "Basic"
  const resolvedPackageType = useMemo(() => {
    if (packageType && typeof packageType === 'string') return packageType;
    const firstPkgName = service?.packages?.[0]?.name;
    return firstPkgName || 'Basic';
  }, [packageType, service]);

  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itemId, setItemId] = useState(null);
  const [msg, setMsg] = useState(null);

  const findMatchingItem = cart => {
    const items = cart?.items;
     if (!items?.length) return null;
    return items.find(it => {
      const itServiceId = it?.serviceId ?? it?.service?.id ?? it?.service?._id ?? it?.serviceId; // last redundant on purpose

      const sameService = itServiceId && resolvedServiceId && String(itServiceId) === String(resolvedServiceId);

      const itPkg = it?.packageType ?? it?.package ?? it?.pkg ?? 'Basic';
      const samePackage = String(itPkg) === String(resolvedPackageType);

      return sameService && samePackage;
    });
  };

  useEffect(() => {
    const match = findMatchingItem(cart);
    setActive(Boolean(match));
    setItemId(match?.id ?? match?._id ?? null);

  }, [resolvedServiceId, resolvedPackageType, syncWithCart]);

  const addToCart = async () => {
    if (!resolvedServiceId) {
      setMsg('Missing service.id');
      return;
    }
    setLoading(true);
    const prev = active;
    setActive(true);
    setMsg(null);
    try {
      const { data } = await api.post('/cart/item', {
        serviceId: resolvedServiceId,
        packageType: resolvedPackageType,
        quantity,
        extraServices,
      });

      const newItem = data?.item ?? data?.data ?? data;
      const newId = newItem?.id ?? newItem?._id ?? null;

      if (!newId) {
        const res = await api.get('/cart');
        const match = findMatchingItem(res.data);
        setItemId(match?.id ?? match?._id ?? null);
        onAdded?.(match || null);
      } else {
        setItemId(newId);
        onAdded?.(newItem);
      }
      setMsg('Added to cart');
    } catch (err) {
      setActive(prev);
      setMsg(err?.response?.data?.message ?? 'Failed to add');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 1800);
    }
  };

  const removeFromCart = async () => {
    setLoading(true);
    const prev = active;
    setActive(false);
    setMsg(null);
    try {
      let targetId = itemId;
      if (!targetId) {
        const { data } = await api.get('/cart');
        const match = findMatchingItem(data);
        targetId = match?.id ?? match?._id ?? null;
      }
      if (!targetId) {
        setMsg('Removed');
      } else {
        await api.delete(`/cart/item/${targetId}`);
        onRemoved?.(targetId);
        setItemId(null);
        setMsg('Removed from cart');
      }
    } catch (err) {
      setActive(prev);
      setMsg(err?.response?.data?.message ?? 'Failed to remove');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 1800);
    }
  };

  const handleClick = async () => {
    if (loading) return;
    if (!active) return addToCart();
    return removeFromCart();
  };

  const label = active ? 'Remove from cart' : 'Add to cart';

  return (
    <div className=' '>
      <motion.button type='button' aria-pressed={active} aria-busy={loading} title={label} whileHover={{ rotate: 6 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} whileTap={{ scale: 0.88 }} onClick={handleClick} disabled={loading} className={`${className} border border-slate-200 cursor-pointer absolute z-[10] top-3 right-3 h-9 w-9 flex items-center justify-center rounded-lg bg-white shadow-md hover:shadow-lg transition disabled:opacity-70 disabled:cursor-not-allowed`}>
        <AnimatePresence mode='wait' initial={false}>
          {loading ? (
            <motion.div key='loading' initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 900, damping: 50 }} className='flex'>
              <Loader2 className='w-5 h-5 animate-spin text-slate-500' />
            </motion.div>
          ) : active ? (
            <motion.div key='filled' initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 900, damping: 50 }} className='flex'>
              <Heart className='w-5 h-5 text-green-600 fill-green-600' />
            </motion.div>
          ) : (
            <motion.div key='outline' initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 900, damping: 50 }} className='flex'>
              <Heart className='w-5 h-5 text-slate-600' />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* tiny status bubble */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -6, opacity: 0 }} className='absolute top-[3.1rem] right-3 text-[12px] px-2 py-1 rounded-md bg-white border border-slate-200 shadow-sm text-slate-700'>
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
