import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, BookOpen, Loader2 } from 'lucide-react';
import { fetchChapter, BibleVerse } from '../services/bibleService';
import { BIBLE_BOOKS } from '../constants';

interface VersePopupContextType {
  openVerse: (book: string, chapter: number, verse?: number) => void;
  closeVerse: () => void;
}

const VersePopupContext = createContext<VersePopupContextType | undefined>(undefined);

export function VersePopupProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<{ book: string; chapter: number; verse?: number } | null>(null);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);

  const openVerse = async (book: string, chapter: number, verse?: number) => {
    // Normalize book name
    const matchedBook = BIBLE_BOOKS.find(b => 
      b.name.toLowerCase() === book.toLowerCase() || 
      b.name.toLowerCase().startsWith(book.toLowerCase().substring(0, 3))
    );
    
    if (!matchedBook) return;

    setData({ book: matchedBook.name, chapter, verse });
    setIsOpen(true);
    setLoading(true);

    try {
      const result = await fetchChapter(matchedBook.name, chapter);
      setVerses(result.verses);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const closeVerse = () => {
    setIsOpen(false);
    setTimeout(() => {
      setData(null);
      setVerses([]);
    }, 300);
  };

  return (
    <VersePopupContext.Provider value={{ openVerse, closeVerse }}>
      {children}
      <AnimatePresence>
        {isOpen && data && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="p-5 flex items-center justify-between border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)]">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">
                      {data.book} {data.chapter}{data.verse ? `:${data.verse}` : ''}
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest text-white/50">Quick Preview</p>
                  </div>
                </div>
                <button 
                  onClick={closeVerse}
                  className="p-2 rounded-full hover:bg-white/10 text-white/60 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-black/20">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/40">
                    <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
                    <p className="text-xs font-medium">Fetching passage...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.verse ? (
                      // Single Verse Mode
                      <div className="text-lg leading-relaxed text-white font-serif">
                        <span className="text-[var(--color-primary)] font-bold mr-2">{data.verse}</span>
                        {verses.find(v => v.verse === data.verse)?.text || "Verse not found."}
                      </div>
                    ) : (
                      // Full Chapter Preview
                      <div className="space-y-3">
                        {verses.map(v => (
                          <div key={v.verse} className="text-base leading-relaxed text-white/90">
                            <span className="text-[var(--color-primary)]/60 text-[10px] font-bold mr-2 align-super">{v.verse}</span>
                            {v.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
                <a 
                  href={`/read?book=${data.book}&chapter=${data.chapter}${data.verse ? `&verse=${data.verse}` : ''}`}
                  className="flex-1 bg-[var(--color-primary)] text-[var(--color-background)] py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-neon"
                  onClick={(e) => {
                    // If we are already on the reader, we might want to just navigate locally
                    // but for global simplicity, we can let the Link handle it if we wrap it?
                    // Or just use navigate()
                    closeVerse();
                  }}
                >
                  <ExternalLink size={16} /> Open in Reader
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </VersePopupContext.Provider>
  );
}

export function useVersePopup() {
  const context = useContext(VersePopupContext);
  if (context === undefined) {
    throw new Error('useVersePopup must be used within a VersePopupProvider');
  }
  return context;
}
