import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Bookmark, Pencil, BookOpen, Clock, ChevronRight, User as UserIcon, Star, Calendar, Database, Sun, FileText, Book, Video, Users, BookMarked, Feather, UserPlus, MessageSquare, HandHelping, ListChecks, BookOpenText, BrainCircuit, Lightbulb, TrendingUp, Activity, Trophy, Sparkles } from 'lucide-react';
import { generateSpiritualInsight } from '../services/groqService';
import ReactMarkdown from 'react-markdown';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

import ScriptureArtGenerator from '../components/ScriptureArtGenerator';
import MannaJar from '../components/MannaJar';
import { SpiritualPulse } from '../components/BeautifulWidgets';

interface Highlight {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  verse_text?: string;
  color: string;
  created_at: string;
}

interface Note {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  verse_text?: string;
  content: string;
  updated_at: string;
}

interface Bookmark {
  id: string;
  item_id: string;
  item_type: 'article' | 'thread' | 'video' | 'devo';
  item_title: string;
  created_at: any;
}

export default function UserDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [stats, setStats] = useState({ highlights: 0, notes: 0, bookmarks: 0, prayers: 0, streak: 0, chapters: 0 });
  const [readingData, setReadingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  const getSpiritualInsight = async () => {
    if (highlights.length === 0 && notes.length === 0) return;
    setIsGeneratingInsight(true);
    const result = await generateSpiritualInsight({
      highlights: highlights.map(h => `${h.book} ${h.chapter}:${h.verse} - ${h.verse_text || ''}`),
      notes: notes.map(n => n.content)
    });
    setInsight(result);
    setIsGeneratingInsight(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/profile');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch Counts using Supabase
        const queryOptions = { count: 'exact', head: true };
        const [{ count: hCount }, { count: nCount }, { count: bCount }, { count: pCount }, { count: progressCount }] = await Promise.all([
          supabase.from('highlights').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
          supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
          supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
          supabase.from('prayers').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
          supabase.from('reading_progress').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        ]);
        
        setStats({
          highlights: hCount || 0,
          notes: nCount || 0,
          bookmarks: bCount || 0,
          prayers: pCount || 0,
          streak: profile?.streak || 0,
          chapters: progressCount || 0
        });

        // Generate Reading Activity Data
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activity = days.map(day => ({
          name: day,
          chapters: Math.floor(Math.random() * 5) + 1,
          prayers: Math.floor(Math.random() * 3) + 1
        }));
        setReadingData(activity);

        // Fetch Recent Items
        const [{ data: recentH }, { data: recentN }, { data: recentB }] = await Promise.all([
          supabase.from('highlights').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('notes').select('*').eq('user_id', user!.id).order('updated_at', { ascending: false }).limit(5),
          supabase.from('bookmarks').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
        ]);

        if (recentH) setHighlights(recentH as Highlight[]);
        if (recentN) setNotes(recentN as Note[]);
        if (recentB) setBookmarks(recentB as Bookmark[]);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-primary)] font-serif text-xl">Preparing your study...</div>
      </div>
    );
  }

  const getBookmarkLink = (bookmark: Bookmark) => {
    switch(bookmark.item_type) {
      case 'article': return '/articles';
      case 'thread': return `/threads/${bookmark.item_id}`;
      case 'video': return '/videos';
      case 'devo': return '/devotionals';
      default: return '/';
    }
  };

  const achievements = [
    { id: 'berean', label: 'Berean', description: 'Deep scripture study (20+ chapters)', active: stats.chapters >= 20, icon: BookOpen, color: 'text-amber-400' },
    { id: 'psalmist', label: 'Psalmist', description: 'Regular heart reflections (10+ notes)', active: stats.notes >= 10, icon: Feather, color: 'text-purple-400' },
    { id: 'intercessor', label: 'Intercessor', description: 'Faithful in prayer (5+ prayers)', active: stats.prayers >= 5, icon: HandHelping, color: 'text-rose-400' },
    { id: 'illuminator', label: 'Illuminator', description: 'Rich highlighting (30+ verses)', active: stats.highlights >= 30, icon: Sun, color: 'text-[var(--color-primary)]' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-32">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6"
      >
        <div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[var(--color-text)] tracking-tight mb-2">
            Peace be with you, <span className="text-[var(--color-primary)]">{profile?.displayName?.split(' ')[0] || 'Seeker'}</span>
          </h1>
          <p className="text-[var(--color-text-muted)] text-base md:text-lg">Continue your journey through the Word today.</p>
        </div>
        
        <div className="flex gap-2 md:gap-4">
          <Link to="/profile" className="flex-1 md:flex-none justify-center flex items-center gap-2 glass-panel px-4 py-2 rounded-xl text-sm hover:bg-[var(--color-text)]/10 transition-colors">
            <UserIcon size={18} /> Profile
          </Link>
          <Link to="/read" className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-background)] px-6 py-2 rounded-xl text-sm font-bold shadow-neon-glow hover:scale-105 active:scale-95 transition-all">
            <BookOpen size={18} /> Start Reading
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)] text-center">
          <div className="text-3xl font-bold text-[var(--color-text)] mb-1">{stats.highlights}</div>
          <div className="text-xs uppercase tracking-widest text-[var(--color-primary)] font-bold">Highlights</div>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)] text-center">
          <div className="text-3xl font-bold text-[var(--color-text)] mb-1">{stats.notes}</div>
          <div className="text-xs uppercase tracking-widest text-[var(--color-primary)] font-bold">Reflections</div>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)] text-center">
          <div className="text-3xl font-bold text-[var(--color-text)] mb-1">{stats.bookmarks}</div>
          <div className="text-xs uppercase tracking-widest text-[var(--color-primary)] font-bold">Saved</div>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)] text-center">
          <div className="text-3xl font-bold text-[var(--color-text)] mb-1">{stats.prayers}</div>
          <div className="text-xs uppercase tracking-widest text-[var(--color-primary)] font-bold">Prayers</div>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)] text-center bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent">
          <div className="text-3xl font-bold text-[var(--color-primary)] mb-1 flex items-center justify-center gap-2">
            <Sun size={20} /> {stats.chapters}
          </div>
          <div className="text-xs uppercase tracking-widest text-[var(--color-primary)] font-bold">Chapters</div>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-orange-500/10 text-center bg-gradient-to-br from-orange-500/10 to-transparent">
          <div className="text-3xl font-bold text-orange-400 mb-1 flex items-center justify-center gap-2">
            <Calendar size={20} /> {stats.streak}
          </div>
          <div className="text-xs uppercase tracking-widest text-orange-400 font-bold">Day Streak</div>
        </div>
      </div>

      {/* Daily Manna Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <MannaJar />
      </motion.div>

      {/* Analytics Section */}
      <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-panel p-8 rounded-[2.5rem] border border-[var(--color-border-subtle)]">
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                          <Activity size={20} />
                      </div>
                      <div>
                          <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Reading Activity</h3>
                          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-black">Weekly Engagement</p>
                      </div>
                  </div>
                  <div className="text-[10px] uppercase font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">On Track</div>
              </div>
              <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={readingData}>
                          <defs>
                              <linearGradient id="colorChapters" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                          <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis stroke="var(--color-text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text)' }}
                            itemStyle={{ fontSize: '12px' }}
                          />
                          <Area type="monotone" dataKey="chapters" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorChapters)" strokeWidth={3} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <SpiritualPulse />
      </div>

      {/* AI Spiritual Insight Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="glass-card rounded-[2.5rem] p-6 md:p-10 border border-[var(--color-primary)]/20 shadow-neon-glow relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-blue-500/5"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <BrainCircuit size={160} />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[var(--color-primary)]/20 rounded-2xl flex items-center justify-center text-[var(--color-primary)] shadow-neon">
                <Sparkles size={28} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-[var(--color-text)]">Scribe Study Synthesis</h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)] font-bold">Divine Wisdom from your highlights & reflections</p>
              </div>
            </div>
            
            <button 
              onClick={getSpiritualInsight}
              disabled={isGeneratingInsight || (highlights.length === 0 && notes.length === 0)}
              className="px-8 py-3 bg-[var(--color-primary)] text-[var(--color-background)] rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-neon"
            >
              {isGeneratingInsight ? 'Synthesizing...' : 'Generate New Insight'}
            </button>
          </div>

          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-text)]/2 min-h-[150px] flex items-center justify-center">
            {insight ? (
              <div className="prose prose-invert prose-p:leading-relaxed prose-p:mb-4 last:prose-p:mb-0 max-w-none font-serif text-[var(--color-text)]/90 italic">
                <ReactMarkdown>{insight}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Lightbulb size={40} className="mx-auto text-[var(--color-primary)]/20" />
                <p className="text-[var(--color-text-muted)] text-sm max-w-sm">
                  {highlights.length > 0 || notes.length > 0 
                    ? "Click the button above to have Scribe analyze your recent studies and provide a tailored spiritual summary."
                    : "Start highlighting scripture and writing reflections to unlock AI Study Synthesis."}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Hall of Faith */}
        <div className="glass-panel p-8 rounded-[2.5rem] border border-[var(--color-border-subtle)] flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
               <Trophy size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Hall of Faith</h3>
              <p className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] font-black">Spiritual Legacies</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 flex-1">
             {achievements.map(award => (
               <div key={award.id} className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-2 group ${award.active ? `bg-[var(--color-text)]/5 border-${award.color.split('-')[1]}-500/30` : 'bg-[var(--color-text)]/5 border-[var(--color-border-subtle)] grayscale opacity-40'}`}>
                  <award.icon className={`${award.active ? award.color : 'text-[var(--color-text-muted)]'} group-hover:scale-110 transition-transform`} size={28} />
                  <div>
                    <div className={`text-xs font-black uppercase tracking-tighter ${award.active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>{award.label}</div>
                    <div className="text-[8px] text-[var(--color-text-muted)] leading-none mt-1">{award.description}</div>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Quick Journal Access */}
        <div className="glass-panel p-8 rounded-[2.5rem] border border-[var(--color-border-subtle)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                <Feather size={20} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Heart Reflection</h3>
                <p className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] font-black">Spiritual Journal</p>
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mb-6 leading-relaxed">
              Pour out thy heart in thy personal journal and receive a word of comfort from the Elects Shepherd.
            </p>
          </div>
          <Link 
            to="/journal" 
            className="w-full py-4 bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] text-[var(--color-text)] rounded-full font-bold text-sm hover:bg-[var(--color-text)]/10 transition-all flex items-center justify-center gap-2 group"
          >
            Open My Journal
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <ScriptureArtGenerator 
          verse={highlights[0] ? `Verse from ${highlights[0].book} ${highlights[0].chapter}:${highlights[0].verse}` : "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."}
          reference={highlights[0] ? `${highlights[0].book} ${highlights[0].chapter}:${highlights[0].verse}` : "Jeremiah 29:11"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Bookmarks Section */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-[var(--color-text)] flex items-center gap-2">
              <Bookmark className="text-[var(--color-primary)]" size={20} /> My Ebooks
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.length > 0 ? (
              bookmarks.map(b => (
                <Link 
                  key={b.id} 
                  to={getBookmarkLink(b)}
                  className="glass-card p-5 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/30 transition-all group flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase tracking-widest font-black text-[var(--color-primary)] mb-2 block">{b.item_type}</span>
                    <h3 className="text-sm font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors truncate">{b.item_title}</h3>
                  </div>
                  <ChevronRight size={16} className="text-[var(--color-text)]/20 group-hover:text-[var(--color-primary)]" />
                </Link>
              ))
            ) : (
              <div className="col-span-full glass-panel p-8 rounded-2xl border-dashed border-2 border-[var(--color-border-subtle)] text-center text-[var(--color-text-muted)] text-sm">
                Your personal library is empty. Bookmark articles and threads to see them here!
              </div>
            )}
          </div>
        </div>
        {/* Recent Highlights */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-[var(--color-text)] flex items-center gap-2">
              <Star size={20} className="text-yellow-400" /> Recent Highlights
            </h2>
            <Link to="/read" className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="space-y-3">
            {highlights.length > 0 ? (
              highlights.map(h => (
                <Link 
                  key={h.id} 
                  to={`/read?book=${h.book}&chapter=${h.chapter}`}
                  className="block glass-card p-4 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: h.color }}></div>
                      <span className="text-sm font-bold text-[var(--color-primary)]">{h.book} {h.chapter}:{h.verse}</span>
                    </div>
                    <Clock size={12} className="text-[var(--color-text)]/20" />
                  </div>
                  <div className="text-sm text-[var(--color-text)]/70 italic line-clamp-2">
                    {h.verse_text ? `"${h.verse_text}"` : "Click to revisit this verse in context..."}
                  </div>
                </Link>
              ))
            ) : (
              <div className="glass-panel p-8 rounded-2xl border-dashed border-2 border-[var(--color-border-subtle)] text-center text-[var(--color-text-muted)] text-sm">
                No highlights yet. Start reading to save your favorites!
              </div>
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-[var(--color-text)] flex items-center gap-2">
              <Pencil size={20} className="text-[var(--color-primary)]" /> My Reflections
            </h2>
            <Link to="/read" className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="space-y-3">
            {notes.length > 0 ? (
              notes.map(n => (
                <div 
                  key={n.id} 
                  className="glass-card p-4 rounded-2xl border border-[var(--color-border-subtle)] relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-[var(--color-primary)]">{n.book} {n.chapter}:{n.verse}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{new Date(n.updated_at).toLocaleDateString()}</span>
                  </div>
                  {n.verse_text && (
                    <p className="text-xs text-[var(--color-text)]/50 italic border-l-2 border-[var(--color-primary)]/30 pl-2 py-1 mb-2">
                      "{n.verse_text}"
                    </p>
                  )}
                  <p className="text-sm text-[var(--color-text)]/80 line-clamp-3 leading-relaxed">
                    {n.content}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <Link to={`/read?book=${n.book}&chapter=${n.chapter}`} className="text-[10px] uppercase font-bold text-[var(--color-primary)] hover:text-[var(--color-text)] transition-colors">
                      Edit Note &rarr;
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel p-8 rounded-2xl border-dashed border-2 border-[var(--color-border-subtle)] text-center text-[var(--color-text-muted)] text-sm">
                Your study journal is empty. Share your thoughts as you read!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Explore Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/prayers', icon: HandHelping, label: 'Prayers', desc: 'Prayer wall' },
          { to: '/jpw', icon: Feather, label: 'JPW', desc: 'Journey of Prophetic words' },
          { to: '/study-groups', icon: UserPlus, label: 'Groups', desc: 'Connect locally' },
          { to: '/forum', icon: MessageSquare, label: 'Forum', desc: 'Debate & learn' },
          { to: '/devotionals', icon: Sun, label: 'Devotional', desc: 'Life & Immortality' },
          { to: '/articles', icon: FileText, label: 'Articles', desc: 'Deep dives' },
          { to: '/ebooks', icon: BookOpenText, label: 'Ebooks', desc: 'Study books' },
          { to: '/journal', icon: Pencil, label: 'Journal', desc: 'Personal reflections' },
          { to: '/videos', icon: Video, label: 'Videos', desc: 'Watch & grow' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="glass-card p-4 rounded-2xl border border-[var(--color-border-subtle)] flex flex-col items-center gap-1 hover:bg-[var(--color-text)]/5 transition-all text-center group">
            <item.icon size={20} className="text-[var(--color-primary)] mb-1" />
            <span className="text-xs font-bold text-[var(--color-text)] leading-none">{item.label}</span>
            <span className="text-[9px] text-[var(--color-text-muted)] leading-tight line-clamp-1 group-hover:text-[var(--color-text)]/60 transition-colors">{item.desc}</span>
          </Link>
        ))}
      </div>

      {/* Explore Section */}
      <div className="space-y-6 pt-4">
        <h2 className="text-2xl font-serif font-bold text-[var(--color-text)]">Continue Your Study</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/plans" className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)] hover:shadow-neon-glow transition-all group overflow-hidden relative">
             <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <Calendar size={120} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">Reading Plans</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Stay disciplined with guided daily reading paths.</p>
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase flex items-center gap-1">View Plans <ChevronRight size={14} /></span>
          </Link>

          <Link to="/devotionals" className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)] hover:shadow-neon-glow transition-all group overflow-hidden relative">
             <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <Bookmark size={120} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">Devotional</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Life & Immortality - Soul nourishment.</p>
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase flex items-center gap-1">Read Today <ChevronRight size={14} /></span>
          </Link>

          <Link to="/videos" className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)] hover:shadow-neon-glow transition-all group overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <BookOpen size={120} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">Video Lessons</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Deep dive into biblical themes with our experts.</p>
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase flex items-center gap-1">Watch Now <ChevronRight size={14} /></span>
          </Link>
        </div>
      </div>
    </div>
  );
}
