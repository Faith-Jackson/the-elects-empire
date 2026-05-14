import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Markdown from 'react-markdown';
import { Bookmark, Pencil, LogIn, ChevronRight, Share2, Copy, History, Search, X, ChevronLeft, BookOpen, FileText, PenTool, CheckCircle2, Maximize2, Minimize2, Eye, EyeOff, Play, Square, Info, Brain, Loader2, Check } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { nativeService } from '../services/nativeService';
import { fetchChapter, prefetchChapter, BibleVerse } from '../services/bibleService';
import { offlineBibleService } from '../services/offlineBibleService';
import { getBiblicalRootDetails } from '../services/groqService';
import { BIBLE_TRANSLATIONS, BIBLE_BOOKS, HIGHLIGHT_COLORS } from '../constants';
import { supabase } from '../lib/supabase';
import { useVersePopup } from '../components/BibleVersePopup';
import { LinkifiedText } from '../components/LinkifiedText';
import { Download, CloudOff, Trash2 } from 'lucide-react';

export default function BibleReader() {
  const { user, settings, updateSetting } = useAuth();
  const { openVerse } = useVersePopup();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const planId = searchParams.get('planId');
  const planDay = searchParams.get('day') ? parseInt(searchParams.get('day')!) : null;
  const [userPlanData, setUserPlanData] = useState<any>(null);

  useEffect(() => {
    if (!user || !planId) return;

    const fetchUserPlan = async () => {
      const { data } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .single();
      if (data) setUserPlanData(data);
    };

    fetchUserPlan();

    const channel = supabase
      .channel(`user_plan:${planId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_plans',
        filter: `user_id=eq.${user.id} AND plan_id=eq.${planId}`
      }, (payload) => {
        setUserPlanData(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, planId]);

  const markDayComplete = async () => {
    nativeService.impact();
    if (!user || !planId || planDay === null) return;
    const completedDays = userPlanData?.completed_days || [];
    if (!completedDays.includes(planDay)) {
      const { error } = await supabase
        .from('user_plans')
        .update({
          completed_days: [...completedDays, planDay],
          current_day: planDay + 1
        })
        .eq('user_id', user.id)
        .eq('plan_id', planId);
      
      if (!error) {
        alert(`Day ${planDay} completed! Next up: Day ${planDay + 1}`);
        navigate('/plans');
      }
    }
  };
  
  const [currentBook, setCurrentBook] = useState('Genesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  
  // Translation validation (fallback if previously selected non-English)
  const translationSettings = settings.bibleTranslation || 'KJV';
  const translation = BIBLE_TRANSLATIONS.some(t => t.id === translationSettings) ? translationSettings : 'KJV';

  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{current: number, total: number} | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const checkDownload = async () => {
      const status = await offlineBibleService.isDownloaded(translation.toLowerCase());
      setIsDownloaded(status);
    };
    checkDownload();
  }, [translation]);

  const downloadFullBible = async () => {
    if (isDownloaded) return;
    
    setDownloadProgress({ current: 0, total: BIBLE_BOOKS.length });
    setDownloadError(null);
    const fullBibleData: Record<string, any> = {};

    try {
      for (let i = 0; i < BIBLE_BOOKS.length; i++) {
        const book = BIBLE_BOOKS[i];
        fullBibleData[book.name] = {};
        
        const chapters = [];
        for (let ch = 1; ch <= book.chapters; ch++) {
           const fetchPromise = fetchChapter(book.name, ch, translation).then(async (data) => {
             fullBibleData[book.name][ch] = data;
             await offlineBibleService.saveChapter(translation.toLowerCase(), book.name, ch, data);
           });
           
           chapters.push(fetchPromise);
           if (chapters.length >= 2) { // Even smaller batch for maximum safety
             await Promise.all(chapters);
             chapters.length = 0;
             await new Promise(resolve => setTimeout(resolve, 150));
           }
        }
        await Promise.all(chapters);
        
        setDownloadProgress({ current: i + 1, total: BIBLE_BOOKS.length });
      }
      
      await offlineBibleService.saveTranslation(translation.toLowerCase(), translation, { downloadedAt: Date.now() });
      
      const { bibleSearchService } = await import('../services/searchService');
      bibleSearchService.indexTranslation(translation.toLowerCase(), fullBibleData);
      
      setIsDownloaded(true);
      setDownloadProgress(null);
    } catch (error: any) {
      console.error("Download failed", error);
      setDownloadError(error.message || "Connection lost during download.");
      setDownloadProgress(null);
    }
  };

  const removeDownload = async () => {
    await offlineBibleService.deleteTranslation(translation.toLowerCase());
    setIsDownloaded(false);
  };

  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Custom Data
  const [highlights, setHighlights] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [commentaries, setCommentaries] = useState<Record<number, string>>({});
  const [bookIntro, setBookIntro] = useState<string | null>(null);
  const [chapterSummary, setChapterSummary] = useState<string | null>(null);
  const [verseArticles, setVerseArticles] = useState<Record<number, any[]>>({});
  
  // UI State
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const activeVerse = selectedVerses.length > 0 ? selectedVerses[selectedVerses.length - 1] : null;

  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [debouncedNoteContent, setDebouncedNoteContent] = useState('');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  
  // Create a debounced effect for autosaving
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedNoteContent(noteContent);
    }, 1500); // 1.5 second delay
    return () => clearTimeout(handler);
  }, [noteContent]);

  useEffect(() => {
    if (activeVerse !== null && debouncedNoteContent !== '' && notes[activeVerse] !== undefined && debouncedNoteContent !== notes[activeVerse]) {
      saveNote(debouncedNoteContent);
    }
  }, [debouncedNoteContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Meditation Mode with Cmd+M or Ctrl+M
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        setIsMeditationMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Selection Popups
  const [activeSelector, setActiveSelector] = useState<'book' | 'chapter' | 'verse' | 'translation' | 'rightBook' | 'rightChapter' | null>(null);
  const [selectorData, setSelectorData] = useState<{ book?: string, chapter?: number }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAudio = () => {
    if (isReadingAloud) {
      window.speechSynthesis.cancel();
      setIsReadingAloud(false);
      setActiveReadingVerse(null);
    } else {
      const startReading = (startIndex: number) => {
        if (startIndex >= verses.length) {
          setIsReadingAloud(false);
          setActiveReadingVerse(null);
          return;
        }

        const v = verses[startIndex];
        setActiveReadingVerse(v.verse);
        
        // Scroll to verse being read
        const el = document.getElementById(`verse-${v.verse}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const utterance = new SpeechSynthesisUtterance(v.text);
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
          startReading(startIndex + 1);
        };

        utterance.onerror = () => {
          setIsReadingAloud(false);
          setActiveReadingVerse(null);
        };

        window.speechSynthesis.speak(utterance);
      };

      setIsReadingAloud(true);
      startReading(0);
    }
  };

  const handleWordClick = async (word: string, verseText: string) => {
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    if (!cleanWord) return;

    setActiveRootStudy({ word: cleanWord, details: null, isLoading: true });
    try {
      const details = await getBiblicalRootDetails(cleanWord, verseText);
      setActiveRootStudy({ word: cleanWord, details, isLoading: false });
    } catch (e) {
      setActiveRootStudy({ word: cleanWord, details: "Unable to find details for this word.", isLoading: false });
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // New UI Features
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isBottomBarVisible, setIsBottomBarVisible] = useState(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [isMeditationMode, setIsMeditationMode] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Audio State
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [activeReadingVerse, setActiveReadingVerse] = useState<number | null>(null);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Root Study State
  const [activeRootStudy, setActiveRootStudy] = useState<{ word: string, details: string | null, isLoading: boolean } | null>(null);
  const [copiedRoot, setCopiedRoot] = useState(false);

  const copyRootDetails = async () => {
    if (!activeRootStudy?.details) return;
    try {
      await navigator.clipboard.writeText(activeRootStudy.details);
      setCopiedRoot(true);
      setTimeout(() => setCopiedRoot(false), 2000);
    } catch (err) {
      console.error('Failed to copy root details', err);
    }
  };

  // Reader Mode Overlay State
  const [isReaderOverlayVisible, setIsReaderOverlayVisible] = useState(false);
  const [overlayTimer, setOverlayTimer] = useState<NodeJS.Timeout | null>(null);

  // Split View Adjustment
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // Deep Linking logic
  useEffect(() => {
    const bookParam = searchParams.get('book');
    const chapterParam = searchParams.get('chapter');
    const verseParam = searchParams.get('verse');

    if (bookParam) {
      const matchedBook = BIBLE_BOOKS.find(b => b.name.toLowerCase() === bookParam.toLowerCase());
      if (matchedBook) {
        setCurrentBook(matchedBook.name);
        if (chapterParam) {
          const chapNum = parseInt(chapterParam);
          if (!isNaN(chapNum) && chapNum > 0 && chapNum <= matchedBook.chapters) {
            setCurrentChapter(chapNum);
          }
        }
        if (verseParam) {
          const vNum = parseInt(verseParam);
          if (!isNaN(vNum)) {
            setSelectedVerses([vNum]);
          }
        }
      }
    }
  }, []); // Run only on mount

  // Scroll to deep-linked verse once loading is complete
  useEffect(() => {
    if (!loading && activeVerse && verses.length > 0) {
      const verseElement = document.getElementById(`verse-${activeVerse}`);
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [loading, verses, activeVerse]);

  const toggleVerseSelection = (vNum: number) => {
    nativeService.impact();
    setSelectedVerses(prev => {
      if (prev.includes(vNum)) {
        return prev.filter(v => v !== vNum);
      } else {
        return [...prev, vNum].sort((a, b) => a - b);
      }
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      const isMobile = window.innerWidth < 768;
      const dimension = isMobile ? window.innerHeight : window.innerWidth;
      const coord = isMobile ? clientY : clientX;
      
      const newRatio = (coord / dimension) * 100;
      // Constraint between 20% and 80%
      if (newRatio > 20 && newRatio < 80) {
        setSplitRatio(newRatio);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    document.body.style.cursor = window.innerWidth < 768 ? 'row-resize' : 'col-resize';
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      document.body.style.cursor = 'default';
    };
  }, [isDragging]);

  // Split View Config
  const [rightBook, setRightBook] = useState('John');
  const [rightChapter, setRightChapter] = useState(1);
  const [rightTranslation, setRightTranslation] = useState('KJV');
  const [rightVerses, setRightVerses] = useState<BibleVerse[]>([]);
  const [rightLoading, setRightLoading] = useState(false);

  // Settings
  const isInline = settings.commentaryLayout === 'inline';

  const isNTBook = (bookName: string) => {
    const ntStartIdx = BIBLE_BOOKS.findIndex(b => b.name === 'Matthew');
    const bookIdx = BIBLE_BOOKS.findIndex(b => b.name === bookName);
    return bookIdx >= ntStartIdx;
  };

  const navigateToVerse = (bookName: string, chapter: number, verse: number) => {
    // We now use the global popup instead of instant navigation
    openVerse(bookName, chapter, verse);
  };

  // Handle scroll to hide/show UI
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const container = e.target as HTMLElement;
      const currentScrollY = container.scrollTop;
      
      if (currentScrollY === 0) {
        setIsTopBarVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling Down
        setIsTopBarVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling Up
        setIsTopBarVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    const containers = document.querySelectorAll('.bible-scroll-container');
    containers.forEach(c => c.addEventListener('scroll', handleScroll));
    return () => containers.forEach(c => c.removeEventListener('scroll', handleScroll));
  }, [lastScrollY, activeVerse]);

  // Show bottom bar when verses are selected
  useEffect(() => {
    if (selectedVerses.length > 0) {
      setIsBottomBarVisible(true);
    } else {
      setIsBottomBarVisible(false);
    }
  }, [selectedVerses]);

  // Reader Mode Overlay Timout
  useEffect(() => {
    if (isReaderOverlayVisible && isReaderMode) {
      const timer = setTimeout(() => {
        setIsReaderOverlayVisible(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isReaderOverlayVisible, isReaderMode]);

  const handleReaderScreenClick = () => {
    if (isReaderMode) {
      setIsReaderOverlayVisible(prev => !prev);
    }
  };

  // Fetch for Split View
  useEffect(() => {
    if (!isSplitView) return;
    setRightLoading(true);
    fetchChapter(rightBook, rightChapter, rightTranslation)
      .then(data => setRightVerses(data.verses))
      .catch(console.error)
      .finally(() => setRightLoading(false));
  }, [rightBook, rightChapter, rightTranslation, isSplitView]);

  useEffect(() => {
    const selectedTrans = BIBLE_TRANSLATIONS.find(t => t.id === translation);
    
    // Check if translation supports Old Testament
    if (selectedTrans?.isNTOnly && !isNTBook(currentBook)) {
      setFetchError(`${selectedTrans.name} is a New Testament only translation. Please select a full Bible translation or switch to a New Testament book.`);
      setVerses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);
    
    // Fetch Book Intro and Chapter Summary as well
    const introId = currentBook.replace(/\s+/g, '_');
    const summaryId = `${currentBook}_${currentChapter}`.replace(/\s+/g, '_');

    supabase.from('book_intros').select('content').eq('book', currentBook).single().then(({ data }) => {
      setBookIntro(data ? data.content : null);
    });

    supabase.from('chapter_summaries').select('content').eq('book', currentBook).eq('chapter', currentChapter).single().then(({ data }) => {
      setChapterSummary(data ? data.content : null);
    });

    fetchChapter(currentBook, currentChapter, translation)
      .then(data => {
        setVerses(data.verses);
        
        // Prefetch next chapter
        const bookIdx = BIBLE_BOOKS.findIndex(b => b.name === currentBook);
        const book = BIBLE_BOOKS[bookIdx];
        if (currentChapter < book.chapters) {
          prefetchChapter(currentBook, currentChapter + 1, translation);
        } else if (bookIdx < BIBLE_BOOKS.length - 1) {
          prefetchChapter(BIBLE_BOOKS[bookIdx + 1].name, 1, translation);
        }
      })
      .catch(err => {
        console.error(err);
        const transName = selectedTrans?.name || translation;
        setFetchError(`Failed to fetch ${currentBook} ${currentChapter} (${transName}). Note: Some digital versions may be incomplete or New Testament only.`);
      })
      .finally(() => setLoading(false));
  }, [currentBook, currentChapter, translation]);

  useEffect(() => {
    // Listen for commentaries (Public)
    const fetchCommentaries = async () => {
        const { data } = await supabase.from('commentaries')
            .select('*')
            .eq('book', currentBook)
            .eq('chapter', currentChapter);
        if (data) {
            const c: Record<number, string> = {};
            data.forEach(d => {
                c[d.verse] = d.content;
            });
            setCommentaries(c);
        }
    };

    fetchCommentaries();
    const commChannel = supabase.channel('public:commentaries')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'commentaries', filter: `book=eq.${currentBook} AND chapter=eq.${currentChapter}` }, () => {
            fetchCommentaries();
        })
        .subscribe();

    if (!user) {
      setHighlights({});
      setNotes({});
      return () => supabase.removeChannel(commChannel);
    }
    
    // Listen for highlights
    const fetchHighlights = async () => {
        const { data } = await supabase.from('highlights')
            .select('*')
            .eq('user_id', user.id)
            .eq('book', currentBook)
            .eq('chapter', currentChapter);
        if (data) {
            const h: Record<number, string> = {};
            data.forEach(d => {
                h[d.verse] = d.color;
            });
            setHighlights(h);
        }
    };

    fetchHighlights();
    const highlightsChannel = supabase.channel('public:highlights')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'highlights', filter: `user_id=eq.${user.id} AND book=eq.${currentBook} AND chapter=eq.${currentChapter}` }, () => {
            fetchHighlights();
        })
        .subscribe();

    // Listen for notes
    const fetchNotes = async () => {
        const { data } = await supabase.from('notes')
            .select('*')
            .eq('user_id', user.id)
            .eq('book', currentBook)
            .eq('chapter', currentChapter);
        if (data) {
            const n: Record<number, string> = {};
            data.forEach(d => {
                n[d.verse] = d.content;
            });
            setNotes(n);
        }
    };

    fetchNotes();
    const notesChannel = supabase.channel('public:notes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id} AND book=eq.${currentBook} AND chapter=eq.${currentChapter}` }, () => {
            fetchNotes();
        })
        .subscribe();

    // Listen for related articles
    const fetchRelatedArticles = async () => {
        const { data } = await supabase.from('articles').select('*');
        if (data) {
            const vArt: Record<number, any[]> = {};
            data.forEach(art => {
                if (art.relatedVerses) {
                    art.relatedVerses.forEach((rv: any) => {
                        if (rv.book === currentBook && rv.chapter === currentChapter) {
                            if (!vArt[rv.verse]) vArt[rv.verse] = [];
                            vArt[rv.verse].push({ id: art.id, ...art });
                        }
                    });
                }
            });
            setVerseArticles(vArt);
        }
    };

    fetchRelatedArticles();
    const articlesChannel = supabase.channel('public:articles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () => {
            fetchRelatedArticles();
        })
        .subscribe();

    return () => {
      supabase.removeChannel(commChannel);
      supabase.removeChannel(highlightsChannel);
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(articlesChannel);
    };
  }, [user, currentBook, currentChapter]);

  const requireAuth = (action: () => Promise<void> | void) => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    const result = action();
    if (result instanceof Promise) {
      result.catch(err => {
        console.error("Action failed:", err);
        // Throwing it to unhandled rejection to trigger ErrorBoundary visually
        setTimeout(() => { throw err; }, 0);
      });
    }
  };

  const setHighlight = async (verse: number, color: string) => {
    requireAuth(async () => {
      if (!user) return;
      
      const verseObj = verses.find(v => v.verse === verse);
      const verseText = verseObj ? verseObj.text : '';

      if (color === 'transparent' || highlights[verse] === color) {
        await supabase.from('highlights').delete()
            .eq('user_id', user.id)
            .eq('book', currentBook)
            .eq('chapter', currentChapter)
            .eq('verse', verse);
      } else {
        await supabase.from('highlights').upsert({
          user_id: user.id,
          book: currentBook,
          chapter: currentChapter,
          verse: verse,
          verseText: verseText,
          color: color,
          timestamp: new Date().toISOString()
        });
      }
      setShowColorPicker(false);
    });
  };

  const openNote = (verse: number) => {
    requireAuth(() => {
      setSelectedVerses([verse]);
      setNoteContent(notes[verse] || '');
      setIsNoteDrawerOpen(true);
    });
  };

  const saveNote = async (contentToSave: string = noteContent) => {
    if (!user || activeVerse === null) return;
    try {
      const verseObj = verses.find(v => v.verse === activeVerse);
      const verseText = verseObj ? verseObj.text : '';

      if (contentToSave.trim() === '') {
        await supabase.from('notes').delete()
            .eq('user_id', user.id)
            .eq('book', currentBook)
            .eq('chapter', currentChapter)
            .eq('verse', activeVerse);
      } else {
        await supabase.from('notes').upsert({
          user_id: user.id,
          book: currentBook,
          chapter: currentChapter,
          verse: activeVerse,
          verseText: verseText,
          content: contentToSave,
          updated_at: new Date().toISOString()
        });
      }
      setIsNoteDrawerOpen(false);
    } catch (error) {
      console.error("Failed to save note:", error);
      throw error;
    }
  };

  // Selection Bar
  const selectedBookData = BIBLE_BOOKS.find(b => b.name === currentBook) || BIBLE_BOOKS[0];

  const handleBookSelect = (bookName: string) => {
    setSelectorData({ book: bookName });
    setActiveSelector(activeSelector === 'rightBook' ? 'rightChapter' : 'chapter');
  };

  const handleChapterSelect = (chapter: number) => {
    nativeService.impact();
    if (selectorData.book) {
      if (activeSelector === 'chapter') {
        setCurrentBook(selectorData.book);
        setCurrentChapter(chapter);
      } else if (activeSelector === 'rightChapter') {
        setRightBook(selectorData.book);
        setRightChapter(chapter);
      }
    }
    setActiveSelector(null);
    setSelectorData({});
  };

  const shareSelectedVerses = async () => {
    if (selectedVerses.length === 0) return;
    
    const verseTexts = selectedVerses.map(vNum => {
      const v = verses.find(v => v.verse === vNum);
      return v ? `${vNum}. ${v.text}` : '';
    }).join('\n');
    
    const shareText = `"${verseTexts}"\n\n— ${currentBook} ${currentChapter} (${translation})\nShared from The Elects Empire`;
    const shareUrl = `${window.location.origin}/read?book=${currentBook}&chapter=${currentChapter}${selectedVerses.length === 1 ? `&verse=${selectedVerses[0]}` : ''}`;
    
    await nativeService.share('Imperial Scripture', shareText, shareUrl);
    nativeService.impact();
  };

  const filteredBooks = BIBLE_BOOKS.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const otBooks = filteredBooks.filter(b => BIBLE_BOOKS.indexOf(b) < 39);
  const ntBooks = filteredBooks.filter(b => BIBLE_BOOKS.indexOf(b) >= 39);

  const markChapterComplete = async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    
    await supabase.from('reading_progress').upsert({
      user_id: user.id,
      book: currentBook,
      chapter: currentChapter,
      read_at: new Date().toISOString()
    });

    // Update streak logic and total chapters
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let newStreak = profile.streak || 0;
      if (profile.lastReadDate === yesterday) {
        newStreak += 1;
      } else if (profile.lastReadDate !== today) {
        newStreak = 1;
      }
      
      await supabase.from('profiles').update({
        totalChaptersRead: (profile.totalChaptersRead || 0) + 1,
        lastReadDate: today,
        streak: newStreak
      }).eq('id', user.id);

      // Milestone Notifications
      if (newStreak > 0 && newStreak % 7 === 0) {
        await supabase.from('notifications').insert([{
          user_id: user.id,
          title: '🔥 Heavenly Streak!',
          message: `Glory to God! You have studied for ${newStreak} days in a row. Keep the fire burning!`,
          read: false,
          created_at: new Date().toISOString()
        }]);
      }

      // Check Total Chapters Milestone
      const totalChapters = (profile.totalChaptersRead || 0) + 1;
      if (totalChapters > 0 && totalChapters % 50 === 0) {
        await supabase.from('notifications').insert([{
          user_id: user.id,
          title: '📖 Word Warrior',
          message: `Incredible! You have completed ${totalChapters} chapters of the living Word.`,
          read: false,
          created_at: new Date().toISOString()
        }]);
      }
    }

    setIsChapterFinished(true);
    
    // Auto-advance
    const bookIdx = BIBLE_BOOKS.findIndex(b => b.name === currentBook);
    const book = BIBLE_BOOKS[bookIdx];
    if (currentChapter < book.chapters) {
      setCurrentChapter(currentChapter + 1);
    } else if (bookIdx < BIBLE_BOOKS.length - 1) {
      setCurrentBook(BIBLE_BOOKS[bookIdx + 1].name);
      setCurrentChapter(1);
    }
  };

  const [isChapterFinished, setIsChapterFinished] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase.from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('book', currentBook)
        .eq('chapter', currentChapter)
        .single()
        .then(({ data }) => {
            setIsChapterFinished(!!data);
        });
  }, [user, currentBook, currentChapter]);

  // Handle swipe gestures
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeThreshold = 100;

  const handleSwipeEnd = (e: any, info: any) => {
    if (info.offset.x < -swipeThreshold) {
      // Next Chapter
      const bookIdx = BIBLE_BOOKS.findIndex(b => b.name === currentBook);
      const book = BIBLE_BOOKS[bookIdx];
      if (currentChapter < book.chapters) {
        setCurrentChapter(currentChapter + 1);
      } else if (bookIdx < BIBLE_BOOKS.length - 1) {
        setCurrentBook(BIBLE_BOOKS[bookIdx + 1].name);
        setCurrentChapter(1);
      }
    } else if (info.offset.x > swipeThreshold) {
      // Prev Chapter
      if (currentChapter > 1) {
        setCurrentChapter(currentChapter - 1);
      } else {
        const bookIdx = BIBLE_BOOKS.findIndex(b => b.name === currentBook);
        if (bookIdx > 0) {
          const prevBook = BIBLE_BOOKS[bookIdx - 1];
          setCurrentBook(prevBook.name);
          setCurrentChapter(prevBook.chapters);
        }
      }
    }
    setSwipeOffset(0);
  };

  return (
    <div className={`flex-1 flex flex-col h-full w-full relative z-10 overflow-hidden bg-transparent pt-4 md:pt-safe transition-all duration-700 ${isMeditationMode ? 'fixed inset-0 z-[1000] bg-black h-screen md:h-screen w-screen' : ''}`}>
      {isMeditationMode && <div className="fixed inset-0 bg-[#020202] z-[-1] animate-fade-in" />}
      {/* Floating Top Selection Bar (Pill Mode) */}
      {!isReaderMode && (
        <div className={`fixed top-16 md:top-[100px] left-1/2 -translate-x-1/2 z-40 w-full md:w-[96%] max-w-4xl px-2 md:px-4 pointer-events-none transition-all duration-700 ${isTopBarVisible ? 'translate-y-0 opacity-100' : '-translate-y-48 opacity-0'}`}>
          <div className="glass-panel rounded-2xl md:rounded-full px-2 md:px-8 py-1.5 md:py-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl flex items-center justify-between bg-[var(--color-surface)]/90 pointer-events-auto border border-white/10 ring-1 ring-white/5 mx-auto">
            <div className="flex items-center gap-1 md:gap-2">
              <button 
                onClick={() => setActiveSelector('book')}
                className="flex items-center gap-1.5 md:gap-3 bg-[var(--color-primary)]/10 rounded-xl md:rounded-full px-2.5 md:px-5 py-2 md:py-2.5 text-[10px] md:text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition-all cursor-pointer shadow-neon-glow group shrink-0 active-press border border-[var(--color-primary)]/20"
              >
                <span className="truncate max-w-[60px] xs:max-w-[100px] md:max-w-none">{currentBook} {currentChapter}</span>
                <ChevronRight size={12} className="shrink-0 opacity-50 md:group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            <div className="flex items-center gap-1 md:gap-4">
               <div className="flex items-center bg-black/20 rounded-xl md:rounded-full p-0.5 md:p-1.5 gap-0.5 md:gap-1.5 border border-white/10 shadow-inner">
                 <button 
                   onClick={() => setIsSplitView(!isSplitView)}
                   className={`p-2 md:p-3 rounded-lg md:rounded-full transition-all active-press ${isSplitView ? 'bg-[var(--color-primary)] text-[var(--color-background)] shadow-neon' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                   title="Split View"
                 >
                   <div className="flex gap-0.5 md:gap-1">
                      <div className="w-0.5 h-3 md:h-4 bg-current rounded-full"></div>
                      <div className="w-0.5 h-3 md:h-4 bg-current rounded-full opacity-50"></div>
                   </div>
                 </button>

                 <button 
                   onClick={toggleAudio}
                   className={`p-2 md:p-3 rounded-lg md:rounded-full transition-all active-press ${isReadingAloud ? 'bg-rose-500 text-white shadow-neon' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                   title={isReadingAloud ? "Stop Reading" : "Read Aloud"}
                 >
                   {isReadingAloud ? <Square size={16} /> : <Play size={16} />}
                 </button>

                 <button 
                   onClick={() => setIsReaderMode(!isReaderMode)}
                   className={`p-2 md:p-3 rounded-lg md:rounded-full transition-all active-press ${isReaderMode ? 'bg-[var(--color-primary)] text-[var(--color-background)] shadow-neon' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                   title="Reader Mode"
                 >
                   <BookOpen size={18} className="md:w-[22px] md:h-[22px]" />
                 </button>

                 {!isSplitView && (
                   <button 
                     onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                     className={`p-2 md:p-3 rounded-lg md:rounded-full transition-all active-press ${isSidebarOpen ? 'bg-[var(--color-primary)] text-[var(--color-background)] shadow-neon' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                     title={isSidebarOpen ? "Side Panel Active" : "Inline Mode Active"}
                   >
                     <FileText size={18} className="md:w-[22px] md:h-[22px]" />
                   </button>
                 )}
               </div>

               <div className="w-px h-5 md:h-10 bg-white/10 mx-0.5 md:mx-2 hidden xs:block" />

               <button 
                 onClick={() => setActiveSelector('translation')}
                 className="bg-black/20 border border-white/10 rounded-xl md:rounded-full px-3 md:px-6 py-2 md:py-3 text-[9px] md:text-[12px] uppercase tracking-wider md:tracking-[0.2em] font-black text-white/90 hover:text-white transition-all cursor-pointer active-press shadow-lg"
               >
                 {translation}
               </button>

                <div className="flex items-center gap-1 ml-1 relative">
                  {downloadError && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 glass-panel rounded-xl border border-red-500/20 text-red-400 text-[10px] w-48 text-center animate-in fade-in slide-in-from-bottom-1">
                      {downloadError}
                    </div>
                  )}
                  {downloadProgress ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-primary)]/10 rounded-xl border border-[var(--color-primary)]/20 animate-pulse">
                      <div className="w-3 h-3 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                      <span className="text-[10px] font-black text-[var(--color-primary)] uppercase">{Math.round((downloadProgress.current / downloadProgress.total) * 100)}%</span>
                    </div>
                  ) : isDownloaded ? (
                    <button 
                      onClick={removeDownload}
                      className="p-2 md:p-3 rounded-lg md:rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all group"
                      title="Downloaded (Click to delete)"
                    >
                      <CheckCircle2 size={16} className="group-hover:hidden" />
                      <Trash2 size={16} className="hidden group-hover:block" />
                    </button>
                  ) : (
                    <button 
                      onClick={downloadFullBible}
                      className={`p-2 md:p-3 rounded-lg md:rounded-full border transition-all ${downloadError ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/20'}`}
                      title={downloadError ? "Retry Download" : "Download full Bible for offline use"}
                    >
                      {downloadError ? <CloudOff size={16} /> : <Download size={16} />}
                    </button>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Navigation Buttons (Prev/Next) */}
      {!isReaderMode && (
        <>
          <button 
            onClick={() => setCurrentChapter(Math.max(1, currentChapter - 1))}
            className={`fixed left-4 top-1/2 -translate-y-1/2 z-[45] p-3 rounded-full glass-panel text-[var(--color-text)] hover:text-[var(--color-primary)] hover:shadow-neon-glow transition-all duration-500 hidden md:flex ${isBottomBarVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
            title="Previous Chapter"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => setCurrentChapter(currentChapter + 1)}
            className={`fixed right-4 top-1/2 -translate-y-1/2 z-[45] p-3 rounded-full glass-panel text-[var(--color-text)] hover:text-[var(--color-primary)] hover:shadow-neon-glow transition-all duration-500 hidden md:flex ${isBottomBarVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
            title="Next Chapter"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Reader Mode Interactive Overlay */}
      {isReaderMode && (
        <div 
          className={`fixed inset-0 z-[100] transition-all duration-700 pointer-events-none ${isReaderOverlayVisible ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-transparent backdrop-blur-0'}`}
        >
          {/* Top Bar Overlay */}
          <div className={`absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-xl transition-all duration-500 pointer-events-auto ${isReaderOverlayVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
            <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between shadow-2xl bg-[var(--color-surface)]/90 border border-white/10">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsReaderMode(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-xs font-bold uppercase tracking-widest text-white/70 hover:text-[var(--color-primary)] active-press"
              >
                <X size={16} /> Exit Reader
              </button>

              <div className="flex items-center gap-3">
                 {/* Font Size Selector */}
                 <div className="flex bg-white/5 rounded-full p-1 border border-white/5 shadow-inner">
                    {[
                      { l: 'A', s: 'text-[15px] md:text-[17px]' },
                      { l: 'A', s: 'text-[17px] md:text-[19px]' },
                      { l: 'A', s: 'text-[21px] md:text-[23px]' }
                    ].map((sz, i) => (
                      <button 
                        key={i}
                        onClick={(e) => { e.stopPropagation(); updateSetting('fontSize', sz.s); }}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${settings.fontSize === sz.s ? 'bg-[var(--color-primary)] text-[var(--color-background)]' : 'text-white/40 hover:bg-white/10'}`}
                      >
                        <span style={{ fontSize: i === 0 ? '10px' : i === 1 ? '14px' : '18px' }}>{sz.l}</span>
                      </button>
                    ))}
                 </div>

                 {/* Theme Selector (Mini) */}
                 <div className="flex bg-white/5 rounded-full p-1 border border-white/5 shadow-inner gap-1">
                    {['amoled', 'light', 'sepia', 'dark'].map((t) => (
                      <button 
                        key={t}
                        onClick={(e) => { e.stopPropagation(); updateSetting('themePreference', t); }}
                        className={`w-6 h-6 rounded-full border transition-all active-press ${settings.themePreference === t ? 'border-[var(--color-primary)] shadow-neon' : 'border-transparent'}`}
                        style={{ 
                          backgroundColor: t === 'amoled' ? '#000' : t === 'light' ? '#f8f6f2' : t === 'sepia' ? '#fdfcf0' : '#1a1a1a' 
                        }}
                      />
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div 
        className="flex-1 flex overflow-hidden relative bg-transparent"
        onClick={handleReaderScreenClick}
      >
        <div className={`flex-1 flex h-full ${isReaderMode ? 'max-w-4xl mx-auto' : 'w-full'} transition-all duration-500`}>
          {/* Main Bible Text Area */}
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
            {/* Left Pane */}
            <motion.div 
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleSwipeEnd}
              className={`bible-scroll-container bg-transparent p-4 md:p-8 pt-24 md:pt-28 overflow-y-auto relative transition-all duration-500`}
              style={{ flexBasis: isSplitView ? `${splitRatio}%` : '100%', flexGrow: isSplitView ? 0 : 1, flexShrink: 0 }}
            >
              <div className="pb-10 mb-10">
                 <div className="flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)] font-bold font-sans glow-text">
                          {BIBLE_TRANSLATIONS.find(t => t.id === translation)?.name}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif text-[var(--color-text)] tracking-tight mt-2">
                          {currentBook} <span className="text-[var(--color-primary)]">{currentChapter}</span>
                        </h2>
                    </div>
                 </div>
                 
                 {/* Book Intro & Chapter Summary */}
                 {!loading && !fetchError && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }} 
                     animate={{ opacity: 1, y: 0 }}
                     className="mt-8 space-y-6"
                   >
                     {currentChapter === 1 && bookIntro && (
                       <div className="glass-card rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent border border-[var(--color-primary)]/20 shadow-neon-glow">
                         <div className="flex items-center gap-3 mb-4">
                           <div className="p-2 rounded-xl bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                             <BookOpen size={20} />
                           </div>
                           <h3 className="font-serif font-bold text-xl md:text-2xl text-[var(--color-text)]">Book Introduction</h3>
                         </div>
                         <div className="markdown-body text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed font-serif italic">
                            <Markdown 
                              components={{
                                p: ({children}) => <p className="mb-4"><LinkifiedText text={String(children)} /></p>,
                              }}
                            >
                              {bookIntro}
                            </Markdown>
                         </div>
                       </div>
                     )}

                     {chapterSummary && (
                       <div className="glass-panel rounded-3xl p-6 md:p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/50 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileText size={100} />
                         </div>
                         <div className="flex items-center gap-3 mb-4">
                           <div className="p-2 rounded-xl bg-[var(--color-text)]/5 text-[var(--color-text-muted)]">
                             <FileText size={20} />
                           </div>
                           <h3 className="font-serif font-bold text-lg md:text-xl text-[var(--color-text)]">Chapter Context</h3>
                         </div>
                         <div className="markdown-body text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
                            <Markdown 
                              components={{
                                p: ({children}) => <p className="mb-4"><LinkifiedText text={String(children)} /></p>,
                              }}
                            >
                              {chapterSummary}
                            </Markdown>
                         </div>
                       </div>
                     )}
                   </motion.div>
                 )}
              </div>
            
              {loading ? (
                <div className="text-center py-12 opacity-50 animate-pulse">Loading revelation...</div>
              ) : fetchError ? (
                <div className="text-center py-20 px-8 glass-panel rounded-[2rem] border border-red-500/10 max-w-lg mx-auto">
                  <CloudOff className="mx-auto text-red-400/50 mb-4" size={40} />
                  <h3 className="text-red-400 font-bold uppercase tracking-widest text-[10px] mb-2">Heavenly Response Error</h3>
                  <p className="text-white/40 text-xs mb-8 leading-relaxed font-serif italic text-balance">
                    {fetchError}
                  </p>
                  <button 
                    onClick={() => {
                        setLoading(true);
                        setFetchError(null);
                        // Re-trigger fetch by just setting loading to true or similar logic 
                        // but actually simplest is to just reload the data if we have a state to toggle
                        window.location.reload(); 
                    }}
                    className="px-8 py-3 bg-[var(--color-primary)] text-[var(--color-background)] rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-neon-glow"
                  >
                    Attempt Reconnection
                  </button>
                </div>
              ) : (
                <div className={`space-y-4 ${settings.fontFamily} ${settings.fontSize} ${settings.lineSpacing || 'leading-8'} ${settings.textAlignment || 'text-left'} text-[var(--color-text)] pb-32`}>
                  {planId && planDay && (
                    <div className="mb-8 p-6 glass-panel rounded-3xl border border-[var(--color-primary)]/20 shadow-neon-glow flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-[var(--color-primary)]" />
                        <div>
                          <p className="text-sm font-bold">Planned Reading: Day {planDay}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">Finish reading to track progress</p>
                        </div>
                      </div>
                      <button 
                        onClick={markDayComplete}
                        className="px-6 py-2 bg-[var(--color-primary)] text-black rounded-full font-bold hover:shadow-neon transition-all active-press text-sm"
                      >
                        Mark Day {planDay} Complete
                      </button>
                    </div>
                  )}
                  {verses.map(v => (
                    <div 
                      key={v.verse} 
                      id={`verse-${v.verse}`}
                      className={`group relative p-3 md:p-4 rounded-3xl transition-all duration-500 cursor-pointer border border-transparent ${
                        selectedVerses.includes(v.verse) 
                        ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/40 shadow-neon-glow ring-1 ring-[var(--color-primary)]/50' 
                        : activeReadingVerse === v.verse
                        ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)] shadow-neon-glow'
                        : 'hover:bg-white/5'
                      }`}
                      onClick={() => toggleVerseSelection(v.verse)}
                    >
                      <div 
                        className="inline transition-colors duration-300 rounded px-1"
                        style={{ backgroundColor: highlights[v.verse] ? `${highlights[v.verse]}4d` : undefined }}
                      >
                        <span className={`text-[10px] font-black mr-3 px-2 py-0.5 rounded-md align-middle inline-flex items-center justify-center transition-all ${
                          selectedVerses.includes(v.verse) 
                          ? 'text-[var(--color-background)] bg-[var(--color-primary)] shadow-neon' 
                          : 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                        }`}>{v.verse}</span>
                        <span className="align-middle">
                          {v.text.split(' ').map((word, i) => (
                            <span 
                              key={i} 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWordClick(word, v.text);
                              }}
                              className="hover:text-[var(--color-primary)] hover:underline decoration-dotted cursor-help transition-colors"
                            >
                              {word}{' '}
                            </span>
                          ))}
                        </span>
                      </div>
                      {notes[v.verse] && <Pencil size={12} className="text-[var(--color-primary)] inline ml-2 drop-shadow-neon" />}

                      {/* Inline Commentary & Notes (Visible when sidebar is closed OR in Reader Mode) */}
                      {(isReaderMode || !isSidebarOpen) && selectedVerses.includes(v.verse) && selectedVerses.length === 1 && (
                        <div className="mt-6 mb-2 animate-fade-in pl-0 md:pl-4 space-y-4">
                          {commentaries[v.verse] && (
                            <div className="glass-card rounded-2xl p-5 bg-white/5 border border-white/5">
                              <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)] font-bold mb-3 block">Imperial Commentary</span>
                              <div className="markdown-body text-sm text-[var(--color-text)] leading-relaxed">
                                <Markdown 
                                  components={{
                                    p: ({children}) => <p className="mb-2"><LinkifiedText text={String(children)} /></p>,
                                    span: ({children}) => <span><LinkifiedText text={String(children)} /></span>
                                  }}
                                >
                                  {commentaries[v.verse]}
                                </Markdown>
                              </div>
                            </div>
                          )}
                          {notes[v.verse] && (
                            <div className="glass-card rounded-2xl p-5 bg-white/5 border border-white/5">
                              <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)] font-bold mb-3 block">My Reflection</span>
                              <p className="text-sm italic text-[var(--color-text)] leading-relaxed">
                                <LinkifiedText text={notes[v.verse]} />
                              </p>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); openNote(v.verse); }}
                                 className="mt-4 text-[10px] font-bold text-[var(--color-primary)] uppercase hover:underline flex items-center gap-1"
                              >
                                <PenTool size={10} /> Edit Reflection
                              </button>
                            </div>
                          )}

                          {/* Linked Articles */}
                          {verseArticles[v.verse] && (
                            <div className="space-y-3 mt-4">
                              <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold block ml-1 mb-2">Related Articles</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {verseArticles[v.verse].map(art => (
                                  <Link key={art.id} to={`/articles/${art.id}`} className="block glass-card p-4 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-2xl transition-all group/art">
                                     <h4 className="text-sm font-bold text-white mb-1 group-hover/art:text-blue-300 transition-colors uppercase tracking-tight">{art.title}</h4>
                                     <div className="flex items-center justify-between mt-2">
                                       <span className="text-[9px] text-white/30 uppercase tracking-widest">Article Study</span>
                                       <ChevronRight size={12} className="text-blue-400 group-hover/art:translate-x-1 transition-transform" />
                                     </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {!commentaries[v.verse] && !notes[v.verse] && !verseArticles[v.verse] && (
                            <div className="py-6 text-center rounded-2xl bg-white/5 border border-dashed border-white/10 text-[10px] uppercase tracking-widest opacity-40">
                              No study materials found for this verse.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Chapter Completion Button */}
                  <div className="mt-20 pt-10 border-t border-white/5 text-center px-4">
                    <p className="text-sm text-[var(--color-text-muted)] mb-6 font-serif italic">
                      "I have hidden your word in my heart that I might not sin against you." — Psalm 119:11
                    </p>
                    <button 
                      onClick={markChapterComplete}
                      disabled={isChapterFinished}
                      className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all active-press shadow-2xl ${
                        isChapterFinished
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-[var(--color-primary)] text-[var(--color-background)] hover:scale-105 shadow-neon-glow'
                      }`}
                    >
                      {isChapterFinished ? (
                        <><CheckCircle2 size={20} /> Chapter Completed</>
                      ) : (
                        <>Mark Chapter as Read</>
                      )}
                    </button>
                    
                    <div className="mt-12 flex items-center justify-center gap-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                       <div className="w-12 h-px bg-[var(--color-border-subtle)]" />
                       Next: {currentChapter < (BIBLE_BOOKS.find(b => b.name === currentBook)?.chapters || 0) 
                           ? `${currentBook} ${currentChapter + 1}` 
                           : BIBLE_BOOKS[BIBLE_BOOKS.findIndex(b => b.name === currentBook) + 1]?.name + ' 1'}
                       <div className="w-12 h-px bg-[var(--color-border-subtle)]" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Draggable Resizer */}
            {isSplitView && (
              <div 
                className="flex w-full md:w-1 h-1 md:h-auto bg-white/10 hover:bg-[var(--color-primary)]/50 cursor-row-resize md:cursor-col-resize items-center justify-center transition-colors group z-[45]"
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
              >
                <div className="w-8 md:w-1 h-1 md:h-8 bg-white/20 rounded-full group-hover:bg-white/60"></div>
              </div>
            )}

            {/* Split Pane */}
            {isSplitView && (
              <div 
                className="bible-scroll-container bg-transparent p-4 md:p-8 pt-24 md:pt-28 overflow-y-auto relative transition-all duration-500"
                style={{ flexBasis: `${100 - splitRatio}%`, flexGrow: 1, flexShrink: 0 }}
              >
                <div className="pb-10 mb-10">
                   <div className="flex items-center justify-between">
                      <div>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)] font-bold font-sans glow-text">Comparison View</span>
                          <h2 className="text-3xl md:text-4xl font-serif text-[var(--color-text)] tracking-tight mt-2">
                            {rightBook} <span className="text-[var(--color-primary)]">{rightChapter}</span>
                          </h2>
                      </div>
                      <div className="flex items-center gap-3 mb-8 px-4 pt-4">
          <BookOpen className="text-[var(--color-primary)] drop-shadow-neon w-8 h-8" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-white">Bible Reader</h1>
            <p className="text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest mt-1">Immersive study and contemplation of scripture.</p>
          </div>
        </div>
        <div className="flex gap-2">
                        <button 
                          onClick={() => setActiveSelector('rightBook')}
                          className="bg-white/5 rounded-full px-3 py-1 text-xs text-white transition-all font-bold"
                        >
                          Change Passage
                        </button>
                        <select 
                          value={rightTranslation}
                          onChange={(e) => setRightTranslation(e.target.value)}
                          className="bg-white/5 rounded-full px-3 py-1 text-xs text-white outline-none cursor-pointer transition-all"
                        >
                          {BIBLE_TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
                        </select>
                      </div>
                   </div>
                </div>

                {rightLoading ? (
                  <div className="text-center py-12 opacity-50 animate-pulse">Loading comparison...</div>
                ) : (
                  <div className={`space-y-4 ${settings.fontFamily} ${settings.fontSize} ${settings.lineSpacing || 'leading-8'} ${settings.textAlignment || 'text-left'} text-[var(--color-text)] pb-32`}>
                    {rightVerses.map(v => (
                      <div key={v.verse} className="p-2 md:p-3 rounded-2xl hover:bg-white/5 transition-all">
                        <span className="text-[11px] font-bold text-[var(--color-primary)] mr-2 align-super font-sans">{v.verse}</span>
                        <span>{v.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - Commentaries, Notes */}
          {isSidebarOpen && !isReaderMode && (
            <div className={`glass-panel w-full lg:w-80 h-full overflow-y-auto transition-all duration-500 animate-slide-in-right absolute md:relative z-[60] md:z-auto bg-[var(--color-surface)] md:bg-transparent shadow-2xl md:shadow-none`}>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden absolute top-4 right-4 p-2.5 bg-white/10 rounded-full text-white/70 hover:text-white backdrop-blur-md z-10"
              >
                <X size={20} />
              </button>
              <div className="p-6 space-y-8 mt-4 md:mt-0">
                  <>
                    <div>
                      <h3 className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-primary)] font-bold mb-6 flex items-center gap-2">
                        <Bookmark size={14} /> Imperial Commentary
                      </h3>
                      {activeVerse ? (
                        commentaries[activeVerse] ? (
                          <div className="glass-card rounded-2xl p-5 bg-[var(--color-primary)]/5">
                            <div className="markdown-body text-sm text-[var(--color-text)] leading-relaxed">
                              <Markdown
                                components={{
                                  p: ({children}) => <p><LinkifiedText text={String(children)} /></p>,
                                  span: ({children}) => <span><LinkifiedText text={String(children)} /></span>
                                }}
                              >
                                {commentaries[activeVerse]}
                              </Markdown>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 text-center glass-panel rounded-2xl text-white/30 text-xs py-12">
                             No theological commentary for verse {activeVerse}
                          </div>
                        )
                      ) : (
                        <div className="p-8 text-center glass-panel rounded-2xl text-white/30 text-xs py-12">
                           Select a verse to explore deep insights
                        </div>
                      )}
                    </div>

                    <div>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-primary)] font-bold mb-6 flex items-center gap-2">
                        <Pencil size={14} /> My Notes
                      </h3>
                      {activeVerse ? (
                        notes[activeVerse] ? (
                          <div className="glass-card rounded-2xl p-5 bg-white/5">
                             <div className="text-sm italic text-[var(--color-text)] leading-relaxed line-clamp-6">
                               "<LinkifiedText text={notes[activeVerse]} />"
                             </div>
                             <button 
                               onClick={() => openNote(activeVerse)}
                               className="mt-4 w-full py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl text-[10px] font-bold uppercase hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition-all"
                             >Edit Note</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => openNote(activeVerse)}
                            className="w-full py-6 border-2 border-dashed border-white/5 rounded-2xl text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] transition-all flex flex-col items-center gap-2"
                          >
                             <Pencil size={16} />
                             <span className="text-xs font-medium">Write Reflection</span>
                          </button>
                        )
                      ) : (
                        <div className="p-8 text-center glass-panel rounded-2xl border-dashed border border-white/10 text-white/30 text-xs py-12">
                           Personal reflections appear here
                        </div>
                      )}
                    </div>
                  </>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Bottom Control Bar (Pill Mode) */}
      {!isReaderMode && (
        <div className={`fixed md:bottom-8 bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ${isBottomBarVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <div className="glass-panel rounded-full px-4 py-2 md:px-6 md:py-3 shadow-2xl backdrop-blur-3xl flex items-center gap-3 md:gap-6 bg-[var(--color-surface)]/95 border border-white/20">
            {/* Mobile Nav & Verses Count */}
            <div className="flex items-center gap-2 md:gap-3">
               <div className="flex items-center gap-1 md:hidden">
                  <button onClick={() => setCurrentChapter(Math.max(1, currentChapter - 1))} className="p-1.5 rounded-full hover:text-[var(--color-primary)] hover:bg-white/10 transition">
                     <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setCurrentChapter(currentChapter + 1)} className="p-1.5 rounded-full hover:text-[var(--color-primary)] hover:bg-white/10 transition">
                     <ChevronRight size={18} />
                  </button>
               </div>
               
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--color-background)] px-3 py-1 bg-[var(--color-primary)] rounded-full uppercase tracking-widest min-w-[70px] text-center shadow-neon-glow shrink-0">
                    {selectedVerses.length === 1 ? `V. ${selectedVerses[0]}` : `${selectedVerses.length} SEL.`}
                  </span>
                  <button 
                    onClick={() => setSelectedVerses([])}
                    className="p-1.5 rounded-full hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                    title="Clear Selection"
                  >
                    <X size={14} />
                  </button>
               </div>
            </div>

            <div className="w-px h-6 bg-white/10" />
            
            {/* Contextual Actions */}
            <div className="flex items-center gap-2 md:gap-4 transition-all duration-300">
               <button 
                  onClick={() => {
                    if (selectedVerses.length > 0) {
                      const selectedTexts = verses
                        .filter(v => selectedVerses.includes(v.verse))
                        .map(v => `${v.verse}. ${v.text}`)
                        .join('\n');
                      const citation = selectedVerses.length === 1 
                        ? `${currentBook} ${currentChapter}:${selectedVerses[0]}`
                        : `${currentBook} ${currentChapter}:${Math.min(...selectedVerses)}-${Math.max(...selectedVerses)}`;
                      
                      navigator.clipboard.writeText(`${citation}\n\n${selectedTexts}`);
                      setShowCopiedToast(true);
                      setTimeout(() => setShowCopiedToast(false), 2000);
                    }
                  }}
                  className="p-2 rounded-full hover:text-[var(--color-primary)] hover:bg-white/5 transition outline-none relative"
                  title="Copy Selection"
               >
                 <Copy size={18} />
                 {showCopiedToast && (
                   <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--color-primary)] text-white text-[10px] font-bold rounded animate-fade-in shadow-neon">
                     Copied!
                   </div>
                 )}
               </button>

               <button 
                  onClick={() => {
                     if (selectedVerses.length > 0 && navigator.share) {
                        const citation = selectedVerses.length === 1 
                          ? `${currentBook} ${currentChapter}:${selectedVerses[0]}`
                          : `${currentBook} ${currentChapter}:${Math.min(...selectedVerses)}-${Math.max(...selectedVerses)}`;
                        
                        const selectedTexts = verses
                          .filter(v => selectedVerses.includes(v.verse))
                          .map(v => `${v.verse}. ${v.text}`)
                          .join('\n');

                        navigator.share({
                          title: citation,
                          text: `${citation}\n\n${selectedTexts}`,
                        }).catch(console.error);
                     }
                  }}
                  className="p-2 rounded-full hover:text-[var(--color-primary)] hover:bg-white/5 transition outline-none"
                  title="Share Selection"
               >
                 <Share2 size={18} />
               </button>

               <div className="relative">
                 <button 
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="p-2 rounded-full hover:text-[var(--color-primary)] hover:bg-white/5 transition outline-none flex items-center gap-1"
                    title="Highlight Selection"
                 >
                   <Bookmark size={18} style={{ 
                     fill: selectedVerses.length === 1 ? (highlights[selectedVerses[0]] || 'transparent') : 'transparent', 
                     color: selectedVerses.length === 1 ? (highlights[selectedVerses[0]] || 'currentColor') : 'currentColor' 
                   }} />
                 </button>

                 {showColorPicker && (
                   <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 glass-panel rounded-full p-2 shadow-2xl flex gap-2 animate-slide-up border border-[var(--color-primary)]/30 backdrop-blur-xl z-50">
                     {HIGHLIGHT_COLORS.map(color => (
                       <button
                        key={color.id}
                        onClick={() => {
                          selectedVerses.forEach(vNum => setHighlight(vNum, color.value));
                          setShowColorPicker(false);
                        }}
                        className="w-7 h-7 rounded-full border border-white/20 transition-transform hover:scale-125 hover:shadow-neon"
                        style={{ backgroundColor: color.value === 'transparent' ? 'rgba(255,255,255,0.1)' : color.value }}
                        title={color.label}
                       >
                         {color.id === 'none' && <span className="text-[10px] text-white/50">×</span>}
                       </button>
                     ))}
                   </div>
                 )}
               </div>

               {selectedVerses.length === 1 && (
                 <>
                   <button 
                      onClick={() => openNote(selectedVerses[0])}
                      className="p-2 rounded-full hover:text-[var(--color-primary)] hover:bg-white/5 transition outline-none"
                      title="Study Note"
                   >
                     <Pencil size={18} />
                   </button>
                 </>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Note Edit Modal */}
      {isNoteDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card rounded-[2rem] p-8 w-full max-w-lg shadow-2xl animate-slide-down">
            <h3 className="font-serif text-2xl font-bold mb-6 text-[var(--color-text)] flex items-center gap-3">
               <Pencil className="text-[var(--color-primary)]" /> Note on v{activeVerse}
            </h3>
            <div className="mb-4 text-xs text-[var(--color-text-muted)] italic">
               Personal reflection on {currentBook} {currentChapter}:{activeVerse}
            </div>
            <textarea
              className="w-full h-40 p-4 rounded-xl glass-panel text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] mb-6 text-base resize-none"
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              placeholder="Write your reflection here..."
            />
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <div className="text-[10px] text-[var(--color-text-muted)]">
                Note autosaves automatically.
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsNoteDrawerOpen(false)}
                  className="px-6 py-2.5 font-semibold text-sm rounded-full bg-white/10 hover:bg-white/20 text-[var(--color-text)] transition-all"
                >Cancel</button>
                <button 
                  onClick={() => saveNote()}
                  className="px-6 py-2.5 font-bold text-sm rounded-full bg-[var(--color-primary)] text-[var(--color-background)] hover:scale-105 active:scale-95 transition-all shadow-neon-glow"
                >Save Note</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector Modals */}
      {activeSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col rounded-[2.5rem] shadow-2xl animate-slide-up overflow-hidden">
             {/* Modal Header */}
             <div className="p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                   {activeSelector !== 'book' && activeSelector !== 'rightBook' && activeSelector !== 'translation' && (
                     <button 
                        onClick={() => setActiveSelector(activeSelector === 'rightChapter' ? 'rightBook' : 'book')}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-[var(--color-primary)]"
                     >
                        <ChevronLeft size={20} />
                     </button>
                   )}
                   <h3 className="text-xl font-serif font-bold text-white capitalize">
                      {activeSelector === 'book' || activeSelector === 'rightBook' ? 'Select Book' : 
                       activeSelector === 'chapter' || activeSelector === 'rightChapter' ? `${selectorData.book}: Select Chapter` : 
                       'Select Translation'}
                   </h3>
                </div>
                <button 
                   onClick={() => { setActiveSelector(null); setSelectorData({}); }}
                   className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                   <X size={20} />
                </button>
             </div>

             {/* Modal Body */}
             <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {(activeSelector === 'book' || activeSelector === 'rightBook') && (
                  <div className="space-y-8">
                     <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input 
                           type="text" 
                           placeholder="Search books..."
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[var(--color-primary)]/50 transition-all font-sans"
                           autoFocus
                        />
                     </div>
                     
                     {searchQuery === '' ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                             <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-primary)] mb-4 ml-2">Old Testament</h4>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {BIBLE_BOOKS.filter(b => BIBLE_BOOKS.indexOf(b) < 39).map(book => (
                                  <button 
                                     key={book.name}
                                     onClick={() => handleBookSelect(book.name)}
                                     className="px-3 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition-all text-xs font-medium text-left truncate group"
                                  >
                                     <span className="opacity-40 mr-1 group-hover:opacity-100">{BIBLE_BOOKS.indexOf(book) + 1}</span> {book.name}
                                  </button>
                                ))}
                             </div>
                          </div>
                          <div>
                             <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-primary)] mb-4 ml-2">New Testament</h4>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {BIBLE_BOOKS.filter(b => BIBLE_BOOKS.indexOf(b) >= 39).map(book => (
                                  <button 
                                     key={book.name}
                                     onClick={() => handleBookSelect(book.name)}
                                     className="px-3 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition-all text-xs font-medium text-left truncate group"
                                  >
                                     <span className="opacity-40 mr-1 group-hover:opacity-100">{BIBLE_BOOKS.indexOf(book) + 1}</span> {book.name}
                                  </button>
                                ))}
                             </div>
                          </div>
                       </div>
                     ) : (
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {filteredBooks.map(book => (
                             <button 
                                key={book.name}
                                onClick={() => handleBookSelect(book.name)}
                                className="px-3 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition-all text-sm font-medium text-left truncate"
                             >
                                {book.name}
                             </button>
                          ))}
                       </div>
                     )}
                  </div>
                )}

                {(activeSelector === 'chapter' || activeSelector === 'rightChapter') && (
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                     {[...Array(BIBLE_BOOKS.find(b => b.name === selectorData.book)?.chapters || 0)].map((_, i) => (
                       <button 
                          key={i+1}
                          onClick={() => handleChapterSelect(i+1)}
                          className="aspect-square flex items-center justify-center rounded-xl border border-white/5 bg-white/5 hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition-all text-sm font-bold font-sans"
                       >
                          {i+1}
                       </button>
                     ))}
                  </div>
                )}

                {activeSelector === 'translation' && (
                   <div className="grid gap-3">
                      {BIBLE_TRANSLATIONS.map(t => (
                         <button 
                            key={t.id}
                            onClick={() => { updateSetting('bibleTranslation', t.id); setActiveSelector(null); }}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${translation === t.id ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] shadow-neon-glow' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                         >
                            <div className="text-left">
                               <div className="font-bold flex items-center gap-2">
                                  {t.id} {t.isNTOnly && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-[var(--color-primary)] tracking-widest font-bold">NT ONLY</span>}
                               </div>
                               <div className="text-xs text-white/50">{t.name}</div>
                            </div>
                            {translation === t.id && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-neon"></div>}
                         </button>
                      ))}
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-[var(--color-primary)]/30 text-center animate-slide-down">
            <div className="w-16 h-16 bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-neon-glow">
              <LogIn className="text-[var(--color-primary)]" size={32} />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-4">Sign In Required</h3>
            <p className="text-[var(--color-text-muted)] mb-8">
              You need an account to highlight verses and save study notes. It's free and takes seconds!
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/profile')}
                className="w-full py-3 font-bold rounded-full bg-[var(--color-primary)] text-[var(--color-surface)] hover:scale-105 active:scale-95 transition-all shadow-neon-glow"
              >Go to Sign In</button>
              <button 
                onClick={() => setShowAuthPrompt(false)}
                className="w-full py-3 font-semibold rounded-full bg-white/10 hover:bg-white/20 text-[var(--color-text)] transition-all"
              >Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {/* Root Study Modal */}
      <AnimatePresence>
        {activeRootStudy && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative border border-white/10"
            >
              <button 
                onClick={() => setActiveRootStudy(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[var(--color-primary)]/10 rounded-2xl text-[var(--color-primary)]">
                  <Brain size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-white tracking-tight">Root Significance</h3>
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/30">Elects Biblical Study • {activeRootStudy.word}</p>
                </div>
              </div>

              {activeRootStudy.isLoading ? (
                <div className="py-12 flex flex-col items-center gap-4 text-white/40">
                  <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
                  <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing Hebrew & Greek...</span>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="markdown-body text-[var(--color-text)] leading-relaxed font-serif">
                      <Markdown>{activeRootStudy.details}</Markdown>
                   </div>
                   <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                      <button 
                        onClick={copyRootDetails}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border transition-all text-xs font-bold ${
                          copiedRoot 
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' 
                          : 'border-white/10 bg-white/5 text-[var(--color-text-muted)] hover:text-white hover:border-white/20'
                        }`}
                      >
                        {copiedRoot ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Insight</>}
                      </button>
                      <button 
                        onClick={() => setActiveRootStudy(null)}
                        className="px-8 py-3 bg-[var(--color-primary)] text-[var(--color-background)] rounded-full font-bold shadow-neon-glow hover:scale-110 active:scale-95 transition-all text-sm"
                      >
                        Pondered
                      </button>
                   </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Meditation Toggle (Corner) */}
      <button 
        onClick={() => setIsMeditationMode(!isMeditationMode)}
        className={`fixed bottom-6 right-6 z-[1100] p-4 rounded-full shadow-2xl transition-all active:scale-95 duration-500 ${isMeditationMode ? 'bg-[var(--color-primary)] text-[var(--color-background)] shadow-neon-glow' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
        title="Toggle Focus Mode (Cmd+M)"
      >
        {isMeditationMode ? <EyeOff size={24} /> : <Eye size={24} />}
      </button>
    </div>
  );
}
