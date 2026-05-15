import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { MessageSquare, Loader2, Send, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import BookmarkButton from '../components/BookmarkButton';
import { checkRateLimit, FORUM_POST_LIMIT, validatePostContent, sanitizeTextInput } from '../lib/security';

export default function ThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const fetchThread = async () => {
    if (!threadId) return;
    const { data } = await supabase.from('threads').select('*').eq('id', threadId).single();
    if (data) setThread(data);
  };

  const fetchPosts = async () => {
    if (!threadId) return;
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    if (data) setPosts(data);
  };

  useEffect(() => {
    if (!threadId) return;
    fetchThread();
    fetchPosts();

    const threadChannel = supabase.channel(`public:threads:${threadId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'threads', filter: `id=eq.${threadId}` }, () => {
            fetchThread();
        })
        .subscribe();

    const postsChannel = supabase.channel(`public:posts:${threadId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `thread_id=eq.${threadId}` }, () => {
            fetchPosts();
        })
        .subscribe();

    setLoading(false);

    return () => {
      supabase.removeChannel(threadChannel);
      supabase.removeChannel(postsChannel);
    };
  }, [threadId]);

  const postReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !threadId || !thread) return;

    // Rate limit check
    const { allowed, retryAfterMs } = checkRateLimit(`forum_post_${user.id}`, 10, 60000);
    if (!allowed) {
      alert(`You're posting too fast! Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`);
      return;
    }

    // Input validation
    const validation = validatePostContent(content);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSending(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const userData = profile || {};

      await supabase.from('posts').insert([{
        thread_id: threadId,
        user_id: user.id,
        user_name: userData.displayName || 'Anonymous',
        user_avatar: userData.avatarUrl || '',
        content: sanitizeTextInput(content, 50000),
        created_at: new Date().toISOString()
      }]);

      // Update post count in thread
      await supabase.from('threads').update({
        post_count: (thread.post_count || 0) + 1,
        last_activity: new Date().toISOString()
      }).eq('id', threadId);

      if (thread.creator_id !== user.id) {
        await supabase.from('notifications').insert([{
          user_id: thread.creator_id,
          message: `New reply in thread: ${thread.title}`,
          read: false,
          created_at: new Date().toISOString()
        }]);
      }
      setContent('');
    } catch (err) {
      console.error('Error posting reply:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-primary)]" /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <Link to="/forum" className="text-[var(--color-primary)] mb-4 block hover:underline">&larr; Back to Forum</Link>
      
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-serif font-bold mb-2 flex-1">{thread?.title}</h1>
          {thread && (
            <BookmarkButton itemId={thread.id} itemType="thread" itemTitle={thread.title} />
          )}
        </div>
        <div className="flex items-center gap-4 text-white/40 text-sm">
          <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <MessageSquare size={14} className="text-[var(--color-primary)]" />
            {posts.length} {posts.length === 1 ? 'Post' : 'Posts'}
          </span>
          {thread?.created_at && (
            <span className="italic">Started {new Date(thread.created_at).toLocaleDateString()}</span>
          )}
        </div>
      </div>
      
      <div className="grid gap-6 mb-12">
        {posts.map(post => (
          <div key={post.id} className="glass-panel p-4 rounded-lg border border-white/10 flex gap-4">
            <img src={post.user_avatar || 'https://images.unsplash.com/photo-1541447237128-f4bcb61782af?auto=format&fit=crop&q=80&w=128'} alt={post.user_name} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
            <div className="flex-1">
                <div className="text-white/60 text-xs font-bold mb-1">{post.user_name}</div>
                <div className="prose prose-invert prose-sm">
                  <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>
                <span className="text-xs text-white/40 block mt-2">{new Date(post.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {user ? (
        <form onSubmit={postReply} className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Post a reply..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
          />
          <button type="submit" disabled={sending} className="bg-[var(--color-primary)] p-2 rounded-lg">
            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </form>
      ) : (
        <p className="text-center text-white/40">Please sign in to reply.</p>
      )}
    </div>
  );
}
