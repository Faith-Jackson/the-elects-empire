import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Search, Filter, Calendar, User, Play, Info, ChevronRight, Hash } from 'lucide-react';
import CollectionCarousel from '../components/CollectionCarousel';
import LoveButton from '../components/LoveButton';

interface Sermon {
  id: string;
  title: string;
  preacher: string;
  series: string;
  embed_id: string;
  platform: 'spotify' | 'youtube' | 'apple' | 'soundcloud' | 'audio';
  description: string;
  date: string;
}

export default function SermonArchive() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string | 'All'>('All');
  const [activeSermon, setActiveSermon] = useState<Sermon | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const fetchSermons = async (collectionId?: string | null) => {
    setLoading(true);
    let data;
    if (collectionId) {
      const { data: itemIds } = await supabase
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', collectionId)
        .order('sort_order', { ascending: true });
      
      if (itemIds && itemIds.length > 0) {
        const { data: sermonData } = await supabase
          .from('sermons')
          .select('*')
          .in('id', itemIds.map(i => i.item_id));
        data = sermonData;
      }
    } else {
      const { data: sermonData } = await supabase
        .from('sermons')
        .select('*')
        .order('date', { ascending: false });
      data = sermonData;
    }
    
    if (data) setSermons(data as Sermon[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchSermons(selectedCollectionId);
  }, [selectedCollectionId]);

  useEffect(() => {
    const channel = supabase.channel('public:sermons').on('postgres_changes', { event: '*', schema: 'public', table: 'sermons' }, () => fetchSermons(selectedCollectionId)).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCollectionId]);

  const getEmbedUrl = (sermon: Sermon) => {
    switch (sermon.platform) {
      case 'youtube':
        return `https://www.youtube.com/embed/${sermon.embed_id}`;
      case 'apple':
        return `https://embed.podcasts.apple.com/us/podcast/${sermon.embed_id}`;
      case 'soundcloud':
        return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${sermon.embed_id}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
      case 'audio':
        return sermon.embed_id; // Direct audio URL
      case 'spotify':
      default:
        return `https://open.spotify.com/embed/episode/${sermon.embed_id}?utm_source=generator&theme=0`;
    }
  };

  const filteredSermons = sermons.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.preacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.series.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeries = selectedSeries === 'All' || s.series === selectedSeries;
    return matchesSearch && matchesSeries;
  });

  const seriesList = ['All', ...new Set(sermons.map(s => s.series).filter(Boolean))];

  if (loading) return <div className="p-8 flex justify-center text-[var(--color-primary)]">Unrolling the sermon scrolls...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 mb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
              <Mic size={12} className="text-[var(--color-primary)]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-black">Imperial Pulpit</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-serif font-bold text-[var(--color-text)] tracking-tightest leading-[0.9]">Sermons</h1>
           <p className="text-[var(--color-text-muted)] text-lg md:text-xl font-serif max-w-2xl italic leading-relaxed">
             "The vocal archives of the Empire. Faith comes by hearing."
           </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 h-fit">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text"
              placeholder="Search sermons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--color-primary)] transition-all md:w-64"
            />
          </div>
          <select 
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
          >
            {seriesList.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
          </select>
        </div>
      </div>

      <CollectionCarousel 
        contentType="sermon" 
        onCollectionSelect={(col) => setSelectedCollectionId(col ? col.id : null)} 
        selectedCollectionId={selectedCollectionId}
      />

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Sermon List */}
        <div className="lg:col-span-7 space-y-4">
          {filteredSermons.length > 0 ? (
            filteredSermons.map(sermon => (
              <motion.button 
                key={sermon.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setActiveSermon(sermon)}
                className={`w-full text-left glass-card p-6 rounded-[2rem] border transition-all flex items-center gap-6 group ${activeSermon?.id === sermon.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-neon-glow' : 'border-white/5 hover:border-white/20'}`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${activeSermon?.id === sermon.id ? 'bg-[var(--color-primary)] text-black' : 'bg-white/5 text-white/40'}`}>
                   {activeSermon?.id === sermon.id ? <Play className="fill-current" size={24} /> : <Mic size={24} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-primary)]">{sermon.series || 'Stand-alone Message'}</span>
                    <span className="text-[10px] text-white/20">/</span>
                    <span className="text-[10px] text-white/40">{new Date(sermon.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-[var(--color-primary)] transition-colors truncate">{sermon.title}</h3>
                  <div className="flex items-center justify-between mt-1 text-white/40 text-xs">
                     <span className="flex items-center gap-1"><User size={12} /> {sermon.preacher}</span>
                     <LoveButton itemId={sermon.id} itemType="sermon" />
                  </div>
                </div>

                <ChevronRight size={20} className="text-white/10 group-hover:text-[var(--color-primary)] transition-colors" />
              </motion.button>
            ))
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
               <Mic size={48} className="mx-auto text-white/10 mb-4" />
               <p className="text-white/30 italic">No sermons found matching your heart's search.</p>
            </div>
          )}
        </div>

        {/* Player / Detail View */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-8">
            <AnimatePresence mode="wait">
              {activeSermon ? (
                <motion.div 
                  key={activeSermon.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-panel p-8 rounded-[3rem] border border-[var(--color-primary)]/20 shadow-neon-glow space-y-6"
                >
                  <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-white/5">
                    {activeSermon.platform === 'audio' ? (
                      <div className="absolute inset-0 flex items-center justify-center p-8 bg-[var(--color-primary)]/5">
                        <audio controls className="w-full">
                          <source src={activeSermon.embed_id} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ) : (
                      <iframe 
                          src={getEmbedUrl(activeSermon)} 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                          allowFullScreen
                          loading="lazy"
                          className="absolute inset-0"
                      />
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Hash size={12} className="text-[var(--color-primary)]" />
                        <span className="text-[10px] uppercase font-black tracking-tighter text-[var(--color-primary)]">{activeSermon.series}</span>
                      </div>
                      <h2 className="text-2xl font-serif font-bold text-white">{activeSermon.title}</h2>
                      <LoveButton itemId={activeSermon.id} itemType="sermon" />
                      <p className="text-sm text-white/60 mt-2 italic font-serif leading-relaxed">
                        {activeSermon.description || 'Listen to this powerful message from the pulpit.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                       <div className="space-y-1">
                          <label className="text-[8px] uppercase font-black text-white/30 tracking-widest">Preacher</label>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                             <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-[var(--color-primary)]">
                                <User size={12} />
                             </div>
                             {activeSermon.preacher}
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] uppercase font-black text-white/30 tracking-widest">Delivered On</label>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                             <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-[var(--color-primary)]">
                                <Calendar size={12} />
                             </div>
                             {new Date(activeSermon.date).toLocaleDateString()}
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-panel p-12 rounded-[3rem] border border-white/5 text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                     <Play size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-white/80">Ready to Listen?</h3>
                    <p className="text-sm text-white/40 mt-2 max-w-xs mx-auto">Select a message from the archive to open the pulpit and hear the Word.</p>
                  </div>
                  <div className="flex justify-center gap-2">
                     <Info size={16} className="text-[var(--color-primary)]" />
                     <span className="text-[10px] uppercase font-black text-[var(--color-primary)]">Faith comes by hearing</span>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
