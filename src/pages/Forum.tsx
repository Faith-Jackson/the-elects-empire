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

    <div className="p-8 max-w-4xl mx-auto space-y-12 mb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
              <MessageSquare size={12} className="text-[var(--color-primary)]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-black">Imperial Discourse</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-serif font-bold text-[var(--color-text)] tracking-tightest leading-[0.9]">Forum</h1>
           <p className="text-[var(--color-text-muted)] text-lg md:text-xl font-serif max-w-2xl italic leading-relaxed">
             "Iron sharpens iron. Discuss, debate, and grow together in the knowledge of Christ."
           </p>
        </div>
      </div>
      
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
