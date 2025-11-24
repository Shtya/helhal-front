'use client';

import api from '@/lib/axios';
import { createContext, useContext, useEffect, useState, useRef } from 'react';

const GlobalContext = createContext();

// Provider Component
export const GlobalProvider = ({ children }) => {
  const [categories, setCategories] = useState();
  const [cart, setCart] = useState();
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingCart, setLoadingCart] = useState(true);

  const [settings, setSettings] = useState(); // ← added
  const [loadingSettings, setLoadingSettings] = useState(true); // ← added


  // NEW — fetch public settings
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await api.get("settings/public");
      setSettings(res.data);
    } catch {
      setSettings({});
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategory(true);
      const res = await api.get('categories?filters[type]=category');
      setCategories(Array.isArray(res?.data?.records) ? res?.data?.records : []);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategory(false);
    }
  };

  const fetchCart = async () => {
    try {
      setLoadingCart(true);
      const res = await api.get("/cart")
      setCart(res.data)
    } catch {
      setCart([])
    } finally {
      setLoadingCart(false);
    }
  };




  useEffect(() => {
    fetchCategories();
    fetchCart();
    fetchSettings();
  }, []);

  return <GlobalContext.Provider value={{
    cart,
    setCart,
    categories,
    settings,
    loadingSettings,
    loadingCategory,
    loadingCart,
  }}>{children}</GlobalContext.Provider>;
};

export const useValues = () => {
  return useContext(GlobalContext);
};
