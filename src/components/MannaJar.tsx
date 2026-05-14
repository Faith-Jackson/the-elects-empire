import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, Loader2, BookOpen, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const VERSES = [
  { verse: "Joshua 1:9", text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest." },
  { verse: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." },
  { verse: "Proverbs 3:5-6", text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths." },
  { verse: "Isaiah 40:31", text: "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint." },
  { verse: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me." },
  { verse: "Romans 8:28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { verse: "Jeremiah 29:11", text: "For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end." },
  { verse: "Matthew 6:33", text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you." },
  { verse: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { verse: "2 Timothy 1:7", text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind." }
];

export default function MannaJar() {
  const { user } = useAuth();
  const [manna, setManna] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);

  const fetchTodayManna = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('manna_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('day', today)
      .single();
    
    if (data) setManna(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTodayManna();
  }, [user]);

  const drawManna = async () => {
    if (!user) return;
    setDrawing(true);
    
    // Artificial delay for "mystical" effect
    await new Promise(r => setTimeout(r, 1500));

    const randomVerse = VERSES[Math.floor(Math.random() * VERSES.length)];
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase.from('manna_history').insert([{
      user_id: user.id,
      day: today,
      verse: randomVerse.verse,
      rhema: randomVerse.text
    }]).select().single();

    if (!error && data) {
      setManna(data);
    }
    setDrawing(false);
  };

  if (loading && user) return <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-[var(--color-primary)]" /></div>;

  return (
    <div className="glass-panel p-8 rounded-[3rem] border border-white/10 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all scale-150 rotate-12">
        <Sparkles size={120} />
      </div>

      <div className="relative z-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-[0.2em]">
          <Sparkles size={12} /> Daily Manna
        </div>

        <AnimatePresence mode="wait">
          {!manna ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-serif font-bold text-white">Draw your portion for today.</h2>
              <p className="text-white/40 max-w-sm mx-auto italic">"Give us this day our daily bread..."</p>
              <button 
                onClick={drawManna}
                disabled={drawing}
                className="group relative px-12 py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-xs overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {drawing ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                  {drawing ? 'Gleaning...' : 'Draw Manna'}
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent shadow-inner"
                  animate={drawing ? { x: ['-100%', '100%'] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="relative inline-block">
                <Quote size={40} className="text-[var(--color-primary)]/20 absolute -top-4 -left-6" />
                <h3 className="text-2xl font-serif italic text-white/90 leading-relaxed max-w-xl mx-auto">
                  "{manna.rhema}"
                </h3>
              </div>
              <div className="pt-4">
                <div className="text-[var(--color-primary)] font-black text-lg uppercase tracking-widest border-t border-white/10 pt-4 inline-block">
                  {manna.verse}
                </div>
              </div>
              <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Your portion for {new Date(manna.day).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
