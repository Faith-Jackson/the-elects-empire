import { Link } from 'react-router-dom';
import { Home, BookOpen, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center"
    >
      <div className="space-y-8 max-w-lg">
        {/* Glowing 404 */}
        <div className="relative">
          <h1 className="text-[10rem] font-serif font-black text-[var(--color-text)]/5 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-[var(--color-primary)]/10 rounded-3xl flex items-center justify-center shadow-neon-glow">
              <Search size={36} className="text-[var(--color-primary)]" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-black">Territory Unknown</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[var(--color-text)]">
            This path is not in the Empire
          </h2>
          <p className="text-[var(--color-text-muted)] text-lg font-serif italic leading-relaxed">
            "The steps of a good man are ordered by the Lord." — Psalm 37:23
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/"
            className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-background)] px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-neon-glow"
          >
            <Home size={16} /> Return Home
          </Link>
          <Link
            to="/read"
            className="flex items-center gap-2 bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] text-[var(--color-text)] px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[var(--color-text)]/10 transition-all"
          >
            <BookOpen size={16} /> Open the Word
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
