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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12 pb-mobile-nav">
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
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <OnlineUsers />

          <div className="grid gap-6">
            {categories.map(category => (
              <div key={category.id} className="glass-panel p-8 border border-white/10 rounded-[2rem] hover:border-[var(--color-primary)]/50 transition-all flex flex-col sm:flex-row items-center justify-between group bg-gradient-to-r from-[var(--color-primary)]/5 to-transparent shadow-xl">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-black transition-all duration-500 shadow-inner">
                      <MessageSquare size={32} />
                   </div>
                   <div className="space-y-1">
                      <h2 className="text-2xl font-serif font-bold text-white tracking-tight">{category.name}</h2>
                      <p className="text-sm text-[var(--color-text-muted)] italic leading-relaxed">{category.description}</p>
                   </div>
                </div>
                <Link to={`/forum/categories/${category.id}`} className="mt-4 sm:mt-0 px-6 py-2 bg-[var(--color-text)]/5 hover:bg-[var(--color-primary)] hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">View Threads →</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
           <div className="glass-panel p-10 rounded-[2.5rem] border border-white/10 space-y-6">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-2">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-serif font-bold text-2xl text-white">Forum Rules</h3>
              <p className="text-sm text-white/50 leading-relaxed italic">
                The Imperial Discourse is a sacred space for the expansion of knowledge. Let every interaction be rooted in love, seasoning your speech with salt.
              </p>
              <div className="space-y-4 pt-4">
                 {[
                   { text: "Christ-Centric Conduct" },
                   { text: "Apostolic Order" },
                   { text: "Spiritual Depth" }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                      {item.text}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
