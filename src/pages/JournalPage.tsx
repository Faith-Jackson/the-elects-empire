import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, BookOpen, Clock, ChevronRight, User as UserIcon, Star, Calendar, Database, Sparkles, FileText, Book, Video, Users, BookMarked, Feather, UserPlus, MessageSquare, HandHelping, ListChecks, BookOpenText, BrainCircuit, Lightbulb, Save, Heart, Loader2, History, X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateJournalEncouragement } from '../services/groqService';
import ReactMarkdown from 'react-markdown';

interface JournalEntry {
  id: string;
  content: string;
  created_at: any;
  ai_response?: {
    verse: string;
    encouragement: string;
  };
}

export default function JournalPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  const fetchEntries = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) setEntries(data as JournalEntry[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchEntries();
    const channel = supabase.channel(`public:journals:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journals', filter: `user_id=eq.${user.id}` }, () => fetchEntries())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const saveEntry = async () => {
    if (!user || !content.trim()) return;
    setIsSaving(true);
    try {
      const aiResponse = await generateJournalEncouragement(content);
      const { data, error } = await supabase.from('journals').insert([{
        user_id: user.id,
        content,
        ai_response: aiResponse,
        created_at: new Date().toISOString()
      }]).select().single();

      if (data) {
        setContent('');
        setActiveEntry(data as JournalEntry);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this reflection?")) return;
    await supabase.from('journals').delete().eq('id', id);
    if (activeEntry?.id === id) setActiveEntry(null);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col md:flex-row h-full md:h-[calc(100vh-72px)] bg-transparent">
      {/* Sidebar: History */}
      <div className="w-full md:w-80 border-r border-white/5 overflow-y-auto p-6 space-y-6 hidden md:block">
        <div className="flex items-center gap-2 mb-6">
          <History size={18} className="text-[var(--color-primary)]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-white/60">Journal History</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white/20" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 text-[10px] uppercase tracking-widest text-white/20">Your pages are empty...</div>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <button 
                key={entry.id}
                onClick={() => setActiveEntry(entry)}
                className={`w-full text-left p-4 rounded-2xl transition-all group border ${activeEntry?.id === entry.id ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
              >
                <p className="text-xs font-serif italic text-white line-clamp-2 mb-2">"{entry.content}"</p>
                <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-white/30 truncate">
                  <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={10} className="hover:text-red-400" onClick={(e) => deleteEntry(entry.id, e)} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Area: Writing & Response */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 pb-32">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Write New */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--color-primary)]/10 rounded-2xl text-[var(--color-primary)]">
                <Pencil size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Reflect & Dwell</h1>
                <p className="text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest mt-1">Write your heart's burdens or joys. Scribe will support you.</p>
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-8 border border-white/10 focus-within:ring-2 focus-within:ring-[var(--color-primary)]/50 transition-all shadow-2xl relative">
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Pour out your soul here..."
                className="w-full h-48 bg-transparent text-white font-serif text-lg md:text-xl italic leading-relaxed placeholder:text-white/10 resize-none outline-none"
              />
              <div className="flex justify-between items-center mt-6 border-t border-white/5 pt-6">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">
                   {content.length} Characters recorded
                </p>
                <button 
                  onClick={saveEntry}
                  disabled={isSaving || !content.trim()}
                  className="px-8 py-3 bg-[var(--color-primary)] text-[var(--color-background)] rounded-full font-bold shadow-neon-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? "Seeking Wisdom..." : "Seal Reflection"}
                </button>
              </div>
            </div>
          </section>

          {/* Active Entry / AI Response */}
          <AnimatePresence mode="wait">
            {activeEntry && (
              <motion.section 
                key={activeEntry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 text-white/30 pt-8 border-t border-white/5">
                   <div className="h-px flex-1 bg-white/5"></div>
                   <span className="text-[10px] uppercase font-black tracking-widest whitespace-nowrap">Divine Response</span>
                   <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* The Entry */}
                  <div className="glass-card p-8 rounded-3xl border border-white/5 bg-white/2 space-y-4">
                    <div className="flex items-center gap-3 text-white/40 mb-2">
                       <Clock size={14} />
                       <span className="text-[10px] uppercase tracking-widest font-bold">Recorded Reflection</span>
                    </div>
                    <p className="text-lg font-serif italic text-white/80 leading-relaxed">
                      "{activeEntry.content}"
                    </p>
                  </div>

                  {/* The AI Encouragement */}
                  <div className="glass-panel p-8 rounded-[2rem] border border-[var(--color-primary)]/20 shadow-neon-glow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <Sparkles size={120} className="text-[var(--color-primary)]" />
                    </div>
                    
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--color-primary)]/20 rounded-xl text-[var(--color-primary)]">
                          <Heart size={20} className="fill-[var(--color-primary)]/30" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--color-primary)]">Elects Encouragement</span>
                      </div>

                      <blockquote className="space-y-4">
                        <div className="relative h-1 w-12 bg-[var(--color-primary)] rounded-full mb-4"></div>
                        <p className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight leading-tight">
                          {activeEntry.ai_response?.verse}
                        </p>
                        <p className="text-sm md:text-base text-white/70 leading-relaxed font-sans italic">
                          "{activeEntry.ai_response?.encouragement}"
                        </p>
                      </blockquote>
                      
                      <div className="pt-4 flex items-center justify-between">
                         <span className="text-[9px] text-white/20 uppercase font-black tracking-[0.3em]">Grace be with you</span>
                         <button className="text-[10px] font-bold text-[var(--color-primary)] uppercase hover:underline">Share Light</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
