import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, UserProfile } from '../hooks/useAuth';
import { MessageSquare, Loader2, Send, Users, Sparkles, Calendar, ChevronRight, UserPlus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { checkRateLimit, FORUM_POST_LIMIT, validatePostContent, sanitizeTextInput } from '../lib/security';

interface MemberInfo extends UserProfile {
  id: string;
}

export default function StudyGroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<any>(null);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const { user, profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isMember = members.some(m => m.id === user?.id);

  const fetchGroup = async () => {
    if (!groupId) return;
    const { data } = await supabase.from('study_groups').select('*').eq('id', groupId).single();
    if (data) setGroup(data);
  };

  const fetchDiscussions = async () => {
    if (!groupId) return;
    const { data } = await supabase
      .from('study_group_discussions')
      .select('*, profiles(*)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    if (data) setDiscussions(data);
  };

  const fetchMembers = async () => {
    if (!groupId) return;
    const { data } = await supabase
      .from('study_group_memberships')
      .select('profiles(*)')
      .eq('group_id', groupId);
    
    if (data) {
      setMembers(data.map((m: any) => ({ id: m.profiles.id, ...m.profiles } as MemberInfo)));
    }
  };

  const fetchTyping = async () => {
    if (!groupId) return;
    const { data } = await supabase
      .from('study_group_typing')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_typing', true)
      .neq('user_id', user?.id || '');
    
    if (data) {
      setTypingUsers(data.map(d => d.user_id));
    }
  };

  useEffect(() => {
    if (!groupId) return;
    fetchGroup();
    fetchDiscussions();
    fetchMembers();
    fetchTyping();

    const groupChannel = supabase.channel(`public:study_groups:${groupId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_groups', filter: `id=eq.${groupId}` }, () => fetchGroup())
        .subscribe();

    const discussionsChannel = supabase.channel(`public:study_group_discussions:${groupId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_group_discussions', filter: `group_id=eq.${groupId}` }, () => fetchDiscussions())
        .subscribe();

    const membersChannel = supabase.channel(`public:study_group_memberships:${groupId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_group_memberships', filter: `group_id=eq.${groupId}` }, () => fetchMembers())
        .subscribe();

    const typingChannel = supabase.channel(`public:study_group_typing:${groupId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_group_typing', filter: `group_id=eq.${groupId}` }, () => fetchTyping())
        .subscribe();

    setLoading(false);

    return () => {
      supabase.removeChannel(groupChannel);
      supabase.removeChannel(discussionsChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [groupId, user?.id]);

  const joinGroup = async () => {
    if (!user || !groupId) return;
    await supabase.from('study_group_memberships').insert([{
      group_id: groupId,
      user_id: user.id,
      role: 'member',
      created_at: new Date().toISOString()
    }]);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    if (!user || !groupId) return;

    if (e.target.value.length > 0) {
      await supabase.from('study_group_typing').upsert({
        group_id: groupId,
        user_id: user.id,
        is_typing: true,
        updated_at: new Date().toISOString()
      });
      setTimeout(async () => {
        await supabase.from('study_group_typing').update({ is_typing: false }).eq('group_id', groupId).eq('user_id', user.id);
      }, 3000);
    } else {
      await supabase.from('study_group_typing').update({ is_typing: false }).eq('group_id', groupId).eq('user_id', user.id);
    }
  };

  const postDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !groupId) return;

    // Rate limit check
    const { allowed, retryAfterMs } = checkRateLimit(`study_group_${user.id}`, 20, 60000);
    if (!allowed) {
      alert(`You're sharing insights a bit too fast! Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`);
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
      await supabase.from('study_group_discussions').insert([{
        group_id: groupId,
        user_id: user.id,
        content: sanitizeTextInput(content, 10000),
        created_at: new Date().toISOString()
      }]);
      setContent('');
    } catch (err) {
      console.error('Error posting discussion:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-primary)]" /></div>;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/study-groups" className="text-[var(--color-primary)] mb-2 block text-xs uppercase tracking-widest font-bold">← Back to Groups</Link>
            <h1 className="text-3xl font-serif font-bold text-white">{group?.title}</h1>
            <p className="text-white/40 text-sm mt-1">{group?.description}</p>
          </div>

          {!isMember && user && (
            <button 
              onClick={joinGroup}
              className="bg-[var(--color-primary)] text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-neon"
            >
              <UserPlus size={18} /> Join Study Group
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4 custom-scrollbar">
          {discussions.map(d => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={d.id} 
              className={`flex gap-3 ${d.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {d.profiles?.avatarUrl ? <img src={d.profiles.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Users size={16} className="text-white/20" />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl border ${
                d.user_id === user?.id 
                ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20 rounded-tr-none' 
                : 'bg-white/5 border-white/10 rounded-tl-none'
              }`}>
                <p className="text-white/90 text-sm leading-relaxed">{d.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">{d.profiles?.displayName || 'Unknown Envoy'}</span>
                  <span className="text-[10px] text-white/20">•</span>
                  <span className="text-[10px] text-white/20">{new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {user ? (
          <div className="relative">
            {typingUsers.length > 0 && (
              <p className="absolute -top-6 left-0 text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest italic animate-pulse">
                {typingUsers.length === 1 ? 'A brother is typing...' : 'Brothers are typing...'}
              </p>
            )}
            <form onSubmit={postDiscussion} className="flex gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
              <input
                type="text"
                value={content}
                onChange={handleInputChange}
                disabled={!isMember}
                placeholder={isMember ? "Type your spiritual insight..." : "Join the group to contribute"}
                className="flex-1 bg-transparent border-none focus:outline-none px-4 py-2 text-white text-sm"
              />
              <button 
                type="submit" 
                disabled={sending || !content.trim() || !isMember} 
                className="bg-[var(--color-primary)] text-black p-3 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shadow-neon"
              >
                {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </form>
          </div>
        ) : (
          <p className="text-center text-white/40 py-4 glass-panel rounded-xl italic">Please sign in to join the discussion.</p>
        )}
      </div>

      {/* Sidebar - Member Progress */}
      <aside className="w-80 border-l border-white/10 glass-panel flex flex-col hidden lg:flex bg-black/20">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
             <Users size={20} className="text-[var(--color-primary)]" /> Members Progress
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1 font-bold">Communion through the word</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {members.map(member => (
            <div key={member.id} className="p-4 glass-card border border-white/5 rounded-2xl group hover:border-[var(--color-primary)]/30 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                   {member.avatarUrl ? <img src={member.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Users size={20} className="text-white/20" />}
                   {member.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-bold text-white truncate">{member.displayName}</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-black leading-none mt-1">
                    {member.role === 'admin' ? 'Elder' : 'Disciple'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-orange-500/10 border border-orange-500/20 p-2 rounded-xl text-center">
                   <div className="text-orange-400 font-black text-sm flex items-center justify-center gap-1">
                      <Calendar size={12} /> {member.streak || 0}
                   </div>
                   <div className="text-[8px] uppercase tracking-tighter text-orange-400/60 font-black">Streak</div>
                </div>
                <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 p-2 rounded-xl text-center">
                   <div className="text-[var(--color-primary)] font-black text-sm flex items-center justify-center gap-1">
                      <Sparkles size={12} /> {member.totalChaptersRead || 0}
                   </div>
                   <div className="text-[8px] uppercase tracking-tighter text-[var(--color-primary)]/60 font-black">Chapters</div>
                </div>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="h-40 flex items-center justify-center text-center px-8">
               <p className="text-white/20 text-xs italic">No members have joined this fellowship yet.</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-white/5 border-t border-white/10">
          <div className="flex items-center gap-3 text-white/40">
             <Info size={16} />
             <p className="text-[9px] leading-relaxed italic">Reading progress is shared automatically with group members to encourage one another.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
