import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, BookOpen, BrainCircuit, PenTool, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: BookOpen, label: 'Read', path: '/read', color: 'bg-amber-500' },
    { icon: BrainCircuit, label: 'Elects AI', path: '/ai', color: 'bg-cyan-500' },
    { icon: PenTool, label: 'Notebook', path: '/notebook', color: 'bg-rose-500' },
    { icon: Users, label: 'Groups', path: '/study-groups', color: 'bg-emerald-500' },
  ];

  return (
    <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-4 flex flex-col gap-3">
            {actions.map((action, idx) => (
              <motion.button
                key={action.label}
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
                <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={`w-12 h-12 ${action.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/20 hover:scale-110 active:scale-95 transition-all`}>
                  <action.icon size={20} />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500 ${isOpen ? 'bg-black rotate-45' : 'bg-[var(--color-primary)] shadow-neon'}`}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
