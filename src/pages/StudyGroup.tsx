import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Users, Plus, Loader2, Sparkles, MessageSquare, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import OnlineUsers from '../components/OnlineUsers';
import { motion, AnimatePresence } from 'motion/react';

export default function StudyGroup() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  const fetchGroups = async () => {
    const { data } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
    if (data) setGroups(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
    const channel = supabase.channel('public:study_groups').on('postgres_changes', { event: '*', schema: 'public', table: 'study_groups' }, () => fetchGroups()).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupTitle.trim() || !user) return;
    setCreating(true);
    try {
      await supabase.from('study_groups').insert([{
        title: newGroupTitle,
        description: 'A new assembly gathered in His name.',
        creator_id: user.id,
        created_at: new Date().toISOString()
      }]);
      setNewGroupTitle('');
    } catch (err) {
      console.error('Error creating group:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center h-[calc(100vh-80px)] items-center"><Loader2 className="animate-spin text-[var(--color-primary)]" size={40} /></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 max-w-6xl mx-auto space-y-12 mb-24"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
              <Users size={12} className="text-[var(--color-primary)]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-black">Imperial Assemblies</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-serif font-bold text-[var(--color-text)] tracking-tightest leading-[0.9]">Study Groups</h1>
           <p className="text-[var(--color-text-muted)] text-lg md:text-xl font-serif max-w-2xl italic leading-relaxed">
             "For where two or three are gathered together in my name, there am I in the midst of them."
           </p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <OnlineUsers />

          {user && (
            <motion.form 
              onSubmit={createGroup} 
              className="relative group perspective-1000"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)] to-blue-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative flex flex-col sm:flex-row gap-4 p-4 glass-panel border border-white/10 rounded-[1.5rem] bg-black/20 backdrop-blur-3xl shadow-2xl">
                <input
                  type="text"
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  placeholder="The Name of the New Assembly..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/20 text-lg font-serif px-4"
                />
                <button 
                  type="submit" 
                  disabled={creating} 
                  className="bg-[var(--color-primary)] text-[var(--color-background)] px-8 py-4 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-neon shrink-0"
                >
                  {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Form Group
                </button>
              </div>
            </motion.form>
          )}

          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {groups.map((group, idx) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ x: 10, scale: 1.01 }}
                >
                  <Link to={`/study-groups/${group.id}`} className="glass-panel p-8 border border-white/10 rounded-[2rem] hover:border-[var(--color-primary)]/50 transition-all flex items-center justify-between group bg-gradient-to-r from-[var(--color-primary)]/5 to-transparent shadow-xl">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-black transition-all duration-500 shadow-inner">
                          <Users size={32} />
                       </div>
                       <div className="space-y-1">
                          <h2 className="text-2xl font-serif font-bold text-white tracking-tight">{group.title}</h2>
                          <p className="text-[10px] uppercase font-black tracking-widest text-white/30 group-hover:text-[var(--color-primary)] transition-colors">Fellowship Active • {group.creator_id === user?.id ? 'Your Assembly' : 'Open Gathering'}</p>
                       </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4">
                       <div className="flex -space-x-3">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">U{i}</div>
                          ))}
                       </div>
                       <ChevronRight className="text-white/20 group-hover:text-[var(--color-primary)] group-hover:translate-x-2 transition-all" size={24} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-8">
           <div className="glass-panel p-10 rounded-[2.5rem] border border-white/10 space-y-6">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-2">
                <Sparkles size={24} />
              </div>
              <h3 className="font-serif font-bold text-2xl text-white">Fellowship Rules</h3>
              <p className="text-sm text-white/50 leading-relaxed italic">
                In this Empire, every group is a priesthood. Let your speech be seasoned with grace, always pointing back to the One True Substance.
              </p>
              <div className="space-y-4 pt-4">
                 {[
                   { icon: ShieldCheck, text: "Christ-Centric Dialog" },
                   { icon: MessageSquare, text: "Compassionate Exhortation" },
                   { icon: Sparkles, text: "Divine Order" }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/40">
                      <item.icon size={16} className="text-[var(--color-primary)]" />
                      {item.text}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
