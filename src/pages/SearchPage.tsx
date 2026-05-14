import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Book, FileText, Sun, Feather, MessageSquare, ChevronRight, BookOpen, Mic, Music, Users, Download, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { bibleSearchService } from '../services/searchService';
import { offlineBibleService } from '../services/offlineBibleService';
import { BIBLE_TRANSLATIONS } from '../constants';
import { nativeService } from '../services/nativeService';

interface SearchResult {
  id: string;
  title: string;
  type: 'Article' | 'Devotional' | 'Prophetic Word' | 'Forum' | 'Ebook' | 'Study Group' | 'Sermon' | 'Music';
  path: string;
  content: string;
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'archives' | 'scripture'>('archives');
  const [downloadedTranslations, setDownloadedTranslations] = useState<string[]>([]);
  const [bibleResults, setBibleResults] = useState<any[]>([]);
  const [isSearchingBible, setIsSearchingBible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDownloaded = async () => {
      const downloaded = await offlineBibleService.getAllDownloaded();
      setDownloadedTranslations(downloaded.map(d => d.id));
    };
    fetchDownloaded();
  }, []);

  const performBibleSearch = useCallback(async (query: string) => {
    if (!query.trim() || downloadedTranslations.length === 0) return;
    setIsSearchingBible(true);
    
    try {
      // Search the first downloaded translation for simplicity
      const results = await bibleSearchService.search(downloadedTranslations[0], query);
      setBibleResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingBible(false);
    }
  }, [downloadedTranslations]);

  useEffect(() => {
    if (activeTab === 'scripture' && searchTerm.length > 2) {
      const timer = setTimeout(() => performBibleSearch(searchTerm), 300);
      return () => clearTimeout(timer);
    } else {
      setBibleResults([]);
    }
  }, [searchTerm, activeTab, performBibleSearch]);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'archives') {
      const fetchArchives = async () => {
        const collections = [
          { table: 'articles', type: 'Article', path: '/articles' },
          { table: 'devotionals', type: 'Devotional', path: '/devotionals' },
          { table: 'prophetic_words', type: 'Prophetic Word', path: '/jpw' },
          { table: 'threads', type: 'Forum', path: '/threads' },
          { table: 'ebooks', type: 'Ebook', path: '/ebooks' },
          { table: 'sermons', type: 'Sermon', path: '/sermons' },
          { table: 'music', type: 'Music', path: '/music' },
        ];

        const results = await Promise.all(collections.map(async (col) => {
          const { data } = await supabase.from(col.table).select('*').limit(50);
          if (!data) return [];
          return data.map(item => ({
            id: item.id,
            title: item.title || item.name || item.displayName || 'Untitled',
            type: col.type as any,
            path: col.table === 'threads' ? `/threads/${item.id}` : 
                  col.table === 'ebooks' ? `/ebooks/${item.id}` : 
                  col.table === 'study_groups' ? `/study-groups/${item.id}` : 
                  col.path,
            content: item.content || item.description || item.bio || ''
          }));
        }));

        setAllData(results.flat());
        setLoading(false);
      };

      fetchArchives();
    } else {
      setLoading(false);
    }
  }, [activeTab]);

  const filteredResults = searchTerm.trim() === '' 
    ? [] 
    : activeTab === 'archives'
      ? allData.filter(item => 
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.content.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 20)
      : bibleResults;

  const handleBibleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      nativeService.impact();
      navigate(`/read?query=${encodeURIComponent(searchTerm)}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Article': return <FileText size={16} />;
      case 'Devotional': return <Sun size={16} />;
      case 'Prophetic Word': return <Feather size={16} />;
      case 'Forum': return <MessageSquare size={16} />;
      case 'Ebook': return <BookOpen size={16} />;
      case 'Study Group': return <Users size={16} />;
      case 'Sermon': return <Mic size={16} />;
      case 'Music': return <Music size={16} />;
      default: return <Book size={16} />;
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <mark key={i} className="bg-[var(--color-primary)]/30 text-white rounded px-0.5">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 mb-20">
      <div className="flex items-center gap-3 mb-8">
        <Search className="text-[var(--color-primary)] drop-shadow-neon" size={32} />
        <h1 className="text-4xl font-serif font-bold text-[var(--color-text)] tracking-tight">Search Portal</h1>
      </div>

      <div className="flex bg-[var(--color-surface)]/50 border border-[var(--color-border-subtle)] p-1 rounded-2xl mb-8 backdrop-blur-xl">
        {(['archives', 'scripture'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearchTerm('');
            }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-[var(--color-primary)] text-[var(--color-background)] shadow-neon' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/5'}`}
          >
            {tab === 'archives' ? 'Library & Community' : 'Bible Scripture'}
          </button>
        ))}
      </div>

      <div className="relative mb-12 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)]/20 to-blue-500/20 rounded-full blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
        <div className="relative">
          <form onSubmit={handleBibleSearch}>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]/50 group-focus-within:text-[var(--color-primary)] transition-colors" size={24} />
            <input 
              type="text" 
              autoFocus
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'archives' ? "Search scripture, insights, or discussions..." : "Search Bible for verses or topics..."}
              className="w-full bg-[var(--color-surface)]/50 border border-[var(--color-border-subtle)] rounded-full py-5 pl-14 pr-6 text-xl text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/40 focus:outline-none focus:border-[var(--color-primary)]/50 backdrop-blur-xl transition-all"
            />
            {activeTab === 'scripture' && (
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-[var(--color-primary)] text-[var(--color-background)] px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-neon"
              >
                Go
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'scripture' && downloadedTranslations.length === 0 && (
          <div className="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-4 mb-2">
            <Info className="flex-shrink-0 mt-1" size={20} />
            <div className="space-y-2">
              <p className="text-sm font-bold uppercase tracking-wider">Fast Offline Search Disabled</p>
              <p className="text-sm opacity-80 leading-relaxed">Download a Bible translation in the Reader to enable ultra-fast imperial searching that works without an internet connection.</p>
              <button 
                onClick={() => navigate('/read')}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                <Download size={14} /> Go to Reader
              </button>
            </div>
          </div>
        )}

        {loading || isSearchingBible ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
            <p className="text-sm font-bold uppercase tracking-widest">
              {isSearchingBible ? 'Searching Scripture Index...' : 'Searching Archives...'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredResults.length > 0 ? (
              filteredResults.map((result, i) => (
                <motion.div
                  key={result.id || `${result.book}_${result.chapter}_${result.verse}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link 
                    to={activeTab === 'scripture' ? `/read?book=${result.book}&chapter=${result.chapter}&verse=${result.verse}` : result.path} 
                    className="flex items-center justify-between p-6 glass-card border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/30 rounded-3xl group transition-all"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-[var(--color-primary)]/80 bg-[var(--color-primary)]/5 px-2 py-0.5 rounded-md border border-[var(--color-primary)]/10">
                          {activeTab === 'scripture' ? <Book size={16} /> : getTypeIcon(result.type)} 
                          {activeTab === 'scripture' ? 'Scripture' : result.type}
                        </span>
                      </div>
                      <h3 className="text-xl font-serif font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                        {activeTab === 'scripture' 
                          ? `${result.book} ${result.chapter}:${result.verse}` 
                          : highlightText(result.title, searchTerm)}
                      </h3>
                      {activeTab === 'archives' && (
                        <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
                          {highlightText(result.content.replace(/<[^>]*>?/gm, ''), searchTerm)}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 p-2 rounded-full bg-[var(--color-text)]/5 text-[var(--color-text-muted)]/50 group-hover:bg-[var(--color-primary)]/20 group-hover:text-[var(--color-primary)] transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : searchTerm.trim() !== '' ? (
              <div className="text-center py-20 space-y-4">
                <div className="inline-block p-4 bg-white/5 rounded-full text-white/20">
                  <Search size={48} />
                </div>
                <div>
                  <p className="text-xl text-white font-serif">No matches found</p>
                  <p className="text-sm text-white/40 mt-1">
                    {activeTab === 'archives' 
                      ? 'Try searching for keywords like "Grace", "Covenant", or "Jesus".' 
                      : 'Try searching for a reference like "John 3:16" or a topic like "Love".'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 opacity-30 mt-10">
                {(activeTab === 'archives' ? ['Mercy', 'Covenant', 'Wisdom', 'Prayer', 'Healing', 'Kingdom'] : ['John 3:16', 'Genesis 1:1', 'Romans 8', 'Psalm 91', 'Isaiah 53', 'Faith']).map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setSearchTerm(tag)}
                    className="p-3 border border-[var(--color-border-subtle)] rounded-xl text-xs hover:bg-[var(--color-text)]/5 text-[var(--color-text)] transition-all"
                  >
                    {tag.includes(' ') ? tag : `#${tag}`}
                  </button>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
