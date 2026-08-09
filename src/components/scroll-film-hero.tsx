'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { IconRocket, IconBook } from '@/components/landing-icons';

const FRAME_COUNT = 481;
const FRAME_PATH = (i: number) => `/film/f_${String(i + 1).padStart(4, '0')}.jpg`;

const CHAPTERS = [
  { at: 0.0, label: 'Orbitals' },
  { at: 0.25, label: 'Constellation' },
  { at: 0.5, label: 'Mining' },
  { at: 0.75, label: 'Lunar' },
  { at: 0.95, label: 'The Ring' },
];

/** Beat overlay copy envelope (progress fractions over the film driver). */
interface Beat { inn: number; peak: number; out: number; children: React.ReactNode; align?: string }

function beatAlpha(p: number, b: { inn: number; peak: number; out: number }) {
  if (p < b.inn || p > b.out) return 0;
  if (p < b.peak) return (p - b.inn) / Math.max(1e-4, b.peak - b.inn);
  if (b.out > 1.5) return 1;
  return 1 - (p - b.peak) / Math.max(1e-4, b.out - b.peak);
}

export default function ScrollFilmHero() {
  const driverRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(FRAME_COUNT).fill(null));
  const bitmapsRef = useRef<Map<number, ImageBitmap>>(new Map());
  const decodingRef = useRef<Set<number>>(new Set());
  const currentRef = useRef(0);
  const targetRef = useRef(0);
  const displayedRef = useRef(-1);
  const rafRef = useRef(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const [onLight, setOnLight] = useState(false);

  const drawFrame = useCallback((idx: number, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (idx === displayedRef.current && !force) return;

    const bm = bitmapsRef.current.get(idx);
    let source: CanvasImageSource | null = bm ?? null;
    if (!source) {
      // nearestFrame fallback: scan outward
      for (let d = 1; d < 12; d++) {
        const lo = idx - d, hi = idx + d;
        if (lo >= 0 && imagesRef.current[lo]) { source = imagesRef.current[lo]; break; }
        if (hi < FRAME_COUNT && imagesRef.current[hi]) { source = imagesRef.current[hi]; break; }
      }
    }
    if (!source) return;

    const sw = (source as ImageBitmap).width ?? (source as HTMLImageElement).naturalWidth;
    const sh = (source as ImageBitmap).height ?? (source as HTMLImageElement).naturalHeight;
    if (!sw || !sh) return;

    const cw = canvas.width, ch = canvas.height;
    const sCover = Math.max(cw / sw, ch / sh);
    const crop = 1 - Math.min(cw / (sw * sCover), ch / (sh * sCover));
    const MAX_CROP = 0.22;
    const s = crop > MAX_CROP ? Math.min(cw / sw, ch / sh) : sCover;
    const w = sw * s, h = sh * s;
    ctx.fillStyle = '#04070d';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(source, (cw - w) / 2, (ch - h) / 2, w, h);
    displayedRef.current = idx;
  }, []);

  const ensureBitmaps = useCallback((center: number) => {
    const AHEAD = 36, KEEP = 52;
    const lo = Math.max(0, center - KEEP), hi = Math.min(FRAME_COUNT - 1, center + AHEAD);
    for (let i = lo; i <= hi; i++) {
      if (bitmapsRef.current.has(i) || decodingRef.current.has(i)) continue;
      const img = imagesRef.current[i];
      if (!img) continue;
      decodingRef.current.add(i);
      createImageBitmap(img).then((b) => {
        decodingRef.current.delete(i);
        if (Math.abs(i - currentRef.current) > KEEP) { b.close(); return; }
        bitmapsRef.current.set(i, b);
        if (i === Math.round(currentRef.current)) drawFrame(i, true);
      }).catch(() => decodingRef.current.delete(i));
    }
    for (const k of Array.from(bitmapsRef.current.keys())) {
      if (k < center - KEEP || k > center + KEEP) {
        bitmapsRef.current.get(k)?.close();
        bitmapsRef.current.delete(k);
      }
    }
  }, [drawFrame]);

  // Loader: concurrency-capped pump, opening run first.
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const failed = new Set<number>();
    const order: number[] = [];
    for (let i = 0; i < 48; i++) order.push(i);           // opening run first
    for (let i = 48; i < FRAME_COUNT; i++) order.push(i); // then the rest
    let cursor = 0;
    const CONC = 10;

    let inFlight = 0;
    const next = () => {
      if (cancelled) return;
      while (inFlight < CONC && cursor < order.length) {
        const idx = order[cursor++];
        if (imagesRef.current[idx] || failed.has(idx)) continue;
        inFlight++;
        const img = new Image();
        img.decoding = 'async';
        img.src = FRAME_PATH(idx);
        img.onload = () => {
          imagesRef.current[idx] = img;
          loaded++;
          inFlight--;
          if (loaded % 24 === 0) setLoadPct(Math.round((loaded / FRAME_COUNT) * 100));
          if (loaded >= 24 && !ready) setReady(true);
          if (loaded === FRAME_COUNT) setLoadPct(100);
          next();
        };
        img.onerror = () => {
          inFlight--;
          failed.add(idx);
          // one retry after a short delay; transient hiccups shouldn't leave holes
          setTimeout(() => {
            if (cancelled) return;
            failed.delete(idx);
            order.push(idx);
            next();
          }, 1500);
          next();
        };
      }
    };
    next();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll + render loop
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const JUMP = new URLSearchParams(location.search).get('jump');
    if (JUMP !== null) history.scrollRestoration = 'manual';

    const canvas = canvasRef.current!;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.0); // source is 1024w; 1:1 beats upscale
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      displayedRef.current = -1;
    };
    resize();
    window.addEventListener('resize', resize);

    const measure = () => {
      const el = driverRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -r.top / (r.height - window.innerHeight)));
      targetRef.current = p * (FRAME_COUNT - 1);
      setProgress(p);
    };

    // header luminance sampling
    const lumCanvas = document.createElement('canvas');
    lumCanvas.width = 16; lumCanvas.height = 4;
    const lumCtx = lumCanvas.getContext('2d');
    let lastLum = 0;
    const sampleLum = (now: number) => {
      if (now - lastLum < 180 || !lumCtx || !canvas.width) return;
      lastLum = now;
      try {
        lumCtx.drawImage(canvas, 0, 0, canvas.width, Math.min(canvas.height, 80), 0, 0, 16, 4);
        const d = lumCtx.getImageData(0, 0, 16, 4).data;
        let sum = 0;
        for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        setOnLight(sum / (d.length / 4) > 138);
      } catch { /* ignore */ }
    };

    const tick = (now: number) => {
      measure();
      if (reduced) {
        currentRef.current = targetRef.current;
      } else {
        currentRef.current += (targetRef.current - currentRef.current) * 0.14;
      }
      const idx = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(currentRef.current)));
      ensureBitmaps(idx);
      drawFrame(idx);
      sampleLum(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    if (JUMP !== null) {
      const y = +JUMP || 0;
      setTimeout(() => {
        window.scrollTo(0, y);
        measure();
        currentRef.current = targetRef.current;
        drawFrame(Math.round(currentRef.current), true);
      }, 50);
    }

    const readyTimer = setInterval(() => {
      if (imagesRef.current.slice(0, 24).every(Boolean)) {
        (window as unknown as { __ready?: boolean }).__ready = true;
        clearInterval(readyTimer);
      }
    }, 200);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      clearInterval(readyTimer);
    };
  }, [drawFrame, ensureBitmaps]);

  const chapter = [...CHAPTERS].reverse().find((c) => progress >= c.at) ?? CHAPTERS[0];
  const chapterIdx = CHAPTERS.indexOf(chapter);

  const beats: Beat[] = [
    {
      inn: -0.1, peak: 0.0, out: 0.16,
      children: (
        <>
          <Badge className="mx-auto mb-7 text-[10px] h-6 px-4 bg-white/[0.03] border border-white/15 text-[#2EC4C6] rounded-full uppercase tracking-[0.28em] backdrop-blur">
            <span className="w-1 h-1 rounded-full bg-[#2EC4C6] pulse-dot mr-2.5" />
            Institutional Commercial Space Intelligence
          </Badge>
          <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-light text-white tracking-[-0.03em] leading-[1.05]">
            The Commercial Space Economy,
            <span className="block mt-3 font-semibold cosmic-text tracking-[-0.02em]">Decoded.</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-300 mt-7 leading-relaxed max-w-xl mx-auto [text-shadow:0_1px_18px_rgba(0,0,0,0.6)]">
            Practical market intelligence, unit economics, and capital pathways for commercial space founders, operators, career-aware talent, and PE/VC investors.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link href="/opportunities">
              <Button className="w-full sm:w-auto bg-[#2EC4C6] hover:bg-[#35D0D2] text-[#04222A] font-semibold h-12 px-9 rounded-lg text-sm transition-all duration-300 hover:shadow-[0_0_28px_rgba(46,196,198,0.28)] active:scale-[0.98]">
                <IconRocket className="w-4 h-4 mr-2" /> Explore Opportunities
              </Button>
            </Link>
            <Link href="#inside">
              <Button variant="outline" className="w-full sm:w-auto border-white/15 bg-white/[0.03] text-gray-200 hover:text-white hover:border-[#2EC4C6]/50 hover:bg-white/[0.05] h-12 px-9 rounded-lg text-sm backdrop-blur transition-all duration-300">
                <IconBook className="w-4 h-4 mr-2" /> See What&apos;s Inside
              </Button>
            </Link>
          </div>
        </>
      ),
    },
    {
      inn: 0.22, peak: 0.30, out: 0.40, align: 'left',
      children: (
        <>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#2EC4C6] mb-4">Orbital Infrastructure</p>
          <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-[1.08]">Every station is a supply chain.</h2>
          <p className="text-sm text-gray-300 mt-4 max-w-md leading-relaxed [text-shadow:0_1px_18px_rgba(0,0,0,0.6)]">We map the vendors, the bottlenecks, and the unit economics behind the hardware going up.</p>
        </>
      ),
    },
    {
      inn: 0.48, peak: 0.56, out: 0.66, align: 'right',
      children: (
        <>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#2EC4C6] mb-4">Resources & Extraction</p>
          <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-[1.08]">Asteroids are balance sheets.</h2>
          <p className="text-sm text-gray-300 mt-4 max-w-md leading-relaxed [text-shadow:0_1px_18px_rgba(0,0,0,0.6)]">Ore grades, delta-v budgets, and $/kg delivered: the math that decides which deposits matter.</p>
        </>
      ),
    },
    {
      inn: 0.72, peak: 0.80, out: 0.90, align: 'left',
      children: (
        <>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#2EC4C6] mb-4">Capital Formation</p>
          <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-[1.08]">The build-out needs backers who read the numbers.</h2>
          <p className="text-sm text-gray-300 mt-4 max-w-md leading-relaxed [text-shadow:0_1px_18px_rgba(0,0,0,0.6)]">Capital requirements, equity benchmarks, and ROI outlooks for every venture class.</p>
        </>
      ),
    },
  ];

  return (
    <div ref={driverRef} className="relative" style={{ height: '520vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* film grain + vignette, fading with the handoff */}
        <div className="absolute inset-0 pointer-events-none film-vignette" style={{ opacity: progress > 0.92 ? Math.max(0, 1 - (progress - 0.92) / 0.08) : 1 }} />

        {/* loading veil */}
        {!ready && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#04070d]">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#2EC4C6] mb-4">Spacenomics</p>
            <div className="w-48 h-px bg-white/10 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-[#2EC4C6] transition-all duration-300" style={{ width: `${loadPct}%` }} />
            </div>
            <p className="text-[10px] text-gray-600 mt-3 tracking-widest">{loadPct}%</p>
          </div>
        )}

        {/* adaptive chrome */}
        <div
          ref={headerRef}
          className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 sm:px-10 py-5 transition-colors duration-500 ${onLight ? 'text-[#04222A]' : 'text-white'}`}
        >
          <div className="flex items-center gap-3 [text-shadow:0_1px_14px_rgba(0,0,0,0.45)]">
            <span className="text-sm font-semibold tracking-[0.22em] uppercase">Spacenomics</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] opacity-80">
            <span>{chapter.label}</span>
            <span className="relative w-24 h-px bg-current/20 overflow-hidden">
              <span className="absolute inset-y-0 left-0 bg-[#2EC4C6]" style={{ width: `${progress * 100}%` }} />
            </span>
            <span>{String(chapterIdx + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}</span>
          </div>
        </div>
        {/* header scrim */}
        <div className="absolute top-0 inset-x-0 h-36 z-10 pointer-events-none bg-gradient-to-b from-black/55 to-transparent" />

        {/* beat overlays */}
        {beats.map((b, i) => {
          const a = beatAlpha(progress, b);
          const alignCls =
            b.align === 'left'
              ? 'items-start text-left pl-6 sm:pl-16 lg:pl-24 pr-6'
              : b.align === 'right'
                ? 'items-end text-right pr-6 sm:pr-16 lg:pr-24 pl-6'
                : 'items-center text-center px-6';
          const wrapperCls = b.align === 'left' || b.align === 'right' ? 'w-full max-w-3xl' : 'max-w-3xl';
          return (
            <div
              key={i}
              className={`absolute inset-0 z-10 flex flex-col justify-center ${alignCls}`}
              style={{
                opacity: a,
                transform: `translateY(${(1 - a) * 24}px)`,
                transition: 'opacity 80ms linear',
                pointerEvents: i === 0 && a > 0.5 ? 'auto' : 'none',
              }}
            >
              <div className={`relative ${wrapperCls} beat-scrim py-10`}>{b.children}</div>
            </div>
          );
        })}

        {/* scroll cue */}
        {progress < 0.03 && ready && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-[0.25em] scroll-cue">
            Scroll <ChevronDown className="w-3.5 h-3.5" />
          </div>
        )}

        {/* seam handoff into content */}
        <div
          className="absolute bottom-0 inset-x-0 h-64 z-[5] pointer-events-none"
          style={{
            opacity: progress > 0.92 ? Math.min(1, (progress - 0.92) / 0.08) : 0,
            background: 'linear-gradient(to bottom, transparent, #040f1b)',
          }}
        />
      </div>
    </div>
  );
}
