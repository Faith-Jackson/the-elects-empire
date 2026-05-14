import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Trash2, Loader2, Sparkles, MessageSquare, Plus, History, ChevronLeft, Menu, X, GraduationCap, HeartHandshake, Zap, ShieldCheck, Copy, Check, BrainCircuit, Bot } from 'lucide-react';
import { askElectsAI, AICoachType } from '../services/groqService';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updated_at: string;
}

export default function ElectsAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<AICoachType>('scholar');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const coaches = [
    { id: 'scholar' as AICoachType, name: 'Scripture Scholar', icon: GraduationCap, color: 'text-blue-400', desc: 'Exegetical & Deep' },
    { id: 'shepherd' as AICoachType, name: 'Compassionate Shepherd', icon: HeartHandshake, color: 'text-rose-400', desc: 'Emotional & Gentle' },
    { id: 'prophet' as AICoachType, name: 'Prophetic Voice', icon: Zap, color: 'text-amber-400', desc: 'Visionary & Bold' },
    { id: 'intercessor' as AICoachType, name: 'Warrior Intercessor', icon: ShieldCheck, color: 'text-emerald-400', desc: 'Prayer-focused' },
  ];

  const fetchSessions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ai_chats')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);
    
    if (data) setSessions(data as ChatSession[]);
  };

  useEffect(() => {
    if (!user) return;
    fetchSessions();

    const channel = supabase
      .channel('public:ai_chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_chats', filter: `user_id=eq.${user.id}` }, () => fetchSessions())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const selectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const historyItems = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const aiResponse = await askElectsAI(userMessage, historyItems, selectedCoach);
      if (aiResponse) {
        const finalMessages: Message[] = [...newMessages, { role: 'model', content: aiResponse }];
        setMessages(finalMessages);
        
        if (user) {
          if (activeSessionId) {
            await supabase.from('ai_chats').update({
              messages: finalMessages,
              updated_at: new Date().toISOString()
            }).eq('id', activeSessionId);
          } else {
            const { data } = await supabase.from('ai_chats').insert({
              user_id: user.id,
              title: userMessage.slice(0, 40) + (userMessage.length > 40 ? '...' : ''),
              messages: finalMessages,
              updated_at: new Date().toISOString()
            }).select().single();
            
            if (data) setActiveSessionId(data.id);
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Forgive me, I encountered a connection issue. Please try your question again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this study session forever?')) {
      await supabase.from('ai_chats').delete().eq('id', id);
      if (activeSessionId === id) startNewChat();
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden relative">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:relative z-[100] h-full w-72 glass-panel border-r border-[var(--color-border-subtle)] flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-[var(--color-border-subtle)]">
          <button 
            onClick={startNewChat}
            className="w-full py-3 px-4 rounded-xl bg-[var(--color-primary)] text-black font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-neon"
          >
            <Plus size={18} /> New Discussion
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          <h3 className="px-3 text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-bold mb-3">Recent Studies</h3>
          {sessions.map(s => (
            <div 
              key={s.id}
              onClick={() => selectSession(s)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                activeSessionId === s.id ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-neon-glow' : 'hover:bg-[var(--color-text)]/5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className="shrink-0" />
                <span className="text-xs truncate font-medium">{s.title}</span>
              </div>
              <button 
                onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="p-8 text-center text-[10px] text-white/20 uppercase tracking-widest font-medium italic">
               No previous studies found.
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden backdrop-blur-3xl bg-transparent">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)] glass-panel shadow-lg shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/10 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center text-[var(--color-primary)] shadow-neon border border-[var(--color-primary)]/20">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold text-[var(--color-text)] leading-tight">Scribe</h1>
              <p className="text-[9px] uppercase tracking-widest text-[var(--color-primary)] font-bold opacity-80 font-sans">Christ-Centric Reality</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              if (confirm('Clear current discussion?')) {
                if (activeSessionId) supabase.from('ai_chats').delete().eq('id', activeSessionId);
                startNewChat();
              }
            }}
            className="p-2.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            title="Clear Discussion"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-10 bg-[var(--color-primary)]/5 rounded-full border border-[var(--color-primary)]/10 text-[var(--color-primary)]/40 relative"
              >
                <div className="absolute inset-0 bg-[var(--color-primary)]/10 blur-3xl rounded-full"></div>
                <Sparkles size={80} className="animate-pulse relative z-10" />
              </motion.div>
              <div className="max-w-md space-y-2">
                <h2 className="text-3xl font-serif text-[var(--color-text)] font-bold tracking-tight">The Reality of Christ</h2>
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed font-medium">
                  Discover your identity in the Empire of Christ. Learn why Christ and the believer are the only true substance.
                </p>
              </div>
              
              <div className="text-center">
                <h3 className="text-[10px] uppercase tracking-widest text-[var(--color-primary)] font-black mb-6">Choose thy Spiritual Coach</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl px-4">
                  {coaches.map(coach => (
                    <button
                      key={coach.id}
                      onClick={() => setSelectedCoach(coach.id)}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group relative overflow-hidden ${
                        selectedCoach === coach.id 
                        ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] shadow-neon-glow scale-105' 
                        : 'glass-panel border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-text)]/5'
                      }`}
                    >
                      <coach.icon size={24} className={`${coach.color} group-hover:scale-110 transition-transform`} />
                      <span className="text-[10px] font-black uppercase text-[var(--color-text)]">{coach.name}</span>
                      <span className="text-[8px] text-[var(--color-text-muted)] italic leading-tight text-center px-1">{coach.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mt-12">
                {[
                  "How is Jesus an Empire according to 1 Peter 2:9?",
                  "Finding everything for life and godliness in Him",
                  "Why is Christ the only true substance?",
                  "Jesus as the center of the entire Bible"
                ].map(prompt => (
                  <button 
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="p-5 text-left glass-card border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/40 rounded-2xl text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[90%] md:max-w-[80%] gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`mt-1 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${message.role === 'user' ? 'bg-[var(--color-text)]/5 border-[var(--color-border-subtle)] text-[var(--color-text-muted)]' : 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-neon'}`}>
                    {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  
                  <div className={`p-5 md:p-7 rounded-[2rem] leading-relaxed text-[15px] shadow-2xl relative group/message ${
                    message.role === 'user' 
                    ? 'bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] text-[var(--color-text)]/90 rounded-tr-none' 
                    : 'glass-panel border border-[var(--color-border-subtle)] text-[var(--color-text)]/90 rounded-tl-none shadow-neon-glow'
                  }`}>
                    {message.role === 'model' && (
                      <button
                        onClick={() => copyToClipboard(message.content, index)}
                        className="absolute top-4 right-4 p-2 rounded-lg bg-[var(--color-background)]/50 border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-all opacity-0 group-hover/message:opacity-100 backdrop-blur-md"
                        title="Copy study session text"
                      >
                        {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                    <div className="prose prose-invert prose-p:leading-[1.8] prose-p:mb-4 last:prose-p:mb-0 max-w-none font-serif">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex max-w-[85%] gap-4">
                <div className="mt-1 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-neon">
                  <Bot size={20} />
                </div>
                <div className="glass-panel border border-[var(--color-border-subtle)] p-5 rounded-[2rem] rounded-tl-none shadow-neon-glow flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-[var(--color-primary)]" />
                  <span className="text-[11px] text-[var(--color-primary)] font-black uppercase tracking-[0.2em] animate-pulse">Consulting the Word...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 md:p-8 shrink-0">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[var(--color-primary)]/30 to-blue-500/30 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex gap-4 p-2.5 md:p-3 glass-panel border border-[var(--color-border-subtle)] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask Scribe about the sufficiency of Christ..."
                className="flex-1 bg-transparent border-none focus:outline-none text-[var(--color-text)] px-5 py-3 text-sm md:text-base placeholder:text-[var(--color-text-muted)]/40 font-medium"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-4 rounded-2xl transition-all shadow-xl ${
                  !input.trim() || isLoading 
                  ? 'bg-[var(--color-text)]/5 text-[var(--color-text-muted)]/20 cursor-not-allowed' 
                  : 'bg-[var(--color-primary)] text-[var(--color-background)] hover:scale-105 active:scale-95 shadow-neon-glow'
                }`}
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
              </button>
            </div>
          </div>
          <p className="mt-4 text-center text-[9px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] font-black"> Revealing the One True Substance: Jesus Christ </p>
        </div>
      </div>
    </div>
  );
}
