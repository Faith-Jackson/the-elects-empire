import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Map, Compass, Star, ChevronRight, Lock, CheckCircle2, History, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoadStep {
    id: string;
    label: string;
    book: string;
    chapter: number;
    description: string;
    isCompleted: boolean;
}

const BIBLE_PATH = [
    { label: 'The Beginning', book: 'Genesis', chapter: 1, description: 'Creation of the Heavens and the Earth' },
    { label: 'The Promise', book: 'Genesis', chapter: 12, description: 'The calling of Abraham' },
    { label: 'The Exodus', book: 'Exodus', chapter: 14, description: 'Crossing the Red Sea' },
    { label: 'The Law', book: 'Exodus', chapter: 20, description: 'The Ten Commandments' },
    { label: 'The King', book: '1 Samuel', chapter: 16, description: 'Anointing of David' },
    { label: 'The Wisest', book: '1 Kings', chapter: 3, description: 'Solomon\'s Request for Wisdom' },
    { label: 'The Restoration', book: 'Nehemiah', chapter: 2, description: 'Rebuilding the Walls' },
    { label: 'The Suffering', book: 'Job', chapter: 1, description: 'Trial of Faith' },
    { label: 'The Incarnation', book: 'John', chapter: 1, description: 'The Word became Flesh' },
    { label: 'The Kingdom', book: 'Matthew', chapter: 5, description: 'Sermon on the Mount' },
    { label: 'The Sacrifice', book: 'Mark', chapter: 15, description: 'The Crucifixion' },
    { label: 'The Resurrection', book: 'Luke', chapter: 24, description: 'The Risen Lord' },
    { label: 'The Spirit', book: 'Acts', chapter: 2, description: 'Pentecost' },
    { label: 'The Transformation', book: 'Acts', chapter: 9, description: 'Conversion of Saul' },
    { label: 'The Justification', book: 'Romans', chapter: 3, description: 'Righteousness by Faith' },
    { label: 'The New Heaven', book: 'Revelation', chapter: 21, description: 'All things made New' }
];

export default function BiblicalRoadmap() {
    const { user } = useAuth();
    const [progress, setProgress] = useState<RoadStep[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('reading_progress')
                .select('book, chapter')
                .eq('user_id', user.id);
            
            const completedChapters = new Set((data || []).map(d => `${d.book}_${d.chapter}`));

            const steps = BIBLE_PATH.map((step, index) => ({
                id: `step-${index}`,
                ...step,
                isCompleted: completedChapters.has(`${step.book}_${step.chapter}`)
            }));

            setProgress(steps);
            setLoading(false);
        };
        fetchProgress();
    }, [user]);

    if (loading) return <div className="flex items-center justify-center min-h-screen text-[var(--color-primary)]">Unrolling the Scrolls...</div>;

    const completedCount = progress.filter(p => p.isCompleted).length;
    const percentage = Math.round((completedCount / progress.length) * 100);

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 mb-20">
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[var(--color-primary)]/20 rounded-2xl flex items-center justify-center text-[var(--color-primary)] shadow-neon">
                        <Map size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-white">Biblical Roadmap</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)] font-bold">Thy Journey through the Holy Oracles</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-black text-white italic">{percentage}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Divine Milestone</div>
                </div>
            </div>

            <div className="relative">
                {/* Connector Line */}
                <div className="absolute left-[39px] top-6 bottom-6 w-1 bg-gradient-to-b from-[var(--color-primary)]/20 via-[var(--color-primary)] to-[var(--color-primary)]/20 z-0"></div>

                <div className="space-y-12">
                    {progress.map((step, index) => (
                        <motion.div 
                            key={step.id}
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="relative z-10 flex items-start gap-8 group"
                        >
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 transition-all duration-500 shrink-0 ${step.isCompleted ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-black shadow-neon scale-110' : 'bg-black/40 border-white/10 text-white/20'}`}>
                                {step.isCompleted ? <CheckCircle2 size={32} /> : <Compass size={32} className="group-hover:rotate-45 transition-transform" />}
                            </div>

                            <div className="flex-1 glass-card p-6 rounded-3xl border border-white/10 group-hover:border-[var(--color-primary)]/30 transition-all flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`text-xl font-serif font-bold transition-colors ${step.isCompleted ? 'text-white' : 'text-white/40'}`}>{step.label}</h3>
                                        <span className="text-[10px] uppercase font-black text-[var(--color-primary)]/40">{step.book} {step.chapter}</span>
                                    </div>
                                    <p className="text-sm text-white/40 italic">{step.description}</p>
                                </div>
                                <Link 
                                    to={`/read?book=${step.book}&chapter=${step.chapter}`}
                                    className={`p-3 rounded-full transition-all ${step.isCompleted ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[var(--color-primary)] text-black hover:scale-110 shadow-neon'}`}
                                >
                                    {step.isCompleted ? <History size={20} /> : <ChevronRight size={20} />}
                                </Link>
                            </div>

                            <div className="hidden lg:flex w-32 items-center justify-center">
                                {step.isCompleted ? (
                                    <div className="flex items-center gap-1 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest">
                                        <Star size={12} fill="currentColor" /> Milestone
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-white/10 text-[10px] font-black uppercase tracking-widest">
                                        <Lock size={12} /> Locked
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
            
            <div className="mt-20 glass-panel p-10 rounded-[3rem] border border-[var(--color-primary)]/20 text-center space-y-4">
                <Sparkles size={48} className="mx-auto text-[var(--color-primary)] animate-pulse" />
                <h2 className="text-2xl font-serif font-bold text-white">The Eternal Destination</h2>
                <p className="text-white/60 max-w-lg mx-auto italic">
                    "And I saw a new heaven and a new earth: for the first heaven and the first earth were passed away..."
                </p>
                <div className="pt-4">
                     <span className="text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-2 rounded-full text-white/40">Keep reading to unlock your spiritual legacy</span>
                </div>
            </div>
        </div>
    );
}
