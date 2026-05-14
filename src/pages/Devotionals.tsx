import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LinkifiedText } from '../components/LinkifiedText';
import { motion } from 'motion/react';
import { BookOpen, Calendar, Quote, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';

interface Devotional {
  id: string;
  title: string;
  content: string;
  publish_date: string;
  created_at: string;
}

export default function Devotionals() {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the most recent devotional
    const fetchDevotional = async () => {
      const { data } = await supabase
        .from('devotionals')
        .select('*')
        .order('publish_date', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setDevotional(data[0] as Devotional);
      }
      setLoading(false);
    };

    fetchDevotional();

    const channel = supabase
      .channel('public:devotionals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devotionals' }, () => fetchDevotional())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32 animate-fade-in min-h-screen">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-neon-glow ring-1 ring-[var(--color-primary)]/20 animate-pulse">
          <Sparkles size={24} />
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-[var(--color-text)] tracking-tight">Life & Immortality</h1>
      </div>

      {loading ? (
        <div className="py-32 text-center">
          <p className="font-serif italic text-2xl text-[var(--color-text-muted)]/30 animate-pulse">Preparing today's word...</p>
        </div>
      ) : devotional ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          {/* Main Card */}
          <div className="glass-panel rounded-[40px] p-8 md:p-14 border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/50 relative overflow-hidden shadow-2xl">
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--color-primary)]/10 blur-[100px] rounded-full" />
            
            <div className="flex items-center gap-3 mb-10 text-[var(--color-text-muted)] font-bold uppercase tracking-[0.2em] text-[10px]">
              <Calendar size={14} className="text-[var(--color-primary)]" />
              <span>{new Date(devotional.publish_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-serif font-bold text-[var(--color-text)] mb-10 leading-tight">
              {devotional.title}
            </h2>

            <div className="relative mb-12">
              <Quote className="absolute -top-8 -left-8 text-[var(--color-primary)]/10 w-24 h-24" />
              <div className="markdown-body prose dark:prose-invert prose-p:text-xl md:prose-p:text-2xl prose-p:font-serif prose-p:italic prose-p:text-[var(--color-text)]/90 prose-p:leading-relaxed border-l-4 border-[var(--color-primary)]/40 pl-8">
                 <Markdown
                  components={{
                    p: ({children}) => <p className="mb-4"><LinkifiedText text={String(children)} /></p>
                  }}
                >
                  {devotional.content}
                </Markdown>
              </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] flex items-center justify-center">
                  <BookOpen size={16} className="text-[var(--color-text-muted)]" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] opacity-50">Theme for Today</p>
                  <p className="text-xs font-bold text-[var(--color-text-muted)]">Spiritual Growth</p>
                </div>
              </div>
              <button className="px-6 py-3 rounded-2xl bg-[var(--color-text)]/5 hover:bg-[var(--color-text)]/10 border border-[var(--color-border-subtle)] text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest transition-all active:scale-95">
                Share Blessing
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
             <p className="text-[var(--color-text-muted)]/20 text-[10px] uppercase tracking-[0.3em] font-black">Reflect • Meditate • Pray</p>
          </div>
        </motion.div>
      ) : (
        <div className="glass-panel p-12 rounded-[40px] border border-dashed border-[var(--color-border-subtle)] text-center">
           <p className="font-serif italic text-2xl text-[var(--color-text-muted)]/20">No devotional published for today yet.</p>
        </div>
      )}
    </div>
  );
}
