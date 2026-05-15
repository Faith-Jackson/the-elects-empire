import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, CheckCircle, Clock, Share2, Edit2, X, MessageSquare, Save, Database, HandHelping, Users, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function CommentSection({ prayerId }: { prayerId: string }) {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('prayer_comments')
            .select('*')
            .eq('prayer_id', prayerId)
            .order('created_at', { ascending: true });
        if (!error && data) setComments(data);
    };

    useEffect(() => {
        fetchComments();

        const channel = supabase
            .channel(`prayer_comments:${prayerId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'prayer_comments',
                filter: `prayer_id=eq.${prayerId}`
            }, () => {
                fetchComments();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [prayerId]);

    const addComment = async () => {
        if (!user || !newComment.trim()) return;
        const { error } = await supabase.from('prayer_comments').insert([{ 
            user_id: user.id, 
            prayer_id: prayerId, 
            content: newComment, 
            created_at: new Date().toISOString() 
        }]);
        if (!error) setNewComment('');
    }

    return (
        <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
            <h4 className="text-sm font-bold text-[var(--color-text-muted)]">Reflections</h4>
            {comments.map(c => <p key={c.id} className="text-sm text-[var(--color-text)]/80">{c.content}</p>)}
            <div className="flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)} className="w-full bg-[var(--color-text)]/5 p-2 rounded text-sm text-[var(--color-text)]" placeholder="Add reflection..." />
                <button onClick={addComment} className="text-xs bg-[var(--color-text)]/10 text-[var(--color-text)] px-2 rounded">Post</button>
            </div>
        </div>
    );
}

export default function Prayers() {
  const { user, profile } = useAuth();
  const [prayers, setPrayers] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Supplication');
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [shareTarget, setShareTarget] = useState<string | null>(null);
  const [userCategories, setUserCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [viewMode, setViewMode] = useState<'personal' | 'community'>('community');
  // Filter state
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const defaultCategories = ['Supplication', 'Thanksgiving', 'Intercession', 'Confession', 'Adoration', 'Petition', 'Meditation'];

  const fetchPrayers = async () => {
    if (!user) return;
    let queryBuilder = supabase.from('prayers').select('*').order('created_at', { ascending: false });
    
    if (viewMode === 'personal') {
      queryBuilder = queryBuilder.eq('user_id', user.id);
    } else {
      queryBuilder = queryBuilder.eq('isPublic', true);
    }

    const { data } = await queryBuilder;
    if (data) setPrayers(data);
  };

  const fetchCategories = async () => {
    if (!user) return;
    const { data } = await supabase.from('prayer_categories').select('*').eq('user_id', user.id);
    if (data) setUserCategories(data.map(d => d.name));
  };

  const fetchGroups = async () => {
    const { data } = await supabase.from('study_groups').select('*');
    if (data) setStudyGroups(data);
  };

  useEffect(() => {
    if (!user) return;
    
    fetchPrayers();
    fetchCategories();
    fetchGroups();

    const prayersChannel = supabase
        .channel('public:prayers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'prayers' }, () => {
            fetchPrayers();
        })
        .subscribe();

    const catChannel = supabase
        .channel('public:prayer_categories')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_categories', filter: `user_id=eq.${user.id}` }, () => {
            fetchCategories();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(prayersChannel);
        supabase.removeChannel(catChannel);
    };
  }, [user, viewMode]);

  const addPrayer = async () => {
    if (!user || !content.trim()) return;
    await supabase.from('prayers').insert([{
        user_id: user.id,
        userName: profile?.displayName || 'Friend',
        userAvatar: profile?.avatarUrl || '',
        content,
        category,
        status: 'active',
        is_public: isPublic,
        intercessionCount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }]);
    setContent('');
  };

  const incrementIntercession = async (prayer: any) => {
    if (!user) return;
    try {
      await supabase.from('prayers').update({
        intercessionCount: (prayer.intercessionCount || 0) + 1
      }).eq('id', prayer.id);
      
      if (prayer.user_id !== user.id) {
        await supabase.from('notifications').insert([{
          user_id: prayer.user_id,
          message: `${profile?.displayName || 'Someone'} joined you in prayer!`,
          read: false,
          created_at: new Date().toISOString()
        }]);
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  const addCategory = async () => {
      if (!user || !newCategory.trim()) return;
      await supabase.from('prayer_categories').insert([{ user_id: user.id, name: newCategory }]);
      setNewCategory('');
  };

  const toggleStatus = async (id: string, status: string) => {
    await supabase.from('prayers').update({
        status: status === 'active' ? 'answered' : 'active',
        updated_at: new Date().toISOString()
    }).eq('id', id);
  };

  const deletePrayer = async (id: string) => {
    await supabase.from('prayers').delete().eq('id', id);
  };
  
  const updatePrayer = async (id: string) => {
      await supabase.from('prayers').update({ content: editContent, updated_at: new Date().toISOString() }).eq('id', id);
      setEditingId(null);
  }
  
  const sharePrayer = async (prayer: any, groupId: string) => {
      await supabase.from('study_group_prayer_requests').insert([{
          group_id: groupId,
          user_id: user?.id,
          content: prayer.content,
          created_at: new Date().toISOString()
      }]);
      setShareTarget(null);
      alert('Prayer shared with group!');
  }

  const allCategories = [...defaultCategories, ...userCategories];
  
  const filteredPrayers = prayers.filter(p => 
      (filterCat === 'All' || p.category === filterCat) &&
      (filterStatus === 'All' || p.status === filterStatus.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 mb-20 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
                <HandHelping size={12} className="text-[var(--color-primary)]" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-black">Imperial Intercession</span>
             </div>
             <h1 className="text-5xl md:text-7xl font-serif font-bold text-[var(--color-text)] tracking-tightest leading-[0.9]">Prayers</h1>
             <p className="text-[var(--color-text-muted)] text-lg md:text-xl font-serif max-w-2xl italic leading-relaxed">
               "Join the corporate intercession of the Empire. Every prayer is a seed in the eternal kingdom."
             </p>
          </div>
          <div className="flex bg-[var(--color-text)]/5 p-1 rounded-xl border border-[var(--color-border-subtle)] h-fit">
            <button 
              onClick={() => setViewMode('community')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'community' ? 'bg-[var(--color-primary)] text-[var(--color-background)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
              <Users size={14} /> Community
            </button>
            <button 
              onClick={() => setViewMode('personal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'personal' ? 'bg-[var(--color-primary)] text-[var(--color-background)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
              <Clock size={14} /> Personal
            </button>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-3xl mb-8 space-y-4">
            <div className="flex items-center justify-end mb-2">
              <button 
                onClick={() => setIsPublic(!isPublic)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${isPublic ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)] bg-[var(--color-text)]/5'}`}
              >
                {isPublic ? <Eye size={12} /> : <EyeOff size={12} />} {isPublic ? 'Public' : 'Private'}
              </button>
            </div>
            <div className="flex gap-4">
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-[var(--color-text)]/5 p-2 rounded text-xs text-[var(--color-text)] border border-[var(--color-border-subtle)]">
                    <option value="All">All Categories</option>
                    {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[var(--color-text)]/5 p-2 rounded text-xs text-[var(--color-text)] border border-[var(--color-border-subtle)]">
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Answered">Answered</option>
                </select>
            </div>
            {/* Form for new prayer */}
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What is on your heart?"
                className="w-full p-4 rounded-xl bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/40 focus:outline-none focus:border-[var(--color-primary)]"
                rows={4}
            />
            <div className="flex items-center gap-4">
                <select value={category} onChange={e => setCategory(e.target.value)} className="bg-[var(--color-text)]/5 p-2 rounded-lg text-sm text-[var(--color-text)] border border-[var(--color-border-subtle)]">
                    {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button onClick={addPrayer} className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-text)] text-[var(--color-background)] font-bold rounded-full transition-all">
                    <Plus size={18} /> Add Prayer
                </button>
            </div>
            
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
                <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New Category Name" className="p-2 rounded-lg bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] text-sm text-[var(--color-text)] flex-1" />
                <button onClick={addCategory} className="px-4 py-2 bg-[var(--color-text)]/10 hover:bg-[var(--color-text)]/20 rounded-lg text-sm text-[var(--color-text)]">Add</button>
            </div>
        </div>

        <div className="space-y-4">
            <AnimatePresence>
                {filteredPrayers.map(prayer => (
                    <motion.div key={prayer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6 rounded-2xl flex items-start gap-4 border border-[var(--color-border-subtle)]">
                        <div className="flex flex-col items-center gap-2">
                          <div className={`p-2 rounded-full ${prayer.status === 'answered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {prayer.status === 'answered' ? <CheckCircle size={20} /> : <Clock size={20} />}
                          </div>
                          <img src={prayer.userAvatar || 'https://images.unsplash.com/photo-1541447237128-f4bcb61782af?auto=format&fit=crop&q=80&w=128'} className="w-8 h-8 rounded-full border border-[var(--color-border-subtle)]" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1">
                            {editingId === prayer.id ? (
                                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full bg-[var(--color-text)]/10 p-2 text-[var(--color-text)] rounded mb-2 border border-[var(--color-border-subtle)]" />
                            ) : (
                                <p className="text-lg text-[var(--color-text)] mb-2 leading-relaxed">{prayer.content}</p>
                            )}
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-primary)]/60 bg-[var(--color-primary)]/5 px-2 py-0.5 rounded border border-[var(--color-primary)]/10">{prayer.category}</span>
                              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">{prayer.userName || 'Friend'}</span>
                              <button 
                                onClick={() => incrementIntercession(prayer)}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 hover:text-white transition-colors bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                              >
                                <HandHelping size={12} /> {prayer.intercessionCount || 0} Prayed
                              </button>
                            </div>
                            
                            {editingId === prayer.id && (
                                <button onClick={() => updatePrayer(prayer.id)} className="flex items-center gap-1 text-xs text-green-400 mt-2"><Save size={14}/> Save</button>
                            )}

                            {shareTarget === prayer.id && (
                                <div className="mt-4 p-2 bg-[var(--color-text)]/10 rounded-lg border border-[var(--color-border-subtle)]">
                                    <select onChange={(e) => sharePrayer(prayer, e.target.value)} className="bg-transparent w-full text-sm text-[var(--color-text)]">
                                        <option value="">Select Group...</option>
                                        {studyGroups.map(g => <option key={g.id} value={g.id} className="text-black">{g.title}</option>)}
                                    </select>
                                </div>
                            )}

                            <CommentSection prayerId={prayer.id} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => setShareTarget(shareTarget === prayer.id ? null : prayer.id)} className="p-2 hover:bg-[var(--color-text)]/10 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                                <Share2 size={18} />
                            </button>
                            {editingId === prayer.id ? (
                                <button onClick={() => setEditingId(null)} className="p-2 hover:bg-[var(--color-text)]/10 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                                    <X size={18} />
                                </button>
                            ) : (
                                <button onClick={() => { setEditingId(prayer.id); setEditContent(prayer.content); }} className="p-2 hover:bg-[var(--color-text)]/10 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                                    <Edit2 size={18} />
                                </button>
                            )}
                            <button onClick={() => toggleStatus(prayer.id, prayer.status)} className="p-2 hover:bg-[var(--color-text)]/10 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                                <CheckCircle size={18} />
                            </button>
                            <button onClick={() => deletePrayer(prayer.id)} className="p-2 hover:bg-red-500/20 rounded-full text-[var(--color-text-muted)] hover:text-red-400">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    </div>
  );
}
