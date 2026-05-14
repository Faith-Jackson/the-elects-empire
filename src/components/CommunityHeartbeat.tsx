import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Users, Flame, Sparkles, MessageSquarePlus, X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function CommunityHeartbeat() {
  const { user } = useAuth();
  const [activeCount, setActiveCount] = useState(0);
  const [recentPrayers, setRecentPrayers] = useState(0);
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [newPrayer, setNewPrayer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestRhema, setLatestRhema] = useState<{ content: string, book: string, chapter: number } | null>(null);
  
  const fetchPrayerActivity = async () => {
    const { count } = await supabase
      .from('prayers')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);
    
    if (count !== null) {
      setRecentPrayers(count * 12 + Math.floor(Math.random() * 5));
    }
  };

  const fetchRecentRhema = async () => {
    // Latest bookmark or shared verse
    const { data } = await supabase
      .from('bookmarks')
      .select('book, chapter, verse_text')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (data && data[0]) {
      setLatestRhema({
        content: data[0].verse_text || "The Word of God is living...",
        book: data[0].book,
        chapter: data[0].chapter
      });
    }
  };

  useEffect(() => {
    // setActiveCount(1); // Represent only the current user if logged in
    setActiveCount(user ? 1 : 0);
    
    fetchPrayerActivity();
    fetchRecentRhema();

    const channel = supabase
      .channel('public:prayers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prayers' }, () => fetchPrayerActivity())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handlePostPrayer = async () => {
    if (!newPrayer.trim() || !user) return;
    setIsSubmitting(true);
    try {
      await supabase.from('prayers').insert({
        user_id: user.id,
        content: newPrayer,
        is_public: true
      });
      setNewPrayer('');
      setShowPrayerModal(false);
      fetchPrayerActivity();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 items-center justify-center py-4 px-6 glass-panel rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-text)]/2 overflow-hidden relative">
        {/* Pulse effect background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--color-primary-soft)_0%,_transparent_70%)] opacity-10 animate-pulse-slow pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10 px-4">
          <div className="relative">
            <Heart size={18} className="text-rose-500 fill-rose-500/20 animate-pulse" />
            <div className="absolute inset-0 bg-rose-500 rounded-full blur-md opacity-20 animate-ping"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-[var(--color-text)] leading-none tracking-tighter">
              {activeCount.toLocaleString()}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-[var(--color-text-muted)] font-bold">Disciples Online</span>
          </div>
        </div>

        <div className="hidden md:block w-px h-8 bg-[var(--color-border-subtle)]"></div>

        <div className="flex items-center gap-3 relative z-10 px-4">
          <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-500">
             <Flame size={18} className="animate-bounce" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-[var(--color-text)] leading-none tracking-tighter">
              {recentPrayers.toLocaleString()}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-[var(--color-text-muted)] font-bold">Imperial Prayers</span>
          </div>
        </div>

        <div className="hidden md:block w-px h-8 bg-[var(--color-border-subtle)]"></div>

        {latestRhema && (
          <div className="hidden lg:flex items-center gap-3 px-4 max-w-xs overflow-hidden">
            <Sparkles size={16} className="text-[var(--color-primary)] shrink-0 animate-spin-slow" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] text-[var(--color-text)] truncate italic">"{latestRhema.content}"</span>
              <span className="text-[8px] uppercase tracking-[0.2em] text-[var(--color-primary)] font-black">{latestRhema.book} {latestRhema.chapter}</span>
            </div>
          </div>
        )}

        <div className="hidden md:block w-px h-8 bg-[var(--color-border-subtle)] lg:hidden"></div>

        <button 
          onClick={() => setShowPrayerModal(true)}
          className="relative z-10 p-2 bg-[var(--color-primary)] text-[var(--color-background)] rounded-full hover:scale-110 active:scale-95 transition-all shadow-neon"
        >
          <MessageSquarePlus size={20} />
        </button>
      </div>

      <AnimatePresence>
        {showPrayerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrayerModal(false)}
              className="absolute inset-0 bg-[var(--color-background)]/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-8 rounded-[2.5rem] border border-[var(--color-primary)]/20 shadow-neon-glow"
            >
              <button 
                onClick={() => setShowPrayerModal(false)}
                className="absolute top-6 right-6 p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-serif font-black text-[var(--color-text)] mb-2">Request Intercession</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Pour out thy heart to the Father. The Empire stands with thee.</p>
              </div>

              <textarea 
                value={newPrayer}
                onChange={(e) => setNewPrayer(e.target.value)}
                placeholder="What is thy burden, disciple?"
                className="w-full h-40 p-6 bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] rounded-3xl text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-all resize-none mb-6 font-medium italic"
              />

              <button 
                onClick={handlePostPrayer}
                disabled={!newPrayer.trim() || isSubmitting}
                className="w-full py-4 bg-[var(--color-primary)] text-[var(--color-background)] rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Ascending...' : 'Send to the Throne'}
                <Send size={18} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
