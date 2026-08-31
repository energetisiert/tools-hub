import type { ReactNode } from 'react';

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] border border-black/[0.08] bg-white p-[22px] sm:p-[28px]">
      {title && <h1 className="font-disp mb-5 text-[22px] font-bold tracking-tight text-ink">{title}</h1>}
      {children}
    </section>
  );
}
