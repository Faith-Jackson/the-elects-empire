import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, AlertCircle, FileText, Book, Video, Users, BookMarked, UserPlus, MessageSquare, HandHelping, ListChecks, BookOpenText, Mic, BrainCircuit, Shield, Music, ChevronRight, Sun, Feather, Zap } from 'lucide-react';
import { motion } from "motion/react";
import VerseOfTheDay from '../components/VerseOfTheDay';
import CommunityHeartbeat from '../components/CommunityHeartbeat';
import MannaJar from '../components/MannaJar';
import AppLogo from '../components/AppLogo';
import { HelpTooltip } from '../components/HelpTooltip';
import SEO from '../components/SEO';
import DynamicFeatureWidget from '../components/DynamicFeatureWidget';
import { SacredBanner } from '../components/BeautifulWidgets';

export default function Home() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="h-screen flex items-center justify-center text-[var(--color-primary)]">Opening the sanctuary gates...</div>;

  const isAdmin = profile?.role === 'admin';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-12 p-4 md:p-8 mb-24"
    >
      <SEO 
        title="The Elects Empire - Centered in Jesus Christ"
        description="Join a chosen generation in a digital sanctuary for deep biblical findings, communal prayer, and spiritual growth. The Elects Empire is your platform for faith and fellowship."
        keywords="Jesus Christ, Elects Empire, Bible Study, Christian Fellowship, Prayer Wall, Faith Growth"
      />
      {/* Admin Command Strip */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-400/10 border border-yellow-400/20 p-3 rounded-2xl flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
             <Shield size={16} className="text-yellow-400" />
             <span className="text-[10px] uppercase font-black tracking-widest text-yellow-400">Elder Administrative Oversight Active</span>
          </div>
          <Link to="/admin" className="text-[10px] uppercase font-black text-black bg-yellow-400 px-4 py-1 rounded-lg hover:scale-105 transition-all">Open Dashboard</Link>
        </motion.div>
      )}

      {/* Hero Section */}
      <div className="relative group perspective-1000">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-[100px] animate-blob mix-blend-screen pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen pointer-events-none"></div>
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { 
              opacity: 1, 
              scale: 1,
              transition: { 
                duration: 0.8, 
                ease: "easeOut",
                staggerChildren: 0.15,
                delayChildren: 0.2
              }
            }
          }}
          className="relative z-10 p-10 md:p-24 text-center space-y-8 bg-transparent"
        >
          <motion.div 
            variants={{
              hidden: { opacity: 0, scale: 0.5, rotate: -20 },
              visible: { 
                opacity: 1, 
                scale: 1, 
                rotate: 0,
                transition: { type: "spring", stiffness: 100, damping: 15 } 
              }
            }}
            className="flex justify-center mb-6 relative z-10"
          >
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               whileHover={{ rotate: 180 }}
               className="w-20 h-20 bg-[var(--color-primary)]/10 rounded-3xl flex items-center justify-center text-[var(--color-primary)] shadow-neon-glow relative group/icon"
             >
                <div className="absolute inset-0 bg-[var(--color-primary)]/20 blur-xl opacity-0 group-hover/icon:opacity-100 transition-opacity"></div>
                <BookOpen size={36} className="relative z-10" />
             </motion.div>
          </motion.div>

          <div className="space-y-4">
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20"
            >
              <Sun size={12} className="text-[var(--color-primary)]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-black">Centered in Jesus Christ</span>
            </motion.div>
            <motion.h1 
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.8, ease: "easeOut" }
                }
              }}
              className="text-5xl sm:text-7xl md:text-9xl font-serif font-bold text-[var(--color-text)] tracking-tightest leading-[0.9] glow-text py-2"
            >
              The Elects <br className="hidden md:block" /> Empire
            </motion.h1>
          </div>

          <motion.p 
            variants={{
              hidden: { opacity: 0, filter: "blur(4px)" },
              visible: { opacity: 1, filter: "blur(0px)" }
            }}
            className="text-[var(--color-text-muted)] text-lg sm:text-xl md:text-3xl italic font-serif max-w-4xl mx-auto leading-tight"
          >
            "Ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people..."
            <span className="block mt-4 text-sm md:text-lg not-italic font-sans font-medium text-[var(--color-text)]/60 max-w-2xl mx-auto">
              The reality of 1 Peter 2:9 is not a future promise, but a present spiritual sovereignty. In Christ, we are the manifest architecture of His Kingdom on Earth.
            </span>
          </motion.p>
          
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12"
          >
            <button 
              onClick={() => navigate('/read')}
              className="group relative w-full sm:w-auto overflow-hidden bg-[var(--color-text)] text-[var(--color-background)] px-12 py-5 rounded-3xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity translate-y-full group-hover:translate-y-0 duration-300"></div>
              <span className="relative z-10 group-hover:text-[var(--color-background)]">Enter the Word</span>
            </button>
            <button 
              onClick={() => navigate('/ai')}
              className="w-full sm:w-auto bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] text-[var(--color-text)] px-12 py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-[var(--color-text)]/10 transition-all flex items-center justify-center gap-3 backdrop-blur-sm shadow-xl"
            >
              <BrainCircuit size={18} className="text-[var(--color-primary)] animate-pulse" />
              Consult Elects AI
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Dynamic Feature Spotlight */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10"
      >
        <div className="flex items-center gap-3 mb-6 px-4">
           <Zap size={20} className="text-[var(--color-primary)] animate-pulse" />
           <h2 className="text-2xl font-serif font-bold text-[var(--color-text)]">Empire Spotlight</h2>
           <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-border-subtle)] to-transparent" />
        </div>
        <DynamicFeatureWidget />
      </motion.div>

      {/* Global Connection Ticker */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        <CommunityHeartbeat />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 items-stretch">
        <div className="lg:col-span-2">
          <VerseOfTheDay />
        </div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-card p-10 rounded-[2.5rem] flex flex-col justify-center space-y-6 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent"
        >
          <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] mb-2">
            <BrainCircuit size={24} />
          </div>
          <h3 className="font-serif font-bold text-2xl text-[var(--color-text)]">Empire Wisdom</h3>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Our AI is trained on the foundational truths of the Empire, ready to assist your spiritual discovery.
          </p>
          <div className="space-y-3">
             <button onClick={() => navigate('/ai')} className="group w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--color-text)]/5 hover:bg-[var(--color-text)]/10 border border-[var(--color-border-subtle)] transition-all">
                <span className="text-[10px] font-black uppercase tracking-widest">Ask the Elects AI</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </motion.div>
      </div>


      {/* Guest Call-to-Action */}
      {!user && (
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="glass-card p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center text-[var(--color-background)] shadow-neon">
                <Users size={32} />
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-serif font-bold text-2xl text-[var(--color-text)]">Join The Empire</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-md">Sign in to sync your study journey, participate in communal prayers, and receive personalized spiritual insights.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-full md:w-auto bg-[var(--color-primary)] text-[var(--color-background)] px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-neon"
          >
            Authenticate
          </button>
        </motion.div>
      )}

      {/* The Great Explore Grid (Bento Style) */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
           <div className="space-y-1">
             <div className="flex items-center gap-2">
               <h2 className="text-3xl font-serif font-bold text-[var(--color-text)]">Explore the Empire</h2>
               <HelpTooltip content="Navigate through the various tools, resources, and fellowship features designed to aid your study and growth in Christ." type="help" />
             </div>
             <p className="text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest mt-1">Navigating the fullness of Christ together.</p>
           </div>
           <Link to="/search" className="group flex items-center gap-2 text-[10px] uppercase font-black text-[var(--color-primary)] tracking-widest hover:text-[var(--color-text)] transition-colors">
              Full Search Index
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>
        
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {[
            { to: '/prayers', icon: HandHelping, label: 'Prayers', desc: 'Prayer Wall', color: 'text-rose-400', bg: 'bg-rose-500/5' },
            { to: '/jpw', icon: Feather, label: 'JPW', desc: 'Prophetic Words', color: 'text-sky-400', bg: 'bg-sky-500/5' },
            { to: '/study-groups', icon: UserPlus, label: 'Groups', desc: 'Fellowship', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
            { to: '/forum', icon: MessageSquare, label: 'Forum', desc: 'Discussion', color: 'text-amber-400', bg: 'bg-amber-500/5' },
            { to: '/devotionals', icon: Sun, label: 'Devotional', desc: 'Life & Immortality', color: 'text-indigo-400', bg: 'bg-indigo-500/5' },
            { to: '/articles', icon: FileText, label: 'Articles', desc: 'Deep Theology', color: 'text-violet-400', bg: 'bg-violet-500/5' },
            { to: '/ebooks', icon: BookOpenText, label: 'Ebooks', desc: 'Resource Library', color: 'text-orange-400', bg: 'bg-orange-400/5' },
            { to: '/videos', icon: Video, label: 'Videos', desc: 'Video Lessons', color: 'text-red-400', bg: 'bg-red-500/5' },
            { to: '/sermons', icon: Mic, label: 'Sermons', desc: 'Audio Archive', color: 'text-teal-400', bg: 'bg-teal-500/5' },
            { to: '/music', icon: Music, label: 'Music', desc: 'Sacred Melodies', color: 'text-pink-400', bg: 'bg-pink-500/5' },
            { to: '/plans', icon: ListChecks, label: 'Roadmap', desc: 'Your Progress', color: 'text-blue-400', bg: 'bg-blue-500/5' },
            { to: '/memory', icon: BrainCircuit, label: 'Memory', desc: 'Hide the Word', color: 'text-purple-400', bg: 'bg-purple-500/5' },
          ].map((item, idx) => (
            <motion.div
              key={item.to}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative"
            >
              <Link 
                to={item.to} 
                className={`h-full glass-card p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-[var(--color-primary)]/50 transition-all text-center group ${item.bg}`}
              >
                <div className={`p-4 rounded-[1.5rem] bg-[var(--color-background)] shadow-inner flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform duration-500`}>
                  <item.icon size={28} />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-black text-[var(--color-text)] leading-none uppercase tracking-tighter">{item.label}</span>
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold tracking-[0.2em] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">{item.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {user && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="pt-12"
        >
          <SacredBanner />
        </motion.div>
      )}

      {user && <MannaJar />}
    </motion.div>
  );
}
