'use client';

import api from '@/lib/axios';
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const GlobalContext = createContext();

// Provider Component
export const GlobalProvider = ({ children }) => {
  const [categories, setCategories] = useState();
  const { user } = useAuth()
  const [cart, setCart] = useState();
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingCart, setLoadingCart] = useState(true);

  const [topCategories, SetTopCategories] = useState([]);
  const [loadingTopCategories, setLoadingTopCategories] = useState(true);;

  const [settings, setSettings] = useState(); // ← added
  const [loadingSettings, setLoadingSettings] = useState(true); // ← added


  const [countriesOptions, setCountriesOptions] = useState([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [countryError, setCountryError] = useState(null);

  const fetchCountries = async () => {
    setCountryLoading(true);
    setCountryError(null);

    try {
      const res = await api.get(`/countries`);
      setCountriesOptions(res.data);
    } catch (err) {
      setCountryError("Failed to load countries");
    } finally {
      setCountryLoading(false);
    }
  };



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

  const fetchTopCategories = async () => {
    try {
      setLoadingTopCategories(true);
      const res = await api.get('categories/top');
      SetTopCategories(res?.data || []);
    } catch {
      SetTopCategories([]);
    } finally {
      setLoadingTopCategories(false);
    }
  };

  const fetchCart = async () => {
    const access = localStorage.getItem('accessToken');
    if (!access) { setLoadingCart(false); return; }

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
    if (cart && cart?.userId === user?.id) return;
    fetchCart();
  }, [user?.id])

  useEffect(() => {
    fetchCategories();
    fetchTopCategories();
    fetchSettings();
    fetchCountries();
  }, []);

  return <GlobalContext.Provider value={{
    cart,
    setCart,
    categories,
    settings,
    countries: countriesOptions,
    countryLoading,
    loadingSettings,
    loadingCategory,
    loadingCart,
    topCategories,
    loadingTopCategories
  }}>{children}</GlobalContext.Provider>;
};

export const useValues = () => {
  return useContext(GlobalContext);
};
