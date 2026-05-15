import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Feather, Search, Trash2, Edit2, Share2, HandHelping } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sanitizeHTML } from '../lib/security';

export default function JPW() {
    const { user, profile } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const [words, setWords] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchWords = async () => {
        const { data } = await supabase.from('prophetic_words').select('*').order('created_at', { ascending: false });
        if (data) setWords(data);
    };

    useEffect(() => {
        if (!user) return;
        fetchWords();
        
        const channel = supabase.channel('public:prophetic_words')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prophetic_words' }, () => {
                fetchWords();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const togglePrayer = async (word: any) => {
        if (!user) return;
        await supabase.from('prophetic_words').update({
            prayer_count: (word.prayer_count || 0) + 1
        }).eq('id', word.id);
    };

    const deleteWord = async (id: string) => {
        if (!isAdmin) return;
        if (confirm('Are you sure you want to delete this declaration?')) {
            await supabase.from('prophetic_words').delete().eq('id', id);
        }
    };

    const shareWord = (word: any) => {
       if (navigator.share) {
           // Strip HTML tags for sharing
           const plainText = word.content.replace(/<[^>]*>?/gm, '');
           navigator.share({
               title: word.title,
               text: `${plainText}\n\n- ${word.book} ${word.chapter}:${word.verse}`
           }).catch(console.error);
       } else {
           alert('Sharing not supported on this device');
       }
    };

    const filteredWords = words.filter(word => 
        word.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 mb-20 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
                    <Feather size={12} className="text-[var(--color-primary)]" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-black">Divine Declarations</span>
                 </div>
                 <h1 className="text-5xl md:text-7xl font-serif font-bold text-[var(--color-text)] tracking-tightest leading-[0.9]">JPW</h1>
                 <p className="text-[var(--color-text-muted)] text-lg md:text-xl font-serif max-w-2xl italic leading-relaxed">
                   "Explore the divine declarations and prophetic insights that shape our collective journey."
                 </p>
              </div>
            </div>
            
            {/* Search */}
            <div className="mb-8 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search declarations..." className="w-full p-4 pl-12 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-[var(--color-primary)]/30 backdrop-blur-md" />
            </div>

            {/* List */}
            <div className="space-y-6">
                <AnimatePresence>
                    {filteredWords.map(word => (
                        <motion.div key={word.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card group p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex-1 space-y-4">
                                <h3 className="text-2xl text-white font-serif font-bold tracking-tight">{word.title}</h3>
                                <div 
                                    className="markdown-body prose prose-invert max-w-none text-white/80 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(word.content) }}
                                />
                                <div className="pt-4 flex items-center gap-4">
                                    <span className="text-[10px] text-[var(--color-primary)] uppercase font-bold tracking-widest bg-[var(--color-primary)]/10 px-3 py-1 rounded-full border border-[var(--color-primary)]/20">
                                        {word.book} {word.chapter}:{word.verse}
                                    </span>
                                    {word.prayer_count > 0 && (
                                        <span className="text-[10px] text-white/40 flex items-center gap-1.5 font-medium italic text-balance">
                                            <HandHelping size={12} className="text-[var(--color-primary)]/60" /> 
                                            {word.prayer_count} souls praying in agreement
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex flex-row md:flex-col gap-3 justify-end md:justify-start">
                                <div className="flex flex-col items-center gap-1">
                                    <button 
                                        onClick={() => togglePrayer(word)} 
                                        className="p-3 md:p-4 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-black rounded-2xl flex flex-col items-center gap-1 transition-all duration-300 shadow-sm hover:shadow-neon"
                                        title="I am praying with this"
                                    >
                                        <HandHelping size={24} />
                                    </button>
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--color-primary)]/60">Pray</span>
                                </div>
                                
                                <button onClick={() => shareWord(word)} className="p-3 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Share Declaration">
                                    <Share2 size={20}/>
                                </button>
                                
                                {isAdmin && (
                                    <div className="flex flex-row md:flex-col gap-2 pt-2 md:mt-auto border-l md:border-l-0 md:border-t border-white/10 md:pt-4">
                                        <button onClick={() => deleteWord(word.id)} className="p-2 text-red-500/30 hover:text-red-500 transition-colors" title="Delete">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {filteredWords.length === 0 && (
                    <div className="text-center py-20 text-white/20">
                        <Feather size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No prophetic declarations found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
