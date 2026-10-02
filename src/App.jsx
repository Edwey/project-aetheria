import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Scene from './components/canvas/Scene';
import HUD from './components/dom/HUD';

export default function App() {
  const veil = useRef(null);
  const [veilOn, setVeilOn] = useState(true);

  useEffect(() => {
    if (!veil.current) return;
    const ctx = gsap.context(() => {
      gsap.to(veil.current, {
        opacity: 0,
        duration: 0.9,
        delay: 0.4,
        ease: 'power2.out',
        onComplete: () => setVeilOn(false),
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#0b1020]">
      <h1 className="sr-only">Project Aetheria</h1>
      <Scene />
      <HUD />
      {veilOn && (
        <div
          ref={veil}
          className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d1222]"
        >
          <p className="font-display text-5xl tracking-wide text-[#f6ead7] drop-shadow-md">Aetheria</p>
          <p className="mt-2.5 font-ui text-xs uppercase tracking-[0.28em] text-[#5eead4]/80">
            Floating Archipelago
          </p>
        </div>
      )}
    </main>
  );
}
