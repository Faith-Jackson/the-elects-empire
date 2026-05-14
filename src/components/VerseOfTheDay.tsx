import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Quote, Sparkles, Share2, Copy } from 'lucide-react';

const CURATED_VERSES = [
  { text: "For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future.", ref: "Jeremiah 29:11" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", ref: "Joshua 1:9" },
  { text: "The Lord is my shepherd, I shall not want.", ref: "Psalm 23:1" },
  { text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", ref: "Isaiah 40:31" },
  { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", ref: "Romans 8:28" },
  { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
  { text: "I can do all this through him who gives me strength.", ref: "Philippians 4:13" }
];

export default function VerseOfTheDay() {
  const [verse, setVerse] = useState(CURATED_VERSES[0]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Select verse based on day of the year
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    setVerse(CURATED_VERSES[dayOfYear % CURATED_VERSES.length]);
  }, []);

  const copyVerse = () => {
    navigator.clipboard.writeText(`"${verse.text}" - ${verse.ref}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden glass-panel p-8 rounded-3xl border border-[var(--color-border-subtle)] shadow-neon-glow group"
    >
      {/* Background Decoration */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[var(--color-primary)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-primary)]/10 transition-colors duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg text-[var(--color-primary)]">
            <Sparkles size={18} />
          </div>
          <span className="text-[10px] uppercase font-black tracking-[0.3em] text-[var(--color-text-muted)] opacity-50">Heartbeat • Verse of the Day</span>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <Quote className="absolute -left-4 -top-4 text-[var(--color-primary)]/10" size={48} />
            <p className="text-2xl md:text-3xl font-serif text-[var(--color-text)] leading-relaxed italic relative z-10 pl-4">
              {verse.text}
            </p>
          </div>
          
          <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-6">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-[var(--color-primary)] rounded-full"></div>
              <span className="text-[var(--color-primary)] font-bold tracking-tight">{verse.ref}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={copyVerse}
                className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--color-text)]/5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/10'}`}
                title="Copy Verse"
              >
                {copied ? <Sparkles size={18} className="animate-pulse" /> : <Copy size={18} />}
                {copied && <span className="text-[10px] font-black uppercase tracking-widest">Saved</span>}
              </button>
              <button className="p-2.5 rounded-xl bg-[var(--color-text)]/5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/10 transition-all" title="Share Verse">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
