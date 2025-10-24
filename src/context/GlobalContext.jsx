'use client';

import api from '@/lib/axios';
import { apiService } from '@/services/GigServices';
import { createContext, useContext, useEffect, useState } from 'react';
const GlobalContext = createContext();

// Provider Component
export const GlobalProvider = ({ children }) => {
  const [categories, setCategories] = useState();
  const [cart, setCart] = useState();
  const [loadingCategory, setLoadingCategory] = useState(true);

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
      const res = await api.get("/cart")
      setCart(res.data)
    } catch {
      setCart([])
    } finally { }
  };

  useEffect(() => {
    fetchCategories();
    fetchCart()
  }, []);


  return <GlobalContext.Provider value={{ cart, categories, loadingCategory }}>{children}</GlobalContext.Provider>;
};

export const useValues = () => {
  return useContext(GlobalContext);
};
