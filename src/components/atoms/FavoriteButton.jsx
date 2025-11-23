'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useValues } from '@/context/GlobalContext';

export default function FavoriteButton({ className = '', serviceId, syncWithCart = true, onAdded, onRemoved }) {
  const { cart, setCart } = useValues();

  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Check if this service is in cart
  useEffect(() => {
    if (!serviceId || !cart?.items?.length) {
      setActive(false);
      return;
    }
    const isFav = cart.items.some(item => String(item.id || item._id) === String(serviceId));
    setActive(isFav);
  }, [cart, serviceId, syncWithCart]);

  const toggleFavorite = async () => {
    if (!serviceId) {
      setMsg('Missing serviceId');
      return;
    }
    setLoading(true);
    const prev = active;
    setActive(!active);
    setMsg(null);

    try {
      // Call API to toggle in backend
      const { data } = await api.post(`/cart/item/${serviceId}/toggle`);
      if (data.action === 'added') {
        // Update global cart state
        setCart(prevCart => ({
          ...prevCart,
          items: [...(prevCart?.items ?? []), data.service],
          total: (prevCart?.total || 0) + 1,
        }));
        onAdded?.(serviceId);
      } else {
        setCart(prevCart => ({
          ...prevCart,
          items: (prevCart?.items ?? []).filter(item => String(item.id || item._id) !== String(serviceId)),
          total: Math.max((prevCart.total || 0) - 1, 0),
        }));
        onRemoved?.(serviceId);
      }

      setMsg(data.action === 'added' ? 'Added to cart' : 'Removed from cart');
    } catch (err) {
      setActive(prev);
      setMsg(err?.response?.data?.message ?? 'Failed to update cart');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 1800);
    }
  };

  const label = active ? 'Remove from cart' : 'Add to cart';

  return (
    <div>
      <motion.button
        type="button"
        aria-pressed={active}
        aria-busy={loading}
        title={label}
        whileHover={{ rotate: 6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        whileTap={{ scale: 0.88 }}
        onClick={toggleFavorite}
        disabled={loading}
        className={`${className} border border-slate-200 cursor-pointer absolute z-[10] top-3 right-3 h-9 w-9 flex items-center justify-center rounded-lg bg-white shadow-md hover:shadow-lg transition disabled:opacity-70 disabled:cursor-not-allowed`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.div
              key="loading"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 900, damping: 50 }}
              className="flex"
            >
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            </motion.div>
          ) : active ? (
            <motion.div
              key="filled"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 900, damping: 50 }}
              className="flex"
            >
              <Heart className="w-5 h-5 text-green-600 fill-green-600" />
            </motion.div>
          ) : (
            <motion.div
              key="outline"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 900, damping: 50 }}
              className="flex"
            >
              <Heart className="w-5 h-5 text-slate-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tiny status bubble */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            className="absolute top-[3.1rem] right-3 text-[12px] px-2 py-1 rounded-md bg-white border border-slate-200 shadow-sm text-slate-700"
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
