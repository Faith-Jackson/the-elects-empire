import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { ListChecks, ChevronRight, Play, BookOpen, Music, Video } from 'lucide-react';

interface Collection {
  id: string;
  title: string;
  description: string;
  type: 'playlist' | 'series';
  content_type: 'sermon' | 'article' | 'music' | 'video' | 'mixed';
  image_url?: string;
}

interface CollectionCarouselProps {
  contentType: 'sermon' | 'article' | 'music' | 'video';
  onCollectionSelect: (collection: Collection | null) => void;
  selectedCollectionId?: string | null;
}

export default function CollectionCarousel({ contentType, onCollectionSelect, selectedCollectionId }: CollectionCarouselProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('content_type', contentType)
        .order('created_at', { ascending: false });
      
      if (data) setCollections(data as Collection[]);
      setLoading(false);
    };

    fetchCollections();
  }, [contentType]);

  if (loading || (collections.length === 0 && !selectedCollectionId)) return null;

  const Icon = contentType === 'sermon' ? ListChecks : 
               contentType === 'article' ? BookOpen :
               contentType === 'music' ? Music : Video;

  return (
    <div className="space-y-6 mb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Icon size={20} />
          </div>
          <h2 className="text-xl font-serif font-bold text-white">
            Featured {contentType === 'sermon' || contentType === 'article' ? 'Series' : 'Playlists'}
          </h2>
        </div>
        {selectedCollectionId && (
          <button 
            onClick={() => onCollectionSelect(null)}
            className="text-[10px] uppercase font-black tracking-widest text-[var(--color-primary)] hover:underline"
          >
            View All {contentType}s
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {collections.map((col) => (
          <motion.button
            key={col.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCollectionSelect(col)}
            className={`flex-shrink-0 w-64 md:w-80 glass-panel rounded-3xl border overflow-hidden transition-all text-left snap-start ${
              selectedCollectionId === col.id ? 'border-[var(--color-primary)] shadow-neon-glow' : 'border-white/5 hover:border-white/20'
            }`}
          >
            <div className="aspect-video relative bg-black/40">
              {col.image_url ? (
                <img src={col.image_url} alt={col.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10">
                   <Icon size={48} />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-[8px] uppercase font-black tracking-widest text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded">
                  {col.type}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-bold text-white line-clamp-1">{col.title}</h3>
              <p className="text-[10px] text-white/40 line-clamp-2 italic">{col.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
