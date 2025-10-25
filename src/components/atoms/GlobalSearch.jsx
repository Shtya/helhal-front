// components/Search/GlobalSearch.jsx — Inline Select INSIDE input + Typeahead (Light mode, JS)
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, ChevronDown, ExternalLink, Loader2, X } from 'lucide-react';
import api from '@/lib/axios';

export default function GlobalSearch({ className = '' }) {
  const BRAND = '#108A0090';
  const router = useRouter();

  // ---------- UI state
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false); // search dropdown
  const [scopeOpen, setScopeOpen] = useState(false); // scope dropdown
  const [highlight, setHighlight] = useState({ section: 'recent', index: -1 });

  // ---------- Data state
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);

  // ---------- Refs
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const scopeBtnRef = useRef(null);

  // ---------- Scopes (select lives **inside** the input)
  const scopes = [
    { label: 'Services', value: 'services', path: '/services' },
    { label: 'Jobs', value: 'jobs', path: '/jobs' },
    { label: 'Sellers', value: 'sellers', path: '/sellers' },
  ];
  const [scopeIndex, setScopeIndex] = useState(0);
  const scope = scopes[scopeIndex];

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

  // ---------- Debounced jobs fetch (lightweight)
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (!term) {
      setJobs([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/jobs', {
          params: {
            search: term,
            limit: 5,
            sortBy: 'created_at',
            sortOrder: 'DESC',
            'filters[status]': 'published',
          },
        });
        const records = res?.data?.records || res?.data?.jobs || [];
        setJobs(Array.isArray(records) ? records.slice(0, 5) : []);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => clearTimeout(t);
  }, [q, open]);

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
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        cycleScope(e.key === 'ArrowRight' ? +1 : -1);
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
    if (q.trim()) blocks.push({ key: 'jobs', items: jobs.map(j => ({ type: 'job', id: j.id, label: j.title, subtitle: j?.buyer?.username })) });
    blocks.push({ key: 'suggest', items: suggestions.map(s => ({ type: 'suggest', label: s })) });
    return blocks;
  }, [recent, jobs, suggestions, q]);

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

  const activateHighlighted = () => {
    if (!sections.length) return;
    const sec = sections.find(s => s.key === highlight.section);
    if (!sec) return;
    const item = sec.items[highlight.index];
    if (!item) return;
    handleChoose(item);
  };

  // ---------- Navigation helpers
  const go = term => {
    const t = String(term || q).trim();
    if (!t) return;
    pushRecent(t);
    router.push(`${scope.path}?q=${encodeURIComponent(t)}`);
    setOpen(false);
  };

  const handleChoose = item => {
    if (item.type === 'job' && item.id) {
      router.push(`/jobs/${item.id}`);
      setOpen(false);
      pushRecent(q || item.label);
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
    <div ref={rootRef} className={`relative hidden xl:flex ${className}`}>
      <div className='relative' role='combobox' aria-haspopup='listbox' aria-expanded={open && !scopeOpen}>
        <div className='flex items-center gap-2 rounded-md border bg-white/20 backdrop-blur-3xl px-2 py-1 text-sm  transition' style={{ borderColor: open ? BRAND : '#cbd5e1', boxShadow: open ? `inset 0 0 0 3px ${BRAND}1f` : undefined }}>

          <button
            ref={scopeBtnRef}
            onClick={() => {
              setScopeOpen(prev => {
                const next = !prev;
                if (next) setOpen(false); // CLOSE search when opening scope
                return next;
              });
            }}
            className='inline-flex items-center gap-1 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200'
            aria-expanded={scopeOpen}>
            <span className='font-semibold'>{scope.label}</span>
            <ChevronDown className={`h-4 w-4 transition ${scopeOpen ? 'rotate-180' : ''}`} />
          </button>

          <span className='h-5 w-px bg-slate-200 mx-1' />

          <Search className='h-4 w-4 text-slate-500' />
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
                activateHighlighted() || go(q);
              }
              const mod = e.ctrlKey || e.metaKey;
              if (mod && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
                e.preventDefault();
                cycleScope(e.key === 'ArrowRight' ? +1 : -1);
              }
            }}
            placeholder='Search'
            className='peer w-full bg-transparent outline-none placeholder:text-slate-400'
          />

          {/* Clear & spinner */}
          {loading && <Loader2 className='h-4 w-4 animate-spin text-slate-400' />}
          {q && !loading && (
            <button onClick={() => setQ('')} className='rounded-md p-1 text-slate-500 hover:bg-slate-100' aria-label='Clear'>
              <X className='h-4 w-4' />
            </button>
          )}
        </div>

        {/* Scope menu anchored to input (left) */}
        {scopeOpen && (
          <div className='absolute left-0 z-50 mt-2 w-[220px] overflow-hidden rounded-md border border-slate-200 bg-white  shadow-sm  transition will-change-transform origin-top scale-100 opacity-100'>
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
              {/* Recent */}
              {recent.length > 0 && (
                <Section title='Recent'>
                  {recent.map((r, i) => (
                    <Row key={`r-${r}-${i}`} icon={<Clock className='h-4 w-4' />} active={highlight.section === 'recent' && highlight.index === i} onMouseEnter={() => setHighlight({ section: 'recent', index: i })} onClick={() => handleChoose({ type: 'recent', label: r })}>
                      <High text={r} query={q} />
                    </Row>
                  ))}
                </Section>
              )}

              {/* Live Jobs */}
              {q.trim() && (
                <Section title='Jobs' loading={loading} empty={jobs.length === 0 && !loading} emptyHint={loading ? '' : 'No matching jobs yet'}>
                  {jobs.map((j, i) => (
                    <Row key={j.id} icon={<ExternalLink className='h-4 w-4' />} active={highlight.section === 'jobs' && highlight.index === i} onMouseEnter={() => setHighlight({ section: 'jobs', index: i })} onClick={() => handleChoose({ type: 'job', id: j.id, label: j.title })} subtitle={j?.buyer?.username} meta={j?.budget ? `$${j.budget}` : null}>
                      <High text={j.title} query={q} />
                    </Row>
                  ))}
                </Section>
              )}

              {/* Suggestions */}
              <Section title='Try searching for'>
                {suggestions.map((s, i) => (
                  <Row key={`s-${s}`} icon={<Search className='h-4 w-4' />} active={highlight.section === 'suggest' && highlight.index === i} onMouseEnter={() => setHighlight({ section: 'suggest', index: i })} onClick={() => handleChoose({ type: 'suggest', label: s })}>
                    <High text={s} query={q} />
                  </Row>
                ))}
              </Section>
            </div>

            {/* Footer CTA */}
            <button onClick={() => go(q)} className='flex w-full items-center justify-between gap-2 border-t border-slate-200 bg-white/70 px-3 py-2 text-left text-sm hover:bg-emerald-50'>
              <span>
                Search “{q || '…'}” in <span className='font-semibold'>{scope.label}</span>
              </span>
              <span className='text-[11px] text-slate-400'>Enter ↵</span>
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
  );
}

function Section({ title, children, loading = false, empty = false, emptyHint = '' }) {
  return (
    <div className='py-1'>
      <div className='sticky top-0 z-[1] bg-white/95 backdrop-blur px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500'>{title}</div>
      {loading && <div className='px-2 pb-2 text-sm text-slate-500'>Loading…</div>}
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
