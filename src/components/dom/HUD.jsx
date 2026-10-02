import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useWorldStore } from '../../stores/useWorldStore';

function formatCycle(progress) {
  const remaining = Math.max(0, 1 - progress);
  const totalSec = remaining * 12 * 60;
  const mins = Math.floor(totalSec / 60);
  const secs = Math.floor(totalSec % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function HUD() {
  const root = useRef(null);
  const isDay = useWorldStore((s) => s.isDay);
  const cycleProgress = useWorldStore((s) => s.cycleProgress);

  useEffect(() => {
    if (!root.current) return;
    gsap.fromTo(
      root.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', delay: 0.9 },
    );
  }, []);

  return (
    <header
      ref={root}
      className="pointer-events-none absolute left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-3.5 rounded-2xl border border-white/10 bg-[#161b2e]/80 px-4 py-2.5 text-[#f6ead7] shadow-[0_12px_36px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
        <svg width="24" height="24" viewBox="0 0 28 28" aria-hidden className="shrink-0">
          {isDay ? (
            <>
              <circle cx="14" cy="14" r="6.5" fill="#fbbf24" />
              <circle cx="12.2" cy="12.4" r="2.2" fill="#fffbeb" opacity="0.8" />
            </>
          ) : (
            <>
              <circle cx="14.5" cy="13.5" r="6.5" fill="#a5b4fc" />
              <circle cx="17.5" cy="11.5" r="5" fill="#161b2e" />
            </>
          )}
        </svg>
      </div>
      <div className="min-w-[9.5rem]">
        <div className="flex items-center justify-between">
          <p className="font-display text-[0.95rem] tracking-wide text-[#f6ead7]">
            {isDay ? 'High Sun' : 'Biolume Night'}
          </p>
          <span className="font-ui text-[0.72rem] tracking-wider text-[#5eead4]">
            {isDay ? 'DAY' : 'EVE'}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#5eead4] transition-[width] duration-300 ease-out"
            style={{ width: `${cycleProgress * 100}%` }}
          />
        </div>
      </div>
      <p className="font-ui text-[0.82rem] font-medium tabular-nums text-white/80">
        {formatCycle(cycleProgress)}
      </p>
    </header>
  );
}
