import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LinkifiedText } from '../components/LinkifiedText';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Calendar, User, ChevronRight, BookOpen } from 'lucide-react';
import Markdown from 'react-markdown';
import BookmarkButton from '../components/BookmarkButton';
import CollectionCarousel from '../components/CollectionCarousel';
import LoveButton from '../components/LoveButton';

interface Article {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  related_verses?: {book: string, chapter: number, verse: number}[];
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const fetchArticles = async (collectionId?: string | null) => {
    setLoading(true);
    let data;
    if (collectionId) {
      const { data: itemIds } = await supabase
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', collectionId)
        .order('sort_order', { ascending: true });
      
      if (itemIds && itemIds.length > 0) {
        const { data: articleData } = await supabase
          .from('articles')
          .select('*')
          .in('id', itemIds.map(i => i.item_id));
        data = articleData;
      }
    } else {
      const { data: articleData } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      data = articleData;
    }
    
    if (data) {
      setArticles(data as Article[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles(selectedCollectionId);
  }, [selectedCollectionId]);

  useEffect(() => {
    const channel = supabase
      .channel('public:articles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () => {
        fetchArticles(selectedCollectionId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCollectionId]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32 animate-fade-in min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-[var(--color-text)] tracking-tight">Articles</h1>
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] flex items-center justify-center">
          <FileText className="text-[var(--color-primary)]" />
        </div>
      </div>

      {!selectedArticle && (
        <CollectionCarousel 
          contentType="article" 
          onCollectionSelect={(col) => setSelectedCollectionId(col ? col.id : null)} 
          selectedCollectionId={selectedCollectionId}
        />
      )}

      <AnimatePresence mode="wait">
        {selectedArticle ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setSelectedArticle(null)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              <ChevronRight className="rotate-180" size={16} /> Back to Articles
            </button>

            <div className="glass-panel rounded-[40px] p-8 md:p-12 border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/50 shadow-2xl">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-[var(--color-text)] mb-6 leading-tight">
                {selectedArticle.title}
              </h2>
              
              <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-6 border-b border-[var(--color-border-subtle)]">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2 text-[var(--color-text-muted)]/50 text-xs">
                    <Calendar size={14} />
                    {new Date(selectedArticle.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-text-muted)]/50 text-xs">
                    <User size={14} />
                    Community Contributor
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <BookmarkButton itemId={selectedArticle.id} itemType="article" itemTitle={selectedArticle.title} />
                  <LoveButton itemId={selectedArticle.id} itemType="article" />
                </div>
              </div>

              {selectedArticle.related_verses && selectedArticle.related_verses.length > 0 && (
                <div className="mb-10 p-6 rounded-3xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)] font-bold mb-4 block">Referenced Passages</span>
                  <div className="flex flex-wrap gap-3">
                    {selectedArticle.related_verses.map((rv, i) => (
                      <LinkifiedText key={i} text={`${rv.book} ${rv.chapter}:${rv.verse}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Related Articles Section */}
              {(() => {
                const related = articles.filter(a => 
                  a.id !== selectedArticle.id &&
                  a.related_verses?.some(rv => 
                    selectedArticle.related_verses?.some(srv => 
                      srv.book === rv.book && srv.chapter === rv.chapter && srv.verse === rv.verse
                    )
                  )
                );

                if (related.length === 0) return null;

                return (
                  <div className="mb-10 p-6 rounded-3xl bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)]">
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]/50 font-bold mb-4 block">Related Articles</span>
                    <div className="flex flex-col gap-3">
                      {related.map(art => (
                        <button 
                          key={art.id}
                          onClick={() => setSelectedArticle(art)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-text)]/5 transition-all text-left"
                        >
                          <FileText size={16} className="text-[var(--color-primary)] flex-shrink-0" />
                          <span className="text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors line-clamp-1">{art.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="markdown-body prose dark:prose-invert prose-p:leading-relaxed prose-p:text-[var(--color-text)]/80 prose-headings:font-serif">
                <Markdown
                  components={{
                    p: ({children}) => <p className="mb-6"><LinkifiedText text={String(children)} /></p>,
                    li: ({children}) => <li className="mb-2"><LinkifiedText text={String(children)} /></li>
                  }}
                >
                  {selectedArticle.content}
                </Markdown>
              </div>

              {(() => {
                const currentIndex = articles.findIndex(a => a.id === selectedArticle.id);
                const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
                const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;
                
                if (!prevArticle && !nextArticle) return null;
                
                return (
                  <div className="flex gap-4 pt-8 border-t border-[var(--color-border-subtle)] mt-8">
                    {prevArticle && (
                      <button 
                        onClick={() => setSelectedArticle(prevArticle)} 
                        className="flex-1 p-4 rounded-xl glass-panel border border-[var(--color-border-subtle)] hover:border-[var(--color-border-subtle)]/50 transition-all flex items-center justify-between"
                      >
                        <div className="flex flex-col items-start gap-1 overflow-hidden">
                          <span className="text-[10px] text-[var(--color-text-muted)]/50 uppercase tracking-widest font-bold">Previous</span>
                          <span className="text-[var(--color-text)] font-medium truncate w-full">{prevArticle.title}</span>
                        </div>
                        <ChevronRight size={16} className="rotate-180 flex-shrink-0" />
                      </button>
                    )}
                    {nextArticle && (
                      <button 
                        onClick={() => setSelectedArticle(nextArticle)} 
                        className="flex-1 p-4 rounded-xl glass-panel border border-[var(--color-border-subtle)] hover:border-[var(--color-border-subtle)]/50 transition-all flex items-center justify-between"
                      >
                        <div className="flex flex-col items-end gap-1 overflow-hidden">
                          <span className="text-[10px] text-[var(--color-text-muted)]/50 uppercase tracking-widest font-bold">Next</span>
                          <span className="text-[var(--color-text)] font-medium truncate w-full">{nextArticle.title}</span>
                        </div>
                        <ChevronRight size={16} className="flex-shrink-0" />
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {loading ? (
              <div className="col-span-full py-20 text-center opacity-40 animate-pulse font-serif text-2xl italic">
                Gathering articles...
              </div>
            ) : articles.length === 0 ? (
              <div className="col-span-full py-20 text-center glass-panel rounded-3xl border border-dashed border-white/10">
                <p className="text-white/40 font-serif italic text-xl">No articles available yet.</p>
              </div>
            ) : (
              articles.map(article => (
                <div 
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="glass-panel group p-8 rounded-[32px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/5 hover:bg-[var(--color-surface)]/10 hover:border-[var(--color-primary)]/30 hover:shadow-neon-glow transition-all duration-500 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-background)] transition-all">
                        <BookOpen size={14} />
                      </div>
                      <span className="text-[9px] uppercase tracking-[0.2em] font-black text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]/60 transition-colors">Study Series</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-[var(--color-text)] mb-4 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                      <BookmarkButton itemId={article.id} itemType="article" itemTitle={article.title} />
                      <LoveButton itemId={article.id} itemType="article" />
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[var(--color-primary)] group-hover:translate-x-1 transition-all">
                      <ChevronRight size={14} className="group-hover:text-[var(--color-primary)]" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
