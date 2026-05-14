import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface BookmarkButtonProps {
  itemId: string;
  itemType: 'article' | 'thread' | 'video' | 'devo';
  itemTitle: string;
}

export default function BookmarkButton({ itemId, itemType, itemTitle }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkBookmark = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .maybeSingle();
    
    if (data) {
      setIsBookmarked(true);
      setBookmarkId(data.id);
    } else {
      setIsBookmarked(false);
      setBookmarkId(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkBookmark();

    const channel = supabase
      .channel('public:bookmarks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${user?.id}` }, () => checkBookmark())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, itemId]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please sign in to save items to your library.");
      return;
    }

    try {
      if (isBookmarked && bookmarkId) {
        await supabase.from('bookmarks').delete().eq('id', bookmarkId);
      } else {
        await supabase.from('bookmarks').insert({
          user_id: user.id,
          item_id: itemId,
          item_type: itemType,
          item_title: itemTitle,
          created_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  if (loading) return <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />;

  return (
    <button
      onClick={toggleBookmark}
      className={`p-2 rounded-full transition-all flex items-center justify-center ${
        isBookmarked 
        ? 'bg-[var(--color-primary)] text-[var(--color-background)] shadow-neon' 
        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
      }`}
      title={isBookmarked ? "Remove from Library" : "Save to Library"}
    >
      <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
    </button>
  );
}
