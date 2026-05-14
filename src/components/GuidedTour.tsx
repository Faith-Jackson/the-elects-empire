import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, Map, BrainCircuit, BookOpen, GraduationCap, Mic, Settings } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  icon: any;
  position: 'bottom' | 'top' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'hero',
    title: 'Welcome to Elects',
    content: 'Welcome to the Elects Community. Everything here is designed to help you strengthen your connection with Jesus Christ.',
    icon: Sparkles,
    position: 'bottom'
  },
  {
    target: '#sidebar-read',
    title: 'Immutable Truth',
    content: 'Feast upon the Word daily. Our reader is enhanced with King James original oracles and deep cross-references.',
    icon: BookOpen,
    position: 'right'
  },
  {
    target: '#sidebar-ai',
    title: 'Divine Consultation',
    content: 'Consult Scribe for spiritual coaching, exegetical deep-dives, or prophetic encouragement.',
    icon: BrainCircuit,
    position: 'right'
  },
  {
    target: '#sidebar-roadmap',
    title: 'Your Spiritual Path',
    content: 'Follow the Biblical Roadmap to track your journey through the Bible\'s major milestones.',
    icon: Map,
    position: 'right'
  },
  {
    target: '#sidebar-study-guides',
    title: 'Bible Study Library',
    content: 'Explore curated Study Guides that breakdown complex theological topics into practical truth.',
    icon: GraduationCap,
    position: 'right'
  },
  {
    target: '#sidebar-sermons',
    title: 'Audio Messages',
    content: 'Listen to the collection of messages delivered to the community.',
    icon: Mic,
    position: 'right'
  },
  {
    target: '#sidebar-profile',
    title: 'Display Settings',
    content: 'Adjust your theme, brightness, and background to suit your focus.',
    icon: Settings,
    position: 'right'
  }
];

export default function GuidedTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenCommunityTour');
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('hasSeenCommunityTour', 'true');
    setIsOpen(false);
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Background Dim */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
        onClick={handleComplete}
      />

      {/* Tour Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm glass-panel p-8 rounded-[2.5rem] border border-[var(--color-primary)]/30 shadow-neon-glow pointer-events-auto"
        >
          <button 
            onClick={handleComplete}
            className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] shadow-neon">
              <step.icon size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-serif font-black text-white">{step.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed italic font-medium">
                {step.content}
              </p>
            </div>

            <div className="w-full flex items-center justify-between pt-4">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-6 bg-[var(--color-primary)]' : 'w-2 bg-white/10'}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button 
                    onClick={prevStep}
                    className="p-3 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 transition-all border border-white/10"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <button 
                  onClick={nextStep}
                  className="px-6 py-3 bg-[var(--color-primary)] text-black rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-neon"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Enter' : 'Next Step'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
