
import { motion } from 'motion/react';
import React from 'react';

interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6 md:p-12 lg:p-20 space-y-10"
    >
      <header className="border-b border-[var(--color-border-subtle)] pb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[var(--color-text)] tracking-tight">
          {title}
        </h1>
      </header>
      
      <div className="prose prose-slate max-w-none text-[var(--color-text-muted)] leading-relaxed space-y-8">
        {children}
      </div>
    </motion.div>
  );
}
