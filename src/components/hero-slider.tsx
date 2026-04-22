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
  const [isPaused, setIsPaused] = useState(false);

  // ✅ Auto slide (pause supported)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  if (!slides.length) {
    return (
      <section className="relative grid h-[280px] place-items-center overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50 shadow-soft sm:h-[360px] lg:h-[480px] dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30">
        <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
          No Image Found
        </p>
      </section>
    );
  }

  const current = slides[index];

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border border-white/20 shadow-soft ring-1 ring-black/5 dark:border-white/10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.imageUrl + index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="relative h-[280px] sm:h-[360px] lg:h-[480px]"
        >
          <Image
            src={current.imageUrl}
            alt={current.title}
            fill
            className="object-cover"
            priority
          />

          {/* overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* content */}
          <div className="absolute bottom-0 p-6 sm:p-10 text-white">
            <h1 className="text-3xl sm:text-5xl font-black">
              {current.title}
            </h1>
            {current.subtitle && (
              <p className="mt-2 text-sm sm:text-lg">
                {current.subtitle}
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* LEFT BUTTON */}
      <div className="absolute inset-y-0 left-0 flex items-center p-4">
        <button
          onClick={() => {
            setIsPaused(true);
            setIndex((prev) => (prev - 1 + slides.length) % slides.length);
          }}
          className="grid h-11 w-11 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
        >
          <ChevronLeft />
        </button>
      </div>

      {/* RIGHT BUTTON */}
      <div className="absolute inset-y-0 right-0 flex items-center p-4">
        <button
          onClick={() => {
            setIsPaused(true);
            setIndex((prev) => (prev + 1) % slides.length);
          }}
          className="grid h-11 w-11 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}