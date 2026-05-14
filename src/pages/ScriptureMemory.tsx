import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, RefreshCw, CheckCircle, XCircle, Trophy, BookOpen, ChevronRight, HelpCircle } from 'lucide-react';
import { askElectsAI } from '../services/groqService';
import ReactMarkdown from 'react-markdown';

interface MemoryVerse {
    id: string;
    book: string;
    chapter: number;
    verse: number;
    verse_text: string;
}

export default function ScriptureMemory() {
    const { user } = useAuth();
    const [verses, setVerses] = useState<MemoryVerse[]>([]);
    const [currentVerse, setCurrentVerse] = useState<MemoryVerse | null>(null);
    const [exercise, setExercise] = useState<{ type: 'cloze' | 'first-letter' | 'scramble', content: string, answer: string } | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const fetchVerses = async () => {
            if (!user) return;
            // Get highlights to use as memory verses
            const { data } = await supabase
                .from('highlights')
                .select('*')
                .eq('user_id', user.id)
                .limit(10);
            
            const v = (data || []) as MemoryVerse[];
            
            // Fallback if no highlights
            if (v.length === 0) {
                v.push({
                    id: 'default',
                    book: 'Philippians',
                    chapter: 4,
                    verse: 13,
                    verse_text: 'I can do all things through Christ which strengtheneth me.'
                });
            }
            
            setVerses(v);
            setCurrentVerse(v[0]);
            setLoading(false);
        };
        fetchVerses();
    }, [user]);

    const generateExercise = async (verse: MemoryVerse) => {
        setGenerating(true);
        setFeedback(null);
        setUserAnswer('');
        
        const prompt = `Create a scripture memory exercise for the following verse: "${verse.verse_text}". 
        Return ONLY a JSON object with this structure:
        {
          "type": "cloze", // or "first-letter" or "scramble"
          "content": "the exercise text with underscores for holes",
          "answer": "the missing words or full verse"
        }`;
        
        try {
            const response = await askElectsAI(prompt);
            // Parse JSON from markdown if necessary
            const jsonStr = response.replace(/```json|```/g, '').trim();
            const data = JSON.parse(jsonStr);
            setExercise(data);
        } catch (err) {
            console.error("Failed to generate exercise", err);
            // Local fallback
            setExercise({
                type: 'cloze',
                content: verse.verse_text.replace(/\b(\w{5,})\b/g, '_____'),
                answer: verse.verse_text
            });
        } finally {
            setGenerating(false);
        }
    };

    const checkAnswer = () => {
        if (!exercise) return;
        const isCorrect = userAnswer.toLowerCase().trim() === exercise.answer.toLowerCase().trim();
        setFeedback(isCorrect ? 'correct' : 'incorrect');
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-[var(--color-primary)]">Summoning the Word...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 mb-20">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-2xl flex items-center justify-center text-[var(--color-primary)] shadow-neon">
                    <Brain size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white">Memory Master</h1>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)] font-bold">Hide the Word in thy Heart</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Saved Verses</h2>
                    {verses.map(v => (
                        <button 
                            key={v.id}
                            onClick={() => {
                                setCurrentVerse(v);
                                setExercise(null);
                            }}
                            className={`w-full p-4 rounded-xl border text-left transition-all ${currentVerse?.id === v.id ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-white' : 'glass-card border-white/10 text-white/60 hover:bg-white/5'}`}
                        >
                            <div className="text-xs font-black uppercase tracking-tighter mb-1">{v.book} {v.chapter}:{v.verse}</div>
                            <div className="text-sm italic line-clamp-1">"{v.verse_text}"</div>
                        </button>
                    ))}
                </div>

                <div className="md:col-span-2">
                    <AnimatePresence mode="wait">
                        {currentVerse && (
                            <motion.div 
                                key={currentVerse.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel p-8 rounded-[2.5rem] border border-white/10 h-full flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="text-xl font-serif font-bold text-white">
                                        {currentVerse.book} {currentVerse.chapter}:{currentVerse.verse}
                                    </div>
                                    <button 
                                        onClick={() => generateExercise(currentVerse)}
                                        disabled={generating}
                                        className="p-3 bg-[var(--color-primary)] text-black rounded-xl hover:scale-110 active:scale-95 transition-all shadow-neon disabled:opacity-50"
                                    >
                                        {generating ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                    </button>
                                </div>

                                {!exercise ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="text-2xl font-serif italic text-white/90 leading-relaxed">
                                            "{currentVerse.verse_text}"
                                        </div>
                                        <p className="text-sm text-white/40 max-w-xs">
                                            Read this verse several times, then click the magic button to start a memory exercise.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-1 space-y-8">
                                        <div className="p-6 bg-black/40 rounded-3xl border border-white/5 text-xl font-serif text-white leading-relaxed text-center italic">
                                            <ReactMarkdown>{exercise.content}</ReactMarkdown>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)] font-bold">Your Transcription</label>
                                            <textarea 
                                                value={userAnswer}
                                                onChange={(e) => setUserAnswer(e.target.value)}
                                                placeholder="Type the verse from memory..."
                                                className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--color-primary)] transition-all h-32"
                                            />
                                            
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    onClick={checkAnswer}
                                                    className="flex-1 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-[var(--color-primary)] transition-all"
                                                >
                                                    Verify Completion
                                                </button>
                                                <button 
                                                    onClick={() => setExercise(null)}
                                                    className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white/10 transition-all"
                                                >
                                                    <HelpCircle size={20} />
                                                </button>
                                            </div>

                                            {feedback === 'correct' && (
                                                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400">
                                                    <CheckCircle size={20} />
                                                    <span className="text-sm font-bold">Thy heart is true! Well done.</span>
                                                </motion.div>
                                            )}
                                            {feedback === 'incorrect' && (
                                                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400">
                                                    <XCircle size={20} />
                                                    <span className="text-sm font-bold">Not quite, Disciple. Try again.</span>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
