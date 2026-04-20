'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

type Slide = {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
};

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const current = slides[index];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 shadow-soft">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.imageUrl + index}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="relative h-[280px] sm:h-[360px] lg:h-[480px]"
        >
          <Image src={current.imageUrl} alt={current.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Jami Masjid Noori</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-white sm:text-5xl">{current.title}</h1>
            {current.subtitle ? <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-lg">{current.subtitle}</p> : null}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-y-0 left-0 flex items-center p-4">
        <button type="button" onClick={() => setIndex((value) => (value - 1 + slides.length) % slides.length)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center p-4">
        <button type="button" onClick={() => setIndex((value) => (value + 1) % slides.length)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
