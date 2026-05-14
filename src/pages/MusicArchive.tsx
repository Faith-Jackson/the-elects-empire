import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Search, Filter, Disc, User, Play, Info, ChevronRight, Hash, Headphones } from 'lucide-react';
import CollectionCarousel from '../components/CollectionCarousel';
import LoveButton from '../components/LoveButton';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  embed_id: string;
  embed_type?: 'track' | 'album' | 'playlist';
  platform?: 'spotify' | 'youtube' | 'soundcloud' | 'audiomack';
  genre: string;
  created_at: any;
}

export default function MusicArchive() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | 'All'>('All');
  const [activeTrack, setActiveTrack] = useState<MusicTrack | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const fetchTracks = async (collectionId?: string | null) => {
    setLoading(true);
    let data;
    if (collectionId) {
       const { data: itemIds } = await supabase
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', collectionId)
        .order('sort_order', { ascending: true });
      
      if (itemIds && itemIds.length > 0) {
        const { data: trackData } = await supabase
          .from('music')
          .select('*')
          .in('id', itemIds.map(i => i.item_id));
        data = trackData;
        
        // Sorting them according to collection_items order
        if (data) {
           data = itemIds.map(id => data!.find(t => t.id === id.item_id)).filter(Boolean);
        }
      }
    } else {
      const { data: trackData } = await supabase.from('music').select('*').order('created_at', { ascending: false });
      data = trackData;
    }
    
    if (data) setTracks(data as MusicTrack[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTracks(selectedCollectionId);
  }, [selectedCollectionId]);

  const getEmbedUrl = (track: MusicTrack) => {
    switch (track.platform) {
      case 'youtube':
        return `https://www.youtube.com/embed/${track.embed_id}`;
      case 'soundcloud':
        return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${track.embed_id}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
      case 'audiomack':
        return `https://audiomack.com/embed/song/${track.embed_id}?background=1`;
      case 'spotify':
      default:
        return `https://open.spotify.com/embed/${track.embed_type || 'track'}/${track.embed_id}?utm_source=generator&theme=0`;
    }
  };

  useEffect(() => {
    const channel = supabase.channel('public:music').on('postgres_changes', { event: '*', schema: 'public', table: 'music' }, () => fetchTracks(selectedCollectionId)).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCollectionId]);

  const filteredTracks = tracks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.album?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || t.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const genreList = ['All', ...new Set(tracks.map(t => t.genre).filter(Boolean))];

  if (loading) return <div className="p-8 flex justify-center text-[var(--color-primary)]">Tuning the spiritual harps...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 mb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[var(--color-primary)]/20 rounded-2xl flex items-center justify-center text-[var(--color-primary)] shadow-neon">
            <Music size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-serif font-bold text-white tracking-tight">Sacred Melodies</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-bold">Worship and Spiritual Songs</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text"
              placeholder="Search melodies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--color-primary)] transition-all md:w-64"
            />
          </div>
          <select 
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
          >
            {genreList.map(g => <option key={g} value={g} className="bg-black">{g}</option>)}
          </select>
        </div>
      </div>

      <CollectionCarousel 
        contentType="music" 
        onCollectionSelect={(col) => setSelectedCollectionId(col ? col.id : null)} 
        selectedCollectionId={selectedCollectionId}
      />

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Track List */}
        <div className="lg:col-span-7 space-y-4">
          {filteredTracks.length > 0 ? (
            filteredTracks.map(track => (
              <motion.button 
                key={track.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setActiveTrack(track)}
                className={`w-full text-left glass-card p-6 rounded-[2rem] border transition-all flex items-center gap-6 group ${activeTrack?.id === track.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-neon-glow' : 'border-white/5 hover:border-white/20'}`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${activeTrack?.id === track.id ? 'bg-[var(--color-primary)] text-black' : 'bg-white/5 text-white/40'}`}>
                   {activeTrack?.id === track.id ? <Play className="fill-current" size={24} /> : <Headphones size={24} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-primary)]">{track.genre || 'Spiritual'}</span>
                    <span className="text-[10px] text-white/20">/</span>
                    <span className="text-[10px] text-white/40">{track.album || 'Single'}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-[var(--color-primary)] transition-colors truncate">{track.title}</h3>
                  <div className="flex items-center justify-between mt-1 text-white/40 text-xs">
                     <span className="flex items-center gap-1"><User size={12} /> {track.artist}</span>
                     <LoveButton itemId={track.id} itemType="music" />
                  </div>
                </div>

                <ChevronRight size={20} className="text-white/10 group-hover:text-[var(--color-primary)] transition-colors" />
              </motion.button>
            ))
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
               <Music size={48} className="mx-auto text-white/10 mb-4" />
               <p className="text-white/30 italic">No melodies found matching your heart's search.</p>
            </div>
          )}
        </div>

        {/* Player View */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-8">
            <AnimatePresence mode="wait">
              {activeTrack ? (
                <motion.div 
                  key={activeTrack.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="glass-panel p-8 rounded-[3rem] border border-[var(--color-primary)]/20 shadow-neon-glow space-y-6"
                >
                  <div className={`w-full max-w-[400px] mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-white/5 ${(!activeTrack.embed_type || activeTrack.embed_type === 'track') ? 'aspect-square' : 'h-[450px]'}`}>
                    <iframe 
                        src={getEmbedUrl(activeTrack)} 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        allowFullScreen
                        loading="lazy"
                        className="absolute inset-0 rounded-3xl"
                    />
                  </div>

                  <div className="space-y-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Disc size={14} className="text-[var(--color-primary)] animate-spin-slow" />
                        <span className="text-[10px] uppercase font-black tracking-tighter text-[var(--color-primary)]">{activeTrack.album || 'Single'}</span>
                      </div>
                      <h2 className="text-2xl font-serif font-bold text-white">{activeTrack.title}</h2>
                      <LoveButton itemId={activeTrack.id} itemType="music" />
                      <div className="flex items-center justify-center gap-2 mt-2 text-white/60">
                         <User size={14} />
                         <span className="text-sm">{activeTrack.artist}</span>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-2">
                       <span className="text-[8px] uppercase font-black text-white/30 tracking-widest">In the spirit of worship</span>
                       <p className="text-[10px] text-white/20 italic">"Sing unto the Lord a new song; sing unto the Lord, all the earth." — Psalm 96:1</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-panel p-12 rounded-[3rem] border border-white/5 text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                     <Play size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-white/80">Select a Melody</h3>
                    <p className="text-sm text-white/40 mt-2 max-w-xs mx-auto">Click on a track in the archive to begin your journey of worship.</p>
                  </div>
                  <div className="flex justify-center gap-2">
                     <Headphones size={16} className="text-[var(--color-primary)]" />
                     <span className="text-[10px] uppercase font-black text-[var(--color-primary)]">Be filled with the Spirit</span>
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
