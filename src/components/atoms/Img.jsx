'use client';

import { baseImg } from '@/lib/axios';
import { useEffect, useMemo, useState } from 'react';

export default function Img({ src, altSrc, alt = '', className = 'h-full w-full object-cover', fallback = '/icons/no-img.png', loading = 'lazy', decoding = 'async', draggable = false, textFallback = '', onLoad, ...rest }) {
  const altSrcFinal = altSrc || fallback;
  const [errored, setErrored] = useState(false);

  useEffect
  const resolved = useMemo(() => {
    if (src === null || src === undefined) return altSrcFinal;
    if (typeof src !== 'string') return altSrcFinal;

    const trimmed = src.trim();
    if (!trimmed) return altSrcFinal;

    // absolute / data / blob → keep as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return trimmed;
    }

    // relative → join with baseImg safely
    try {
      const base = String(baseImg || '').replace(/\/+$/, '');
      const rel = trimmed.replace(/^\/+/, '');
      return `${base}/${rel}`;
    } catch {
      return altSrcFinal;
    }
  }, [src, altSrcFinal]);

  const handleError = e => {
    // show contained altSrcFinal to avoid ugly stretch
    e.currentTarget.classList.add('!object-contain', 'bg-slate-50');
    e.currentTarget.src = altSrcFinal;
    setErrored(true);
  };

  const handleLoad = e => {
    onLoad?.()
    // if it successfully loads something that isn’t the fallback, keep object-cover
    if (e.currentTarget.src.includes(altSrcFinal)) {
      e.currentTarget.classList.add('!object-contain');
    } else {
      e.currentTarget.classList.remove('!object-contain');
    }
  };

  if (errored && textFallback) {
    return (
      <span className="text-sm font-semibold text-slate-600 select-none">
        {textFallback}
      </span>
    );
  }

  return <img src={resolved} alt={alt} className={className} onError={handleError} onLoad={handleLoad} loading={loading} decoding={decoding} draggable={draggable} {...rest} />;
}
