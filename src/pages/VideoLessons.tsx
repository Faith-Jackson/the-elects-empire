import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Search, Filter, Play, Info, ChevronRight, Hash, PlayCircle } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import CollectionCarousel from '../components/CollectionCarousel';
import LoveButton from '../components/LoveButton';

interface VideoLesson {
  id: string;
  title: string;
  url: string;
  description: string;
  category?: string;
  created_at: string;
}

export default function VideoLessons() {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const fetchVideos = async (collectionId?: string | null) => {
    setLoading(true);
    try {
      setError(null);
      let data;
      if (collectionId) {
        const { data: itemIds } = await supabase
          .from('collection_items')
          .select('item_id')
          .eq('collection_id', collectionId)
          .order('sort_order', { ascending: true });
        
        if (itemIds && itemIds.length > 0) {
          const { data: videoData } = await supabase
            .from('videos')
            .select('*')
            .in('id', itemIds.map(i => i.item_id));
          data = videoData;
          if (data) {
            data = itemIds.map(id => data!.find(v => v.id === id.item_id)).filter(Boolean);
          }
        }
      } else {
        const { data: videoData } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });
        data = videoData;
      }
      
      const fetchedVideos = data ? data as VideoLesson[] : [];
      setVideos(fetchedVideos);
      if (fetchedVideos.length > 0) setActiveVideo(fetchedVideos[0]);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("The archives are momentarily veiled.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(selectedCollectionId);
  }, [selectedCollectionId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4 text-[var(--color-primary)]">
      <div className="w-12 h-12 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Preparing the Vision</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 mb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
              <Video size={12} className="text-[var(--color-primary)]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-black">Imperial Vision</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-serif font-bold text-[var(--color-text)] tracking-tightest leading-[0.9]">Lessons</h1>
           <p className="text-[var(--color-text-muted)] text-lg md:text-xl font-serif max-w-2xl italic leading-relaxed">
             "Visual revelation through the Word. Deepen your understanding through structured teaching."
           </p>
        </div>
      </div>

      <CollectionCarousel 
        contentType="video" 
        onCollectionSelect={(col) => fetchVideos(col ? col.id : null)} 
        selectedCollectionId={selectedCollectionId}
      />

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Player */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {activeVideo ? (
              <motion.div
                key={activeVideo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <VideoPlayer url={activeVideo.url} />
                </div>
                <div className="p-8 glass-panel rounded-[2.5rem] border border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">
                      {activeVideo.category || 'Spiritual Growth'}
                    </span>
                    <span className="text-[10px] text-white/20">/</span>
                    <span className="text-[10px] text-white/40">{new Date(activeVideo.created_at).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-white mb-4">{activeVideo.title}</h2>
                  <LoveButton itemId={activeVideo.id} itemType="video" />
                  <div 
                    className="text-white/60 prose prose-invert max-w-none prose-sm leading-relaxed mt-4"
                    dangerouslySetInnerHTML={{ __html: activeVideo.description || '' }}
                  />
                </div>
              </motion.div>
            ) : (
              <div className="aspect-video bg-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-white/10 space-y-4 border border-dashed border-white/10">
                <PlayCircle size={64} />
                <p className="text-sm font-serif italic">Select a lesson to begin</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Playlist */}
        <div className="lg:col-span-4 space-y-4 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
          <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30 px-4 mb-4">Next Up</h3>
          {videos.map(video => (
            <button
              key={video.id}
              onClick={() => setActiveVideo(video)}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group ${activeVideo?.id === video.id ? 'bg-[var(--color-primary)] text-black border-[var(--color-primary)] shadow-neon-glow' : 'bg-white/5 text-white/60 border-white/5 hover:border-white/10 hover:bg-white/10'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${activeVideo?.id === video.id ? 'bg-black/20' : 'bg-white/5'}`}>
                <Play size={18} className={activeVideo?.id === video.id ? 'fill-current' : ''} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold truncate">{video.title}</h4>
                    <LoveButton itemId={video.id} itemType="video" />
                </div>
                <p className={`text-[10px] uppercase tracking-tighter opacity-40 font-bold ${activeVideo?.id === video.id ? 'text-black' : 'text-[var(--color-primary)]'}`}>
                  {new Date(video.created_at).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
