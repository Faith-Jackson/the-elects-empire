import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, Share2, RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react';

const SPIRITUAL_IMAGES = [
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80", // Forest light
  "https://images.unsplash.com/photo-1444464666168-49d633b867ad?auto=format&fit=crop&w=1200&q=80", // Dawn
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80", // Mountains
  "https://images.unsplash.com/photo-1493246507139-91e8bef99c02?auto=format&fit=crop&w=1200&q=80", // Sunset sea
  "https://images.unsplash.com/photo-1518173946687-a4c8a9b749f5?auto=format&fit=crop&w=1200&q=80", // Space/Galaxy
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80" // Beach
];

export default function ScriptureArtGenerator({ verse, reference }: { verse: string, reference: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateArt = () => {
    setIsGenerating(true);
    // Simulate AI generation time
    setTimeout(() => {
      const randomImg = SPIRITUAL_IMAGES[Math.floor(Math.random() * SPIRITUAL_IMAGES.length)];
      setGeneratedImage(randomImg);
      setIsGenerating(false);
    }, 2500);
  };

  return (
    <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)]">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-white">Scripture Art</h3>
            <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">AI Creative Vision</p>
          </div>
        </div>
        {generatedImage && (
          <button 
            onClick={generateArt}
            className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
            title="Regenerate Art"
          >
            <RefreshCw size={16} className={isGenerating ? "animate-spin" : ""} />
          </button>
        )}
      </div>

      {!generatedImage ? (
        <div className="text-center py-12 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-white/20">
            <ImageIcon size={32} />
          </div>
          <div className="max-w-[200px] mx-auto">
            <p className="text-xs text-white/50 mb-4 italic">"{verse.substring(0, 60)}..."</p>
            <button 
              onClick={generateArt}
              disabled={isGenerating}
              className="w-full py-3 bg-[var(--color-primary)] text-[var(--color-background)] rounded-full font-bold shadow-neon-glow hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
              {isGenerating ? "Infusing Light..." : "Generate Scripture Art"}
            </button>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div 
            key={generatedImage}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl"
          >
            <img 
              src={generatedImage} 
              alt="Scripture Art" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-8 text-center">
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="p-2 bg-black/40 backdrop-blur-md rounded-lg text-white/80 hover:text-white transition-all">
                  <Download size={16} />
                </button>
                <button className="p-2 bg-black/40 backdrop-blur-md rounded-lg text-white/80 hover:text-white transition-all">
                  <Share2 size={16} />
                </button>
              </div>
              <p className="text-sm md:text-base font-serif italic text-white mb-3 drop-shadow-lg line-clamp-4">
                "{verse}"
              </p>
              <div className="h-0.5 w-8 bg-[var(--color-primary)] rounded-full mb-2 shadow-neon"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] drop-shadow-lg">
                {reference}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
