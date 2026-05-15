import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, GraduationCap, ChevronRight, Search, Filter, Bookmark, Clock, Star, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface StudyGuide {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  author: string;
  read_time: string;
  difficulty: string;
  rating: number;
  image_url: string;
  ebook_id: string;
}

export default function StudyGuides() {
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const { data, error } = await supabase
          .from('study_guides')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data) setGuides(data);
        if (error) throw error;
      } catch (err) {
        console.error('Error fetching guides:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  const filteredGuides = guides.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 mb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
              <GraduationCap size={12} className="text-[var(--color-primary)]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-black">Imperial Knowledge</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-serif font-bold text-[var(--color-text)] tracking-tightest leading-[0.9]">Study Guides</h1>
           <p className="text-[var(--color-text-muted)] text-lg md:text-xl font-serif max-w-2xl italic leading-relaxed">
             "Structured paths for deepening your walk with the Master."
           </p>
        </div>

        <div className="flex gap-2 h-fit">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] rounded-2xl focus:outline-none focus:border-[var(--color-primary)]/40 focus:ring-1 focus:ring-[var(--color-primary)]/40 transition-all w-full md:w-64"
            />
          </div>
          <button className="p-3 bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] rounded-2xl text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-[var(--color-primary)]">
          <Loader2 className="animate-spin" size={48} />
          <span className="text-[10px] uppercase font-black tracking-widest">Loading Study Guides...</span>
        </div>
      ) : filteredGuides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGuides.map((guide, idx) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative"
            >
              <Link to={`/ebook/${guide.id}`} className="block">
                <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-[var(--color-border-subtle)] group-hover:border-[var(--color-primary)]/40 transition-all duration-500 hover:shadow-neon-glow">
                  {/* Image Header */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={guide.image_url} 
                      alt={guide.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] uppercase tracking-widest text-white border border-white/20 font-black">
                        {guide.category}
                      </span>
                      <div className="flex items-center gap-1 text-[var(--color-primary)] bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
                        <Star size={10} fill="currentColor" />
                        <span className="text-[10px] font-bold">{guide.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="mb-4">
                      <h3 className="text-2xl font-serif font-black text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors mb-2 leading-tight">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)] italic font-medium">"{guide.subtitle}"</p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border-subtle)]">
                      <div className="flex items-center gap-4 text-[var(--color-text-muted)]">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{guide.read_time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{guide.difficulty}</span>
                        </div>
                      </div>
                      
                      <button className="p-3 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-2xl group-hover:bg-[var(--color-primary)] group-hover:text-black transition-all shadow-neon-glow">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[var(--color-text)]/5 rounded-[3rem] border border-dashed border-[var(--color-border-subtle)]">
          <BookOpen className="mx-auto text-[var(--color-text-muted)] mb-4" size={48} />
          <p className="text-[var(--color-text-muted)] italic">No guides available in this section.</p>
        </div>
      )}

      {/* Suggestion Card */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-16 glass-panel p-10 rounded-[3rem] border border-dashed border-[var(--color-primary)]/20 text-center space-y-4"
      >
        <BookOpen size={48} className="mx-auto text-[var(--color-primary)]/40" />
        <h2 className="text-2xl font-serif font-bold text-[var(--color-text)]">Need a Custom Guide?</h2>
        <p className="text-[var(--color-text-muted)] max-w-lg mx-auto italic text-sm">
          "The entrance of thy words giveth light; it giveth understanding unto the simple."
        </p>
        <div className="pt-4">
             <Link 
               to="/ai"
               className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-primary)] text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-neon"
             >
               Consult Scribe <ChevronRight size={18} />
             </Link>
        </div>
      </motion.div>
    </div>
  );
}
