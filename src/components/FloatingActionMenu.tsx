import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, BookOpen, BrainCircuit, PenTool, Users, X, 
  Settings, Mic, BookOpenText, HandHelping, MessageSquare, 
  FileText, Sun, Star, Check, GripVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActionItem {
  id: string;
  icon: any;
  label: string;
  path: string;
  color: string;
}

const ALL_ACTIONS: ActionItem[] = [
  { id: 'read', icon: BookOpen, label: 'Bible Reader', path: '/read', color: 'bg-amber-500' },
  { id: 'ai', icon: BrainCircuit, label: 'Elects AI', path: '/ai', color: 'bg-cyan-500' },
  { id: 'notebook', icon: PenTool, label: 'Notebook', path: '/notebook', color: 'bg-rose-500' },
  { id: 'groups', icon: Users, label: 'Study Groups', path: '/study-groups', color: 'bg-emerald-500' },
  { id: 'sermons', icon: Mic, label: 'Sermon Archive', path: '/sermons', color: 'bg-purple-500' },
  { id: 'ebooks', icon: BookOpenText, label: 'Ebooks', path: '/ebooks', color: 'bg-blue-500' },
  { id: 'prayers', icon: HandHelping, label: 'Prayers', path: '/prayers', color: 'bg-indigo-500' },
  { id: 'articles', icon: FileText, label: 'Articles', path: '/articles', color: 'bg-slate-500' },
  { id: 'forum', icon: MessageSquare, label: 'Community Forum', path: '/forum', color: 'bg-teal-500' },
  { id: 'devotionals', icon: Sun, label: 'Devotionals', path: '/devotionals', color: 'bg-orange-500' },
  { id: 'jpw', icon: Star, label: 'JPW', path: '/jpw', color: 'bg-yellow-500' },
];

const DEFAULT_FAVORITES = ['read', 'ai', 'notebook', 'groups'];

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('empire_favorites');
    return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('empire_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const handleVisibility = (e: any) => {
      if (e.detail !== undefined) setIsVisible(e.detail);
    };
    window.addEventListener('fam-visibility' as any, handleVisibility);
    return () => window.removeEventListener('fam-visibility' as any, handleVisibility);
  }, []);

  const activeActions = ALL_ACTIONS.filter(a => favorites.includes(a.id));

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(f => f !== id);
      }
      if (prev.length >= 6) return prev; // Limit to 6
      return [...prev, id];
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[100] flex flex-col items-end">
      {/* Selection Modal (when managing) */}
      <AnimatePresence>
        {isManaging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-full right-0 mb-6 w-72 max-h-[450px] overflow-hidden bg-black/95 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl flex flex-col p-6 z-[110]"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-white font-serif font-bold text-lg">My Favorites</h3>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{favorites.length}/6</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {ALL_ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => toggleFavorite(action.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${favorites.includes(action.id) ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent'} border`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center text-white`}>
                      <action.icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-white/80">{action.label}</span>
                  </div>
                  {favorites.includes(action.id) && <Check size={16} className="text-[var(--color-primary)]" />}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => {
                setIsManaging(false);
                setIsOpen(false);
              }}
              className="mt-4 w-full py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
            >
              Done Saving
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Actions List */}
      <AnimatePresence>
        {isOpen && !isManaging && (
          <div className="absolute bottom-full right-0 mb-4 flex flex-col gap-3">
             {/* Manage Favorites Button (The + icon requested) */}
             <motion.button
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                onClick={() => setIsManaging(true)}
                className="flex items-center gap-3 group"
              >
                <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Add to Favorites
                </span>
                <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all">
                  <Plus size={18} strokeWidth={3} />
                </div>
              </motion.button>

            {activeActions.map((action, idx) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  navigate(action.path);
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 group"
              >
                <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {action.label}
                </span>
                <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/20 hover:scale-110 active:scale-95 transition-all`}>
                  <action.icon size={18} />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <button
        onClick={() => {
          if (isManaging) setIsManaging(false);
          else setIsOpen(!isOpen);
        }}
        className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden group/main ${isOpen || isManaging ? 'bg-white text-black rotate-[225deg]' : 'bg-black text-white shadow-neon border border-white/20'}`}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/main:opacity-100 transition-opacity" />
        
        {isOpen || isManaging ? <X size={22} strokeWidth={2.5} /> : <Plus size={22} strokeWidth={2.5} />}
        
        {/* Subtle border */}
        <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
      </button>
    </div>
  );
}
