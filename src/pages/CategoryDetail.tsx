import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Plus, MessageSquare } from 'lucide-react';

export default function CategoryDetail() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  const fetchThreads = async () => {
    if (!categoryId) return;
    const { data } = await supabase
      .from('threads')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });
    if (data) setThreads(data);
  };

  useEffect(() => {
    if (!categoryId) return;
    fetchThreads();

    const channel = supabase.channel(`public:threads:category:${categoryId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'threads', filter: `category_id=eq.${categoryId}` }, () => {
            fetchThreads();
        })
        .subscribe();

    setLoading(false);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryId]);

  const createThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !user || !categoryId) return;
    setCreating(true);
    try {
      await supabase.from('threads').insert([{
        title: newThreadTitle,
        category_id: categoryId,
        creator_id: user.id,
        post_count: 0,
        created_at: new Date().toISOString()
      }]);
      setNewThreadTitle('');
    } catch (err) {
      console.error('Error creating thread:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-primary)]" /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/forum" className="text-[var(--color-primary)] mb-4 block">&larr; Back to Forum</Link>
      <h1 className="text-3xl font-serif text-white mb-8">Category Threads</h1>
      
      {user && (
        <form onSubmit={createThread} className="mb-8 flex gap-4">
          <input
            type="text"
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            placeholder="New thread title..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30"
          />
          <button type="submit" disabled={creating} className="bg-[var(--color-primary)] text-[var(--color-background)] px-4 py-2 rounded-lg flex items-center gap-2">
            {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Create
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {threads.map(thread => (
          <Link key={thread.id} to={`/threads/${thread.id}`} className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center justify-between hover:border-[var(--color-primary)]/50 transition-all group shadow-sm hover:shadow-neon-glow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--color-primary)]/10 rounded-xl group-hover:bg-[var(--color-primary)]/20 transition-colors">
                <MessageSquare className="text-[var(--color-primary)]" />
              </div>
              <span className="text-white font-medium text-lg">{thread.title}</span>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-sm bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <MessageSquare size={14} className="text-[var(--color-primary)]/60" />
              <span className="font-bold">{thread.post_count || 0}</span>
              <span className="text-[10px] uppercase tracking-widest font-black">Posts</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
