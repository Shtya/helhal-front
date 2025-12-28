// components/Search/GlobalSearch.jsx — Inline Select INSIDE input + Typeahead (Light mode, JS)
'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Clock, ChevronDown, ExternalLink, Loader2, X } from 'lucide-react';
import api from '@/lib/axios';
import { apiService } from '@/services/GigServices';
import { useDebounce } from '@/hooks/useDebounce';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/AuthContext';

export default function GlobalSearch({ className = '', isMobileNavOpen }) {
  const t = useTranslations('GlobalSearch');
  const BRAND = '#108A0090';
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role } = useAuth();
  const isBuyer = role === 'buyer';
  const isSeller = role === 'seller';
  // ---------- UI state
  const [q, setQ] = useState('');
  const { debouncedValue: debouncedQ } = useDebounce({ value: q })
  const [open, setOpen] = useState(false); // search dropdown
  const [scopeOpen, setScopeOpen] = useState(false); // scope dropdown
  const [highlight, setHighlight] = useState({ section: 'recent', index: -1 });

  // ---------- Data state
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);

  // ---------- Refs
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const scopeBtnRef = useRef(null);

  // ---------- Scopes (select lives **inside** the input)
  const scopes = [
    { label: t('scopes.services'), value: 'services', path: '/services/all' },
    { label: t('scopes.jobs'), value: 'jobs', path: '/jobs' },
    // { label: 'Sellers', value: 'sellers', path: '/sellers' },
  ];
  const [scopeIndex, setScopeIndex] = useState(0);
  const scope = scopes[scopeIndex];

  useEffect(() => {
    if (isSeller) setScopeIndex(1);
    if (isBuyer) setScopeIndex(0);
  }, [isSeller, isBuyer]);

  const cycleScope = dir => setScopeIndex(i => (i + dir + scopes.length) % scopes.length);

  // ---------- Suggested queries
  const suggestions = useMemo(() => ['youtube video editor', 'social media manager', 'chatGPT API integration', 'shopify developer', 'nextjs', 'full stack developer react', 'mern stack developer'], []);

  // ---------- Load recent
  useEffect(() => {
    try {
      const raw = localStorage.getItem('globalSearchRecent');
      if (raw) setRecent(JSON.parse(raw));
    } catch { }
  }, []);

  const pushRecent = term => {
    const val = String(term || '').trim();
    if (!val) return;
    try {
      const next = [val, ...recent.filter(r => r.toLowerCase() !== val.toLowerCase())].slice(0, 8);
      setRecent(next);
      localStorage.setItem('globalSearchRecent', JSON.stringify(next));
    } catch { }
  };

  useEffect(() => {
    if (isMobileNavOpen) setMobileOpen(false)
  }, [isMobileNavOpen])
  // ---------- Debounced records fetch (lightweight)
  useEffect(() => {
    if (!open || !debouncedQ?.trim()) {
      setRecords([]);
      return;
    }

    const fetchRecords = async () => {
      setLoading(true);
      try {
        let list = [];
        if (scope.value === 'services') {
          const data = await apiService.getServices('all', {
            search: debouncedQ?.trim(),
            limit: 5,
            sortBy: 'created_at',
            sortOrder: 'DESC',
            'filters[status]': 'published',
          });
          list = data?.records || data?.services || [];
        } else {
          const res = await api.get('/jobs', {
            params: {
              search: debouncedQ?.trim(),
              limit: 5,
              sortBy: 'created_at',
              sortOrder: 'DESC',
              'filters[status]': 'published',
            },
          });
          list = res?.data?.records || res?.data?.jobs || [];
        }
        setRecords(Array.isArray(list) ? list.slice(0, 5) : []);
      } catch {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [debouncedQ?.trim(), scope.value]);

  // ---------- Outside click / ESC
  useEffect(() => {
    const onDoc = e => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setScopeOpen(false);
      }
    };
    const onKey = e => {
      if (e.key === 'Escape') {
        setOpen(false);
        setScopeOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // ---------- Sections for keyboard nav
  const sections = useMemo(() => {
    const blocks = [];
    if (recent.length) blocks.push({ key: 'recent', items: recent.map(t => ({ type: 'recent', label: t })) });
    if (q.trim()) {
      blocks.push({
        key: scope.value,
        items: records.map(r => ({
          type: scope.value === 'services' ? 'service' : 'job',
          href: r.href,
          label: r.title || r.name || '',
          subtitle: r?.buyer?.username || r?.seller?.username || '',
        })),
      });
    }
    blocks.push({ key: 'suggest', items: suggestions.map(s => ({ type: 'suggest', label: s })) });
    return blocks;
  }, [recent, records, suggestions, q, scope.value]);

  const moveHighlight = dir => {
    if (!sections.length) return;
    let { section, index } = highlight;
    if (index === -1) {
      setHighlight({ section: sections[0].key, index: 0 });
      return;
    }
    const si = sections.findIndex(s => s.key === section);
    const items = sections[si]?.items || [];
    if (dir === 1) {
      if (index + 1 < items.length) {
        setHighlight({ section, index: index + 1 });
        return;
      }
      const nextS = sections[si + 1];
      if (nextS) {
        setHighlight({ section: nextS.key, index: 0 });
        return;
      }
      setHighlight({ section: sections[0].key, index: 0 });
    } else {
      if (index - 1 >= 0) {
        setHighlight({ section, index: index - 1 });
        return;
      }
      const prevS = sections[si - 1];
      if (prevS) {
        setHighlight({ section: prevS.key, index: prevS.items.length - 1 });
        return;
      }
      const last = sections[sections.length - 1];
      setHighlight({ section: last.key, index: last.items.length - 1 });
    }
  };

  // const activateHighlighted = () => {
  //   if (!sections.length) return;
  //   const sec = sections.find(s => s.key === highlight.section);
  //   if (!sec) return;
  //   const item = sec.items[highlight.index];
  //   if (!item) return;
  //   handleChoose(item);
  // };

  // ---------- Navigation helpers
  const go = term => {
    const t = String(term || q).trim();
    if (!t) return;
    pushRecent(t);
    setOpen(false);
    setMobileOpen(false)
    router.push(`${scope.path}?q=${encodeURIComponent(t)}`);
  };

  const handleChoose = item => {
    if ((item.type === 'job' || item.type === 'service') && item.href) {
      setOpen(false);
      setMobileOpen(false)
      pushRecent(item.label);
      if (item.type === 'job') router.push(item.href);
      else router.push(item.href);
      return;
    }
    go(item.label);
  };

  // helper to highlight the query fragment
  const High = ({ text, query }) => {
    const t = String(text || '');
    const ql = String(query || '').trim();
    if (!ql) return <>{t}</>;
    const idx = t.toLowerCase().indexOf(ql.toLowerCase());
    if (idx === -1) return <>{t}</>;
    return (
      <>
        {t.slice(0, idx)}
        <mark className='rounded px-0.5 bg-emerald-100 text-emerald-800'>{t.slice(idx, idx + ql.length)}</mark>
        {t.slice(idx + ql.length)}
      </>
    );
  };


  return (
    <div className=''>

      <button onClick={() => setMobileOpen(p => !p)} aria-label={t('ariaLabels.goToChat')} className=' xl:hidden relative inline-grid place-items-center h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50'>
        <Search className='h-5 w-5 text-slate-600' />
      </button>
      <div ref={rootRef} className={`w-full xl:w-xs relative max-xl:z-[1] ${mobileOpen ? "max-xl:absolute" : "hidden"}  top-16 md:top-[88px] left-0 right-0 max-xl:bg-white  xl:top-auto xl:flex max-xl:shadow max-xl:pb-2 ${className}`}>
        <div className='w-full relative' role='combobox' aria-haspopup='listbox' aria-expanded={open && !scopeOpen}>
          <div className=' flex min-h-[40px] items-center gap-2 xl:rounded-md  xl:border bg-white/20 backdrop-blur-3xl px-2 py-1 text-sm  transition' style={{ borderColor: open ? BRAND : '#cbd5e1', boxShadow: open ? `inset 0 0 0 3px ${BRAND}1f` : undefined }}>

            {(!isSeller && !isBuyer) && <button
              ref={scopeBtnRef}
              onClick={() => {
                setScopeOpen(prev => {
                  const next = !prev;
                  if (next) setOpen(false); // CLOSE search when opening scope
                  return next;
                });
              }}
              className='inline-flex items-center gap-1 max-xl:p-[10px] rounded-lg px-2 py-1 text-slate-700 max-xl:bg-emerald-600 max-xl:text-white  hover:xl:bg-slate-50 border border-transparent max-xl:border-slate-200 hover:xl:border-slate-200'
              aria-expanded={scopeOpen}>
              <span className='font-semibold'>{scope.label}</span>
              <ChevronDown className={`h-4 w-4 transition ${scopeOpen ? 'rotate-180' : ''}`} />
            </button>}

            {(!isSeller && !isBuyer) && <span className='hidden xl:block h-5 w-px bg-slate-200 mx-1' />}

            <div className='flex-1 max-xl:flex-1 flex items-center gap-2 max-xl:border max-xl:bg-white/20 max-xl:rounded-md max-xl:border-[#cbd5e1] max-xl:p-[10px]'>
              <Search className='h-5 w-5 xl:h-4 xl:w-4 text-slate-500 shrink-0' />
              <input
                ref={inputRef}
                value={q}
                onChange={e => {
                  setQ(e.target.value);
                  setOpen(true);
                  setScopeOpen(false);
                  setHighlight({ section: 'recent', index: -1 });
                }} // typing closes scope
                onFocus={() => {
                  setOpen(true);
                  setScopeOpen(false);
                }} // focusing closes scope
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    moveHighlight(1);
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    moveHighlight(-1);
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    go();
                  }
                  const mod = e.ctrlKey || e.metaKey;
                  if (mod && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
                    if (isBuyer || isSeller) return;
                    e.preventDefault();
                    cycleScope(e.key === 'ArrowRight' ? +1 : -1);
                  }
                }}
                placeholder={isBuyer ? t('buyerPlaceholder') : isSeller ? t('sellerPlaceholder') : t('placeholder')}
                className='peer w-full bg-transparent outline-none placeholder:text-slate-400'
              />

              {/* Clear & spinner */}
              {loading && <Loader2 className='h-4 w-4 animate-spin text-slate-400' />}
              {q && !loading && (
                <button onClick={() => setQ('')} className='rounded-md p-1 text-slate-500 hover:bg-slate-100' aria-label={t('ariaLabels.clear')}>
                  <X className='h-4 w-4' />
                </button>
              )}
            </div>
          </div>

          {/* Scope menu anchored to input (left) */}
          {scopeOpen && !isBuyer && !isSeller && (
            <div className='absolute start-2 xl:start-0 z-50 mt-2 w-[220px] overflow-hidden rounded-md border border-slate-200 bg-white  shadow-sm  transition will-change-transform origin-top scale-100 opacity-100'>
              {scopes.map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setScopeIndex(i);
                    setScopeOpen(false);
                    inputRef.current?.focus();
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm ${i === scopeIndex ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Results dropdown — only show if search open AND scope menu closed */}
          {open && !scopeOpen && (
            <div className='absolute z-50 mt-2 w-full overflow-hidden rounded-md border border-slate-200 bg-white  shadow-sm  transition will-change-transform origin-top scale-100 opacity-100'>
              <div className='max-h-[380px] overflow-auto p-2'>

                {/* Live records */}
                {q.trim() && (
                  <Section title={t('sections.live', { scope: scope.label })} loading={loading} empty={records.length === 0 && !loading} emptyHint={loading ? '' : t('empty.noMatching', { scope: scope.label.toLowerCase() })}>
                    {records.map((r, i) => (
                      <Row
                        key={r.id || `${scope.value}-${i}`}
                        icon={<ExternalLink className='h-4 w-4' />}
                        active={highlight.section === scope.value && highlight.index === i}
                        onMouseEnter={() => setHighlight({ section: scope.value, index: i })}
                        onClick={() =>
                          handleChoose({
                            type: scope.value === 'services' ? 'service' : 'job',
                            href: scope.value === 'services' ? `/services/${r?.category?.slug}/${r?.slug}` : `/jobs?job=${r.id}`,
                            label: r.title || r.name,
                          })
                        }
                        subtitle={r?.buyer?.username || r?.seller?.username}
                        meta={r?.budget ? `$${r.budget}` : null}>
                        <High text={r.title || r.name} query={q} />
                      </Row>
                    ))}
                  </Section>
                )}

                {/* Recent */}
                {recent.length > 0 && (
                  <Section title={t('sections.recent')}>
                    {recent.map((r, i) => (
                      <Row key={`r-${r}-${i}`} icon={<Clock className='h-4 w-4' />} active={highlight.section === 'recent' && highlight.index === i} onMouseEnter={() => setHighlight({ section: 'recent', index: i })} onClick={() => handleChoose({ type: 'recent', label: r })}>
                        <High text={r} query={q} />
                      </Row>
                    ))}
                  </Section>
                )}

                {/* Suggestions */}
                <Section title={t('sections.trySearchingFor')}>
                  {suggestions.map((s, i) => (
                    <Row key={`s-${s}`} icon={<Search className='h-4 w-4' />} active={highlight.section === 'suggest' && highlight.index === i} onMouseEnter={() => setHighlight({ section: 'suggest', index: i })} onClick={() => handleChoose({ type: 'suggest', label: s })}>
                      <High text={s} query={q} />
                    </Row>
                  ))}
                </Section>
              </div>

              {/* Footer CTA */}
              <button onClick={() => go(q)} className='flex  w-full items-center justify-between gap-2 border-t border-slate-200 bg-white/70 px-3 py-2 text-left text-sm hover:bg-emerald-50'>
                <span className='break-all'>
                  {t('footer.searchIn', { query: q || '…', scope: scope.label })}
                </span>
                <span className='text-[11px] text-slate-400'>{t('footer.enter')}</span>
              </button>
            </div>
          )}
        </div>

        {/* tiny fade-in animation */}
        <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 120ms ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      </div>
    </div>
  );
}

function Section({ title, children, loading = false, empty = false, emptyHint = '' }) {
  const t = useTranslations('GlobalSearch');
  return (
    <div className='py-1'>
      <div className='sticky -top-2 z-[1] bg-white/95 backdrop-blur px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500'>{title}</div>
      {loading && <div className='px-2 pb-2 text-sm text-slate-500'>{t('loading')}</div>}
      {empty && !loading && <div className='px-2 pb-2 text-sm text-slate-400'>{emptyHint}</div>}
      {children}
    </div>
  );
}

function Row({ icon, children, subtitle, meta, active, onMouseEnter, onClick }) {
  return (
    <button type='button' onMouseEnter={onMouseEnter} onClick={onClick} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${active ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50'}`}>
      <span className={`grid h-6 w-6 place-items-center rounded-md ${active ? 'bg-white/20' : 'bg-[#108A0033] border border-[#108A0013] text-slate-700'}`}>{icon}</span>
      <span className='flex-1 min-w-0'>
        <div className={`truncate ${active ? 'font-medium' : ''}`}>{children}</div>
        {(subtitle || meta) && (
          <div className={`flex items-center gap-2 text-[11px] truncate ${active ? 'text-emerald-50' : 'text-slate-400'}`}>
            {subtitle && <span className='truncate'>{subtitle}</span>}
            {meta && <span className='truncate'>• {meta}</span>}
          </div>
        )}
      </span>
    </button>
  );
}
