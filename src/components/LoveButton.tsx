import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface LoveButtonProps {
  itemId: string;
  itemType: 'sermon' | 'article' | 'music' | 'video';
}

export default function LoveButton({ itemId, itemType }: LoveButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!itemId) return;

    const fetchLikes = async () => {
      const { data, count } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('item_id', itemId)
        .eq('item_type', itemType);
      
      setCount(count || 0);
      
      if (user) {
        const { data: userLike } = await supabase
          .from('likes')
          .select('id')
          .eq('item_id', itemId)
          .eq('item_type', itemType)
          .eq('user_id', user.id)
          .single();
        
        setLiked(!!userLike);
      }
    };

    fetchLikes();
  }, [itemId, itemType, user]);

  const toggleLike = async () => {
    if (!user) {
      alert('Please sign in to like this item.');
      return;
    }

    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .eq('user_id', user.id);
      
      setLiked(false);
      setCount(prev => prev - 1);
    } else {
      await supabase
        .from('likes')
        .insert({ item_id: itemId, item_type: itemType, user_id: user.id });
      
      setLiked(true);
      setCount(prev => prev + 1);
    }
  };

  return (
    <button 
      onClick={toggleLike}
      className={`flex items-center gap-1.5 transition-all text-xs font-bold ${liked ? 'text-red-500' : 'text-white/40 hover:text-white'}`}
    >
      <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
      {count}
    </button>
  );
}
