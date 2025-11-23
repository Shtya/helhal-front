// File: CategoryPage.jsx
'use client';

import FilterServices from "@/components/pages/services/FilterServices";
import { use } from "react";

export default function CategoryPage({ params }) {
  const { category } = use(params);

  return (
    <FilterServices category={category} />
  )
}