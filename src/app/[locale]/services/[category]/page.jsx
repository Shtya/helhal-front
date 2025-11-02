// File: CategoryPage.jsx
'use client';

import NotFound from "@/components/molecules/NotFound";
import FilterServices from "@/components/pages/services/FilterServices";
import { useValues } from "@/context/GlobalContext";
import { use, useMemo } from "react";

export default function CategoryPage({ params }) {
  const { category } = use(params);
  const { categories } = useValues();
  const found = useMemo(() => {
    return categories?.some(c => c.slug === category)
  }, [category, categories])

  return (
    found ? <FilterServices category={category} />
      : <NotFound />
  )
}