'use client';

import { baseImg } from '@/lib/axios';
import { useState } from 'react';

export default function Img({ src, altSrc , alt = '', className = 'h-full w-full object-cover' }) {
    return (
    <img
      src={ typeof src == "string" ?( src?.startsWith("http") ? src : baseImg +  src) : src}
      alt={alt}
      className={`${className}`}
      onError={e => {
        e.target.classList.add('!object-contain');
        e.target.src = altSrc || '/icons/no-img.png';
      }}
    />
  );
}
