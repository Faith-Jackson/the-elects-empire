import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Book, FileText, Sun, Feather, MessageSquare, ChevronRight, BookOpen, X, Command, Mic, Users, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface SearchResult {
  id: string;
  title: string;
  type: 'Article' | 'Devotional' | 'JPW' | 'Forum' | 'Ebook' | 'Study Group' | 'Disciple' | 'Sermon' | 'Scripture' | 'Music';
  path: string;
  content: string;
}

interface CommandSearchProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CommandSearch({ isOpen, setIsOpen }: CommandSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'archives' | 'scripture'>('archives');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchAllData = async () => {
    setLoading(true);
    const collections = [
      { name: 'articles', type: 'Article', path: '/articles' },
      { name: 'devotionals', type: 'Devotional', path: '/devotionals' },
      { name: 'prophetic_words', type: 'JPW', path: '/jpw' },
      { name: 'threads', type: 'Forum', path: '/threads' },
      { name: 'ebooks', type: 'Ebook', path: '/ebooks' },
      { name: 'study_groups', type: 'Study Group', path: '/study-groups' },
      { name: 'profiles', type: 'Disciple', path: '/profile' },
      { name: 'sermons', type: 'Sermon', path: '/sermons' },
      { name: 'music', type: 'Music', path: '/music' },
    ];

    const results = await Promise.all(collections.map(async (col) => {
      const { data } = await supabase.from(col.name).select('*').limit(50);
      if (!data) return [];
      return data.map((item: any) => ({
        id: item.id,
        title: item.title || item.name || item.displayName || 'Untitled',
        type: col.type as any,
        path: col.name === 'threads' ? `/threads/${item.id}` : 
              col.name === 'ebooks' ? `/ebooks/${item.id}` : 
              col.name === 'study_groups' ? `/study-groups/${item.id}` : 
              col.name === 'profiles' ? `/profile` : col.path,
        content: item.content || item.description || item.bio || ''
      }));
    }));

    setAllData(results.flat());
    setLoading(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      if (activeTab === 'archives') {
        fetchAllData();

        const channels = [
          'articles', 'devotionals', 'prophetic_words', 'threads', 'ebooks', 'study_groups', 'profiles', 'sermons', 'music'
        ].map(table => {
          return supabase
            .channel(`public:${table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchAllData())
            .subscribe();
        });

        return () => {
          channels.forEach(channel => supabase.removeChannel(channel));
        };
      }
    } else {
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen, activeTab]);

  const filteredResults = searchTerm.trim() === '' 
    ? [] 
    : activeTab === 'archives' 
      ? allData.filter(item => 
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.content.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 8)
      : []; // TODO: Implement Scripture Search logic here or redirect to read page with query

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      if (activeTab === 'scripture' && searchTerm.trim()) {
        navigate(`/read?query=${encodeURIComponent(searchTerm)}`);
        setIsOpen(false);
      } else if (filteredResults[selectedIndex]) {
        navigate(filteredResults[selectedIndex].path);
        setIsOpen(false);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Article': return <FileText size={14} />;
      case 'Devotional': return <Sun size={14} />;
      case 'JPW': return <Feather size={14} />;
      case 'Forum': return <MessageSquare size={14} />;
      case 'Ebook': return <BookOpen size={14} />;
      case 'Study Group': return <Users size={14} />;
      case 'Sermon': return <Mic size={14} />;
      case 'Music': return <Music size={14} />;
      default: return <Book size={14} />;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl glass-panel border border-white/10 shadow-2xl rounded-2xl overflow-hidden"
            >
              {/* Tabs */}
              <div className="flex bg-black/40 border-b border-white/10 p-1">
                {(['archives', 'scripture'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setSearchTerm('');
                      setSelectedIndex(0);
                    }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab ? 'bg-[var(--color-primary)] text-[var(--color-background)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {tab === 'archives' ? 'Library & Community' : 'Scripture Search'}
                  </button>
                ))}
              </div>

              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <Search className="text-[var(--color-primary)]" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={activeTab === 'archives' ? "Search articles, people, groups..." : "Enter book, chapter, or keywords (e.g. Genesis 1:1)"}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/20 text-lg"
                />
                <div className="flex items-center gap-1.5">
                  <kbd className="hidden sm:block px-1.5 py-0.5 rounded border border-white/10 text-[10px] text-white/40 bg-white/5">ESC</kbd>
                  <button onClick={() => setIsOpen(false)} className="p-1 text-white/30 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                {searchTerm.trim() === '' ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="text-[var(--color-primary)]/40 flex justify-center">
                      {activeTab === 'archives' ? <Command size={40} /> : <Book size={40} />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-medium italic font-serif">
                        {activeTab === 'archives' ? '"Seek and ye shall find..."' : '"The Word is a lamp unto my feet..."'}
                      </p>
                      <p className="text-xs text-white/30">
                        {activeTab === 'archives' 
                          ? "Search for articles, threads, scripture, or study groups." 
                          : "Find specific verses or search by biblical topics."}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 pt-4">
                      {(activeTab === 'archives' ? ['Grace', 'Covenant', 'Prophecy', 'Prayer'] : ['John 3:16', 'Psalm 23', 'Love', 'Faith']).map(tag => (
                        <button 
                          key={tag}
                          onClick={() => setSearchTerm(tag)}
                          className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/40 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all font-bold"
                        >
                          {tag.includes(' ') ? tag : `#${tag}`}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : activeTab === 'scripture' ? (
                  <div className="p-8 text-center space-y-6">
                    <div className="p-6 bg-[var(--color-primary)]/10 rounded-3xl border border-[var(--color-primary)]/20">
                      <BookOpen className="text-[var(--color-primary)] mx-auto mb-4" size={32} />
                      <h4 className="text-white font-serif text-lg mb-2">Search the living Word</h4>
                      <p className="text-xs text-white/50 mb-6">Press ENTER to search for "{searchTerm}" in the Bible Reader</p>
                      <button 
                         onClick={() => {
                           navigate(`/read?query=${encodeURIComponent(searchTerm)}`);
                           setIsOpen(false);
                         }}
                         className="w-full py-3 bg-[var(--color-primary)] text-[var(--color-background)] rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-neon transition-all"
                      >
                        Search Scripture
                      </button>
                    </div>
                  </div>
                ) : filteredResults.length > 0 ? (
                  <div className="space-y-1">
                    {filteredResults.map((result, i) => (
                      <Link
                        key={result.id + result.type}
                        to={result.path}
                        onClick={() => setIsOpen(false)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${selectedIndex === i ? 'bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30' : 'border border-transparent hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`p-2 rounded-lg ${selectedIndex === i ? 'bg-[var(--color-primary)] text-[var(--color-background)]' : 'bg-white/5 text-white/30'}`}>
                            {getTypeIcon(result.type)}
                          </div>
                          <div className="min-w-0">
                            <h4 className={`text-sm font-bold truncate ${selectedIndex === i ? 'text-white' : 'text-white/80'}`}>{result.title}</h4>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black flex items-center gap-1.5 mt-0.5">
                              {result.type}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={14} className={selectedIndex === i ? 'text-[var(--color-primary)]' : 'text-white/10'} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-white/20">
                    <Search size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No results for "{searchTerm}"</p>
                  </div>
                )}
              </div>

              {activeTab === 'archives' && filteredResults.length > 0 && (
                <div className="p-3 border-t border-white/5 bg-black/20 flex items-center justify-between text-[10px] text-white/30">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><kbd className="px-1 border border-white/10 rounded bg-white/5">↑↓</kbd> to navigate</span>
                    <span className="flex items-center gap-1"><kbd className="px-1 border border-white/10 rounded bg-white/5">ENTER</kbd> to open</span>
                  </div>
                  <span>{filteredResults.length} matches</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
