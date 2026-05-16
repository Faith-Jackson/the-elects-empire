import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, BrainCircuit, Users, PenTool, Mic, Sparkles, ChevronRight, ChevronLeft, Star, Zap, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgImage: string;
  link: string;
  tag: string;
  update?: string;
}

const features: Feature[] = [
  {
    id: 'ai',
    title: 'Elects AI Wisdom',
    description: 'Engage with our advanced AI trained on foundational spiritual truths for deep discovery.',
    icon: BrainCircuit,
    color: 'text-cyan-400',
    bgImage: 'https://images.unsplash.com/photo-1620712943543-bcc4638d9f8e?auto=format&fit=crop&q=80&w=1200',
    link: '/ai',
    tag: 'POWERED BY GROQ',
    update: 'v2.4: Now with enhanced theological cross-referencing.'
  },
  {
    id: 'bible',
    title: 'Immersive Reader',
    description: 'Experience the Word like never before with high-fidelity typography and cross-references.',
    icon: BookOpen,
    color: 'text-amber-400',
    bgImage: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=1200',
    link: '/read',
    tag: 'CORE RESOURCE',
    update: 'New: Parallel translation mode added.'
  },
  {
    id: 'jpw',
    title: 'JPW',
    description: 'Explore the Journey of Prophetic Words (JPW) for divine guidance and insight.',
    icon: Sparkles,
    color: 'text-purple-400',
    bgImage: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&q=80&w=1200',
    link: '/jpw',
    tag: 'DIVINE INSIGHT',
    update: 'Recent: 50+ new prophetic archives synchronized.'
  },
  {
    id: 'groups',
    title: 'Global Fellowship',
    description: 'Join study groups and connect with spiritual citizens across the globe.',
    icon: Users,
    color: 'text-emerald-400',
    bgImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1200',
    link: '/study-groups',
    tag: 'COMMUNITY',
    update: 'Live: 12 active study sessions happening now.'
  },
  {
    id: 'notebook',
    title: 'Rich Notebook',
    description: 'A premium space for your findings, rhemas, and personal spiritual documentation.',
    icon: PenTool,
    color: 'text-rose-400',
    bgImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1200',
    link: '/notebook',
    tag: 'PRODUCTIVITY',
    update: 'Feature: Auto-link verses directly in your notes.'
  }
];

export default function DynamicFeatureWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [spotlightUsers, setSpotlightUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState('2k');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpotlightData = async () => {
      // Fetch 5 active users with avatars
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, displayName, avatarUrl')
        .not('avatarUrl', 'is', null)
        .limit(5);
      
      if (profiles && profiles.length > 0) {
        setSpotlightUsers(profiles);
      }

      // Fetch total count for social proof
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (count) {
        setTotalUsers(count > 1000 ? `${(count/1000).toFixed(1)}k` : count.toString());
      }
    };

    fetchSpotlightData();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const currentFeature = features[currentIndex];

  const next = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % features.length);
  };

  const prev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="relative w-full h-[450px] md:h-[500px] overflow-hidden rounded-[3rem] group/widget shadow-2xl border border-[var(--color-border-subtle)] bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFeature.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear"
            style={{ 
              backgroundImage: `url(${currentFeature.bgImage})`,
              transform: isAutoPlaying ? 'scale(1.2)' : 'scale(1)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
          
          {/* Content */}
          <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-center max-w-2xl space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="px-3 py-1 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 backdrop-blur-md">
                <span className="text-[10px] font-black tracking-[0.3em] text-[var(--color-primary)] uppercase">
                  {currentFeature.tag}
                </span>
              </div>
              {currentFeature.update && (
                <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                  <Zap size={10} className="text-yellow-400" />
                  {currentFeature.update}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-none glow-text-white">
                {currentFeature.title}
              </h2>
              <p className="text-lg md:text-xl text-white/70 font-medium leading-relaxed max-w-lg">
                {currentFeature.description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <button 
                onClick={() => navigate(currentFeature.link)}
                className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[var(--color-primary)] hover:text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                Experience Now <ChevronRight size={14} />
              </button>
              
              <div className="flex items-center -space-x-3">
                {spotlightUsers.length > 0 ? (
                  spotlightUsers.map(u => (
                    <div key={u.id} className="w-10 h-10 rounded-full border-2 border-black overflow-hidden shadow-xl bg-[var(--color-primary)] flex items-center justify-center">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-[10px] font-bold">{u.displayName?.charAt(0) || 'E'}</span>
                      )}
                    </div>
                  ))
                ) : (
                  [1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black overflow-hidden shadow-xl bg-white/10" />
                  ))
                )}
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center text-[10px] text-white font-bold">
                  +{totalUsers}
                </div>
                <span className="ml-6 text-xs text-white/50 font-bold uppercase tracking-widest">citizens online</span>
              </div>
            </motion.div>
          </div>

          {/* Icon Float */}
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -45 }}
            animate={{ opacity: 0.2, scale: 1, rotate: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
            className={`absolute top-1/2 right-10 md:right-32 -translate-y-1/2 pointer-events-none hidden lg:block ${currentFeature.color}`}
          >
            <currentFeature.icon size={300} strokeWidth={0.5} />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-8 right-8 flex items-center gap-4 z-20">
        <button 
          onClick={prev}
          className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white transition-all active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={next}
          className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white transition-all active:scale-90"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-8 left-8 flex items-center gap-2 z-20">
        {features.map((f, idx) => (
          <button
            key={f.id}
            onClick={() => {
              setIsAutoPlaying(false);
              setCurrentIndex(idx);
            }}
            className={`h-1.5 transition-all duration-500 rounded-full ${currentIndex === idx ? 'w-8 bg-[var(--color-primary)]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
