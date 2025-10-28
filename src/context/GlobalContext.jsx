'use client';

import api from '@/lib/axios';
import { createContext, useContext, useEffect, useState } from 'react';
const GlobalContext = createContext();

// Provider Component
export const GlobalProvider = ({ children }) => {
  const [categories, setCategories] = useState();
  const [cart, setCart] = useState();
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [user, setUser] = useState();
  const [loadingUser, setLoadingUser] = useState(true);

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

  const fetchUser = async () => {
    try {
      setLoadingUser(true);
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };


  useEffect(() => {
    fetchCategories();
    fetchCart()
    fetchUser();
  }, []);

  const setCurrentUser = (input) => {
    try {
      const user = typeof input === 'string' ? JSON.parse(input) : input;
      setUser(user);
    } catch (err) {
      console.error("Invalid user input:", err);
      setUser(null); // or keep previous state
    }
  };

  function logout() {
    setUser(null);
  }
  return <GlobalContext.Provider value={{
    cart,
    categories,
    user,
    loadingCategory,
    loadingUser,
    setCurrentUser,
    refetchUser: fetchUser,
    logout
  }}>{children}</GlobalContext.Provider>;
};

export const useValues = () => {
  return useContext(GlobalContext);
};
