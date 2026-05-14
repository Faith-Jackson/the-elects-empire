import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MessageSquare, Loader2 } from 'lucide-react';
import OnlineUsers from '../components/OnlineUsers';

export default function Forum() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*');
      if (!error && data) {
        setCategories(data);
      }
      setLoading(false);
    };

    fetchCategories();

    const channel = supabase
      .channel('public:forum_categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-primary)]" /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif text-[var(--color-text)] mb-8">Community Forum</h1>
      
      <OnlineUsers />

      <div className="grid gap-6">
        {categories.map(category => (
          <div key={category.id} className="glass-panel p-6 border border-[var(--color-border-subtle)] rounded-xl">
            <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2 mb-2">
              <MessageSquare size={20} className="text-[var(--color-primary)]" /> {category.name}
            </h2>
            <p className="text-[var(--color-text-muted)] mb-4">{category.description}</p>
            <Link to={`/forum/categories/${category.id}`} className="text-[var(--color-primary)] font-medium">View Threads →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
