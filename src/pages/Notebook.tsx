import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Mousetrap from 'mousetrap';
import { 
  Plus, FolderPlus, Search, Tag, MoreVertical, 
  ChevronRight, ChevronDown, Book, StickyNote, 
  Pin, Trash2, Save, Cloud, CloudOff, 
  CloudLightning, Archive, Folder, Hash, Filter,
  ArrowLeft, Sidebar as SidebarIcon, Sparkles,
  Download, FileText, Info, Clock, RotateCcw,
  Eye, ScrollText, PenTool, Type
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { notebookService, NotebookNote, NotebookFolder, FolderNode, buildFolderTree, NoteType } from '../services/notebookService';
import RichTextEditor from '../components/RichTextEditor';
import { useBibleVerseLinks } from '../lib/bibleLinker';
import { generateNoteInsight } from '../services/groqService';
import FlexSearch from 'flexsearch';
import { sanitizeHTML } from '../lib/security';

const TEMPLATES: Record<NoteType, { title: string, content: string }> = {
  general: { title: 'New Reflection', content: '' },
  vision: { 
    title: 'Divine Vision: ', 
    content: `<h2>The Vision</h2><p>Describe exactly what you saw...</p><h2>Internal Witness</h2><p>How did it feel in your spirit?</p><h2>Interpretation</h2><p>What is the Lord saying?</p><h2>Related Scriptures</h2><ul><li></li></ul>` 
  },
  sermon: { 
    title: 'Sermon: ', 
    content: `<h2>The Foundation</h2><p>Scripture Text: </p><h2>Core Message</h2><p>Summary of the Word...</p><h2>Outline</h2><ol><li>Introduction</li><li>Point 1</li><li>Point 2</li><li>Point 3</li><li>Conclusion</li></ol><h2>Application</h2><p>How shall we live?</p>` 
  }
};

export default function Notebook() {
  const { user } = useAuth();
  useBibleVerseLinks();

  // State
  const [folders, setFolders] = useState<NotebookFolder[]>([]);
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [aiInsight, setAiInsight] = useState<{ summary: string; scripture: string; exhortation: string } | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncLockRef = useRef(false);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isBibleSidebarOpen, setIsBibleSidebarOpen] = useState(false);
  const [bibleSearch, setBibleSearch] = useState('');
  const [bibleResult, setBibleResult] = useState<{ reference: string; text: string } | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    const activeNote = notes.find(n => n.id === activeNoteId);
    if (!activeNote) return { words: 0, time: 0 };
    const text = activeNote.content.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const time = Math.ceil(words / 200); // 200 wpm
    return { words, time };
  }, [activeNoteId, notes]);

  // Derived folder tree
  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

  // Search Engine
  const index = useMemo(() => new FlexSearch.Index({
    tokenize: 'forward',
    cache: true,
  }), []);

  // Update search index when notes change
  useEffect(() => {
    notes.forEach(note => {
      index.update(note.id, `${note.title} ${note.content.replace(/<[^>]*>/g, ' ')} ${note.tags.join(' ')}`);
    });
  }, [notes, index]);

  // Initialization
  useEffect(() => {
    if (!user) return;
    loadData();
    const syncInterval = setInterval(() => {
      handleSync();
    }, 30000); // Sync every 30s
    return () => clearInterval(syncInterval);
  }, [user]);

  useEffect(() => {
    // Shortcuts
    Mousetrap.bind(['command+s', 'ctrl+s'], (e) => {
      e.preventDefault();
      handleSync();
      return false;
    });

    Mousetrap.bind(['command+n', 'ctrl+n'], () => {
      createNote('general');
      return false;
    });

    Mousetrap.bind(['command+i', 'ctrl+i'], () => {
      generateAiSpark();
      return false;
    });

    Mousetrap.bind(['command+alt+n', 'ctrl+alt+n'], () => {
      createFolder();
      return false;
    });

    return () => {
      Mousetrap.unbind(['command+s', 'ctrl+s']);
      Mousetrap.unbind(['command+n', 'ctrl+n']);
      Mousetrap.unbind(['command+i', 'ctrl+i']);
      Mousetrap.unbind(['command+alt+n', 'ctrl+alt+n']);
    };
  }, [activeNoteId, activeFolderId, notes]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = async () => {
    const [f, n] = await Promise.all([
      notebookService.getFolders(),
      notebookService.getNotes()
    ]);
    setFolders(f);
    setNotes(n);
  };

  const handleSync = async () => {
    if (syncLockRef.current) return;
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    syncLockRef.current = true;
    setSyncStatus('syncing');
    try {
      await notebookService.triggerSync();
      await loadData();
      setSyncStatus('synced');
    } catch (e) {
      console.error('Sync failed:', e);
      setSyncStatus('offline');
      showNotification('Sync failed. Checking Heavens connection...', 'error');
    } finally {
      syncLockRef.current = false;
    }
  };

  const createFolder = async (parentId: string | null = null) => {
    if (!user) return;
    const name = window.prompt('Enter folder name:');
    if (!name) return;
    const newFolder: NotebookFolder = {
      id: crypto.randomUUID(),
      name,
      parentId: parentId || activeFolderId,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await notebookService.saveFolder(newFolder);
    await loadData();
  };

  const createNote = async (type: NoteType = 'general') => {
    if (!user) return;
    const template = TEMPLATES[type];
    const newNote: NotebookNote = {
      id: crypto.randomUUID(),
      folderId: activeFolderId,
      title: template.title + (type === 'general' ? '' : new Date().toLocaleDateString()),
      content: template.content,
      type,
      tags: [],
      isPinned: false,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false,
    };
    await notebookService.saveNote(newNote);
    await loadData();
    setActiveNoteId(newNote.id);
    setShowCreateMenu(false);
  };

  const updateNote = async (id: string, updates: Partial<NotebookNote>) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    const updatedNote = { ...note, ...updates, updatedAt: new Date().toISOString(), isSynced: false };
    
    // Optimistic UI update
    setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));

    // Throttled persistence
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await notebookService.saveNote(updatedNote);
      setLastSaved(new Date());
    }, 1000);
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Discard this reflection forever?')) return;
    await notebookService.deleteNote(id);
    if (activeNoteId === id) setActiveNoteId(null);
    await loadData();
  };

  const exportNote = () => {
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;
    const plainText = note.content.replace(/<[^>]*>/g, '');
    const blob = new Blob([`Title: ${note.title}\n\n${plainText}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'reflection'}.md`;
    a.click();
  };

  const generateAiSpark = async () => {
    const note = notes.find(n => n.id === activeNoteId);
    if (!note || !note.content) return;
    setIsGeneratingAi(true);
    try {
      const insight = await generateNoteInsight(note.title, note.content, note.type);
      setAiInsight(insight);
      showNotification('Divine Insight received', 'success');
    } catch (e) {
      console.error(e);
      showNotification('The Heavens are silent...', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeFolderId) {
      result = result.filter(n => n.folderId === activeFolderId);
    }
    if (searchQuery) {
      const searchResults = index.search(searchQuery);
      result = result.filter(n => (searchResults as string[]).includes(n.id));
    }
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, activeFolderId, searchQuery, index]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderFolderItems = (nodes: FolderNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="space-y-1">
        <button
          onClick={() => {
            setActiveFolderId(node.id);
            if (node.children.length > 0) toggleFolder(node.id);
          }}
          className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group ${activeFolderId === node.id ? 'bg-white/10 text-[var(--color-primary)]' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          <div className="flex items-center gap-2">
            {node.children.length > 0 ? (
              expandedFolders.has(node.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : <Folder size={14} className={activeFolderId === node.id ? 'text-[var(--color-primary)]' : ''} />}
            <span className="text-sm font-medium truncate">{node.name}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); createFolder(node.id); }} className="p-1 hover:text-[var(--color-primary)]"><Plus size={12} /></button>
            <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete folder?')) notebookService.deleteFolder(node.id).then(loadData); }} className="p-1 hover:text-red-400"><Trash2 size={12} /></button>
          </div>
        </button>
        {expandedFolders.has(node.id) && renderFolderItems(node.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className={`flex h-full bg-[#0a0a0a] text-white/90 overflow-hidden relative ${isPreviewMode ? 'bg-black' : ''}`}>
      {/* Sidebar: Navigation & Structure */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && !isFocusMode && !isPreviewMode && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/5 flex flex-col bg-black/40 backdrop-blur-3xl z-30"
          >
            <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
              {/* Header */}
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--color-primary)]/10 rounded-2xl text-[var(--color-primary)]">
                  <Book size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Reflect & Dwell</h1>
                  <p className="text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest mt-1">Record your revelations and thoughts.</p>
                </div>
              </div>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/30 hover:text-white">
                  <SidebarIcon size={18} />
                </button>
              </div>

              {/* Enhanced Create Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-[var(--color-primary)] text-[var(--color-background)] rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-neon"
                >
                  <PenTool size={16} /> Scribe Word
                </button>
                
                <AnimatePresence>
                  {showCreateMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-16 left-0 w-full bg-[#111] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-3xl"
                    >
                      <button onClick={() => createNote('general')} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all">
                        <StickyNote size={16} className="text-blue-400" />
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">General Note</div>
                          <div className="text-[10px] text-white/40">Basic reflection</div>
                        </div>
                      </button>
                      <button onClick={() => createNote('vision')} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all">
                        <Eye size={16} className="text-purple-400" />
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">Vision</div>
                          <div className="text-[10px] text-white/40">Record what was seen</div>
                        </div>
                      </button>
                      <button onClick={() => createNote('sermon')} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all">
                        <ScrollText size={16} className="text-green-400" />
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">Sermon</div>
                          <div className="text-[10px] text-white/40">Structure the Word</div>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Structure */}
              <nav className="space-y-6">
                <section className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-white/20 px-2">
                    <span>Library</span>
                  </div>
                  <button 
                    onClick={() => setActiveFolderId(null)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${!activeFolderId ? 'bg-white/10 text-[var(--color-primary)]' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                  >
                    <Archive size={18} />
                    <span className="text-sm font-medium">All Reflections</span>
                  </button>
                  <div className="space-y-1">
                    {renderFolderItems(folderTree)}
                  </div>
                </section>

                <section className="space-y-2">
                   <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-white/20 px-2">
                    <span>Sync Status</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 text-[10px] uppercase tracking-widest font-bold text-white/30 italic">
                    {syncStatus === 'synced' && <><CloudLightning size={14} className="text-green-500" /> Heavens Synced</>}
                    {syncStatus === 'syncing' && <><Cloud size={14} className="text-yellow-500 animate-pulse" /> Ascending Data...</>}
                    {syncStatus === 'offline' && <><CloudOff size={14} className="text-red-500" /> Offline Sanctuary</>}
                  </div>
                </section>
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Note List */}
      <AnimatePresence>
        {!isFocusMode && !isPreviewMode && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="w-full md:w-80 border-r border-white/5 flex flex-col bg-black/20"
          >
            <div className="p-4 border-b border-white/5">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--color-primary)] transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search thy soul..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-[var(--color-primary)]/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-20 text-[10px] uppercase tracking-widest font-black text-white/10 italic">
              Thy parchment is empty
            </div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all group border relative ${activeNoteId === note.id ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 ring-1 ring-[var(--color-primary)]/50' : 'bg-white/2 border-transparent hover:bg-white/5'}`}
              >
                {note.isPinned && <Pin size={10} className="absolute top-3 right-3 text-[var(--color-primary)]" />}
                <div className="flex items-center gap-2 mb-1">
                  {note.type === 'vision' && <Eye size={12} className="text-purple-400" />}
                  {note.type === 'sermon' && <ScrollText size={12} className="text-green-400" />}
                  <h3 className={`text-sm font-bold truncate ${activeNoteId === note.id ? 'text-white' : 'text-white/60'}`}>
                    {note.title || 'Untitled Reflection'}
                  </h3>
                </div>
                <p className="text-[10px] text-white/30 line-clamp-2 leading-relaxed">
                  {note.content.replace(/<[^>]*>/g, '') || 'Eternal silence...'}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter font-bold ${
                      note.type === 'vision' ? 'bg-purple-500/20 text-purple-400' : 
                      note.type === 'sermon' ? 'bg-green-500/20 text-green-400' : 
                      'bg-white/5 text-white/40'
                    }`}>
                      {note.type}
                    </span>
                  </div>
                  <span className="text-[9px] font-medium text-white/20 uppercase tracking-tighter">
                    {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
      )}
      </AnimatePresence>

      {/* Editor Area */}
      <main className={`flex-1 overflow-hidden flex flex-col relative shadow-2xl transition-all duration-500 ${isPreviewMode ? 'bg-black max-w-3xl mx-auto' : 'bg-[#050505]'}`}>
        {!isSidebarOpen && !isFocusMode && !isPreviewMode && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-6 left-6 z-40 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xl group transition-all"
          >
            <SidebarIcon size={18} className="text-white/40 group-hover:text-white" />
          </button>
        )}

        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Toolbar Top */}
            <div className="p-6 md:p-10 pb-0 space-y-6">
              <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => updateNote(activeNote.id, { isPinned: !activeNote.isPinned })}
                    className={`p-2 rounded-xl border transition-all ${activeNote.isPinned ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)] shadow-neon' : 'border-white/10 text-white/20 hover:text-white'}`}
                  >
                    <Pin size={18} />
                  </button>
                  <button 
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className={`p-2 rounded-xl border transition-all ${isFocusMode ? 'bg-white/20 border-white text-white' : 'border-white/10 text-white/20 hover:text-white'}`}
                    title="Focus Mode"
                  >
                    <Type size={18} />
                  </button>
                  <button 
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={`p-2 rounded-xl border transition-all ${isPreviewMode ? 'bg-white/20 border-white text-white' : 'border-white/10 text-white/20 hover:text-white'}`}
                    title="Presentation Mode"
                  >
                    <ScrollText size={18} />
                  </button>
                  <button 
                    onClick={exportNote}
                    className="p-2 border border-white/10 rounded-xl text-white/20 hover:text-white transition-all flex items-center gap-2 px-3"
                  >
                    <Download size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Export</span>
                  </button>
                  <div className="h-4 w-px bg-white/10 sm:block hidden"></div>
                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                    {activeNote.type === 'vision' ? <Eye size={14} className="text-purple-400" /> : <Book size={14} />}
                    <div className="flex items-center">
                      <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setActiveFolderId(null)}>Library</span>
                      {activeNote.folderId && folders.find(f => f.id === activeNote.folderId) && (
                        <>
                          <ChevronRight size={10} className="mx-1" />
                          <span className="text-[var(--color-primary)]">{folders.find(f => f.id === activeNote.folderId)?.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <button 
                    onClick={generateAiSpark}
                    disabled={isGeneratingAi}
                    className={`flex items-center gap-2 p-2 px-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all ${isGeneratingAi ? 'bg-white/5 text-white/20 animate-pulse' : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(147,51,234,0.3)]'}`}
                  >
                    <Sparkles size={16} /> 
                    {isGeneratingAi ? 'Consulting Havens...' : 'Divine Spark'}
                  </button>
                  <button onClick={() => deleteNote(activeNote.id)} className="p-2 text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="max-w-4xl mx-auto w-full pt-10">
                <input 
                  type="text"
                  value={activeNote.title}
                  onChange={e => updateNote(activeNote.id, { title: e.target.value })}
                  placeholder="Title of thy revelation..."
                  className="w-full bg-transparent text-4xl md:text-5xl font-serif font-black tracking-tight text-white/100 placeholder:text-white/10 outline-none leading-none mb-4"
                />
                
                <div className="flex flex-wrap items-center justify-between gap-3">
                   <div className="flex flex-wrap items-center gap-2">
                     <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                       activeNote.type === 'vision' ? 'bg-purple-500/20 text-purple-400' :
                       activeNote.type === 'sermon' ? 'bg-green-500/20 text-green-400' :
                       'bg-white/5 text-white/40'
                     }`}>
                       {activeNote.type}
                     </span>
                     <div className="h-4 w-px bg-white/10 mx-1"></div>
                     {activeNote.tags.map(tag => (
                       <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] group">
                         <Hash size={10} /> {tag}
                         <button 
                           onClick={() => updateNote(activeNote.id, { tags: activeNote.tags.filter(t => t !== tag) })} 
                           className="text-white/20 hover:text-red-400 ml-1"
                         >
                           <Trash2 size={8} />
                         </button>
                       </span>
                     ))}
                     <button 
                       onClick={() => {
                         const tag = window.prompt('New tag:');
                         if (tag && !activeNote.tags.includes(tag)) updateNote(activeNote.id, { tags: [...activeNote.tags, tag] });
                       }}
                       className="flex items-center gap-2 px-3 py-1 hover:bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-all"
                     >
                       <Plus size={10} /> Add Tag
                     </button>
                   </div>
                   
                   <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">
                     {lastSaved && <div className="flex items-center gap-1.5"><Save size={10} className="text-green-500/50" /> Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                     <div className="flex items-center gap-1.5"><FileText size={12} /> {stats.words} Words</div>
                     <div className="flex items-center gap-1.5"><Clock size={12} /> {stats.time} Min Read</div>
                   </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto px-6 md:px-10 pb-32 pt-10 custom-scrollbar ${isPreviewMode ? 'text-2xl leading-loose font-serif' : ''}`}>
              <div className="max-w-4xl mx-auto w-full space-y-12">
                <AnimatePresence>
                  {aiInsight && !isPreviewMode && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gradient-to-br from-white/[0.03] to-purple-500/[0.05] border border-white/10 rounded-3xl p-6 md:p-8 space-y-4 relative group">
                        <div className="absolute top-4 right-4 flex gap-2">
                           <button onClick={() => setAiInsight(null)} className="p-2 text-white/20 hover:text-white"><Plus size={16} className="rotate-45" /></button>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)]">
                           <Sparkles size={14} /> Divine Spark Insight
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm font-medium text-white/80 leading-relaxed italic border-l-2 border-[var(--color-primary)]/20 pl-4">
                            "{aiInsight.summary}"
                          </p>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-blue-400 bg-blue-400/10 w-fit px-3 py-1 rounded-full">
                            <Book size={12} /> {aiInsight.scripture}
                          </div>
                          <p className="text-xs text-white/40 uppercase tracking-widest font-bold pt-2">
                            {aiInsight.exhortation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {isPreviewMode ? (
                  <div className="prose prose-2xl prose-invert max-w-none font-serif leading-[1.8]" dangerouslySetInnerHTML={{ __html: sanitizeHTML(activeNote.content) }} />
                ) : (
                  <RichTextEditor 
                    key={activeNote.id}
                    content={activeNote.content}
                    onChange={(html) => updateNote(activeNote.id, { content: html })}
                    placeholder="Cast thy revelation onto the scroll..."
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8">
            <div className="relative">
               <div className="absolute inset-0 bg-[var(--color-primary)]/10 blur-[100px] rounded-full scale-150 animate-pulse"></div>
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="p-10 bg-white/2 border border-white/5 rounded-[3rem] backdrop-blur-3xl relative z-10"
               >
                 <Book size={64} className="text-[var(--color-primary)]/30 mx-auto mb-6" />
                 <h2 className="text-3xl font-serif font-black tracking-tight text-white mb-2 italic">Thy Library Awaits</h2>
                 <p className="text-[var(--color-text-muted)] text-sm max-w-xs mx-auto leading-relaxed">
                   Select an existing reflection or create a new scroll from your spirit.
                 </p>
               </motion.div>
            </div>
            
            <button 
              onClick={() => setShowCreateMenu(true)}
              className="px-10 py-4 bg-[var(--color-primary)] text-[var(--color-background)] rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-neon-glow hover:scale-105 active:scale-95 transition-all"
            >
              Begin New Scribing
            </button>
          </div>
        )}
      </main>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className={`px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
              notification.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
              'bg-blue-500/10 border-blue-500/50 text-blue-400'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                notification.type === 'success' ? 'bg-green-400' :
                notification.type === 'error' ? 'bg-red-400' :
                'bg-blue-400'
              }`} />
              <span className="text-xs font-black uppercase tracking-widest">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bible Sidebar */}
      <AnimatePresence>
        {isBibleSidebarOpen && !isPreviewMode && (
          <motion.aside
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-0 top-0 h-full w-80 bg-[#111]/90 backdrop-blur-3xl border-l border-white/10 z-[100] shadow-2xl p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Book className="text-[var(--color-primary)]" size={18} />
                <h2 className="text-xs font-black uppercase tracking-widest">Scripture Ref</h2>
              </div>
              <button onClick={() => setIsBibleSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><Plus className="rotate-45" size={18} /></button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--color-primary)]" size={16} />
                <input 
                  type="text" 
                  placeholder="e.g. John 3:16"
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-[var(--color-primary)]/40 transition-all"
                  value={bibleSearch}
                  onChange={(e) => setBibleSearch(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && bibleSearch) {
                      // Simple implementation: fetch verse or search
                      // For now, a mock search result or real if service exists
                      import('../services/bibleService').then(async ({ bibleService }) => {
                        const verse = await bibleService.getVerse(bibleSearch, 'kjv');
                        if (verse) setBibleResult({ reference: bibleSearch, text: verse.text });
                      });
                    }
                  }}
                />
              </div>

              {bibleResult ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="p-4 bg-white/2 border border-white/5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">{bibleResult.reference}</span>
                      <button 
                        onClick={() => {
                          if (activeNote) {
                            const newContent = activeNote.content + `<blockquote><p><strong>${bibleResult.reference}</strong>: ${bibleResult.text}</p></blockquote>`;
                            updateNote(activeNote.id, { content: newContent });
                          }
                        }}
                        className="text-[8px] font-bold uppercase tracking-tighter hover:text-[var(--color-primary)]"
                      >
                        Append to Note
                      </button>
                    </div>
                    <p className="text-sm font-serif italic leading-relaxed text-white/70">"{bibleResult.text}"</p>
                  </div>
                  <button onClick={() => setBibleResult(null)} className="w-full text-[10px] uppercase font-bold text-center text-white/20 hover:text-white">Clear Results</button>
                </div>
              ) : (
                <div className="p-10 text-center space-y-4 opacity-20">
                  <Book className="mx-auto" size={32} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Search the Eternal Word</p>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsBibleSidebarOpen(!isBibleSidebarOpen)}
        className={`fixed right-6 bottom-6 z-50 p-4 rounded-full shadow-2xl transition-all ${isBibleSidebarOpen ? 'bg-red-500 scale-0' : 'bg-[var(--color-primary)] text-[var(--color-background)] hover:scale-110 active:scale-95'}`}
      >
        <Book size={24} />
      </button>

      <style>{`
        .shadow-neon {
          box-shadow: 0 0 20px 0 var(--color-primary);
        }
        .shadow-neon-glow {
          box-shadow: 0 10px 40px -10px var(--color-primary);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
