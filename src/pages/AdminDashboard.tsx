import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAutosave } from '../hooks/useAutosave';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, CalendarDays, FileText, BookMarked, ListChecks, Users, ShieldAlert, Trash2, Mic, GraduationCap, Database, Sparkles, Loader2 } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';

interface ManagementListProps {
  table: string;
  loadingItems: boolean;
  items: any[];
  onEdit: (item: any) => void;
  onDelete: (table: string, id: string) => void;
}

const ManagementList = ({ table, loadingItems, items, onEdit, onDelete }: ManagementListProps) => (
  <div className="space-y-4">
    {loadingItems ? (
      <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--color-primary)]" size={32} /></div>
    ) : items.length === 0 ? (
      <div className="text-center p-12 text-white/20 italic">No records found in the library.</div>
    ) : (
      <div className="grid gap-4">
        {items.map(item => (
          <div key={item.id} className="glass-panel p-6 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-[var(--color-primary)]/30 transition-all">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-white text-lg">
                {item.title || item.DisplayName || item.name || (item.book ? `${item.book} ${item.chapter || ''}${item.verse ? ':' + item.verse : ''}` : 'Untitled')}
              </h3>
              <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest text-white/30">
                <span>ID: {item.id.slice(0, 8)}...</span>
                {item.created_at && (
                  <>
                    <span>•</span>
                    <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                  </>
                )}
                {item.category && (
                  <>
                    <span>•</span>
                    <span className="text-[var(--color-primary)]">{item.category}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onEdit(item)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10"
              >
                Edit
              </button>
              <button 
                onClick={() => onDelete(table, item.id)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/10"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default function AdminDashboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'commentary' | 'devotional' | 'article' | 'ebook' | 'video' | 'sermon' | 'music' | 'event' | 'user' | 'intros' | 'summaries' | 'jpw' | 'plans' | 'mod' | 'study-guides' | 'collections' | 'system' | null>('commentary');
  const [subTab, setSubTab] = useState<'create' | 'manage'>('create');
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Collections State
  const [collectionTitle, setCollectionTitle] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');
  const [collectionType, setCollectionType] = useState<'playlist' | 'series'>('series');
  const [collectionContentType, setCollectionContentType] = useState<'sermon' | 'article' | 'music' | 'video' | 'mixed'>('sermon');
  const [collectionImageUrl, setCollectionImageUrl] = useState('');
  const [currentCollectionItems, setCurrentCollectionItems] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [searchItemTerm, setSearchItemTerm] = useState('');

  // Books/Commentary State
  const [book, setBook] = useState('Genesis');
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);
  const [commentaryContent, setCommentaryContent] = useState('');
  const [introContent, setIntroContent] = useState('');
  const [summaryChapter, setSummaryChapter] = useState(1);
  const [summaryContent, setSummaryContent] = useState('');

  // Article State
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleVerseBook, setArticleVerseBook] = useState('Genesis');
  const [articleVerseChapter, setArticleVerseChapter] = useState(1);
  const [articleVerseVerse, setArticleVerseVerse] = useState(1);
  const [relatedVerses, setRelatedVerses] = useState<{book: string, chapter: number, verse: number}[]>([]);

  // Devotional State
  const [devoTitle, setDevoTitle] = useState('');
  const [devoContent, setDevoContent] = useState('');
  const [devoDate, setDevoDate] = useState('');

  // Ebook State
  const [ebookTitle, setEbookTitle] = useState('');
  const [ebookAuthor, setEbookAuthor] = useState('');
  const [ebookCover, setEbookCover] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterOrder, setChapterOrder] = useState(1);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [selectedEbookId, setSelectedEbookId] = useState('');

  // Video State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDescription, setVideoDescription] = useState('');

  // Sermon State
  const [sermonTitle, setSermonTitle] = useState('');
  const [sermonPreacher, setSermonPreacher] = useState('');
  const [sermonSeries, setSermonSeries] = useState('');
  const [sermonSpotifyId, setSermonSpotifyId] = useState('');
  const [sermonDesc, setSermonDesc] = useState('');
  const [sermonDate, setSermonDate] = useState(new Date().toISOString().split('T')[0]);

  // Music State
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [musicAlbum, setMusicAlbum] = useState('');
  const [musicSpotifyId, setMusicSpotifyId] = useState('');
  const [musicGenre, setMusicGenre] = useState('');

  // Event State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  // Prophetic Words State
  const [jpwTitle, setJpwTitle] = useState('');
  const [jpwContent, setJpwContent] = useState('');
  const [jpwBook, setJpwBook] = useState('Genesis');
  const [jpwChapter, setJpwChapter] = useState(1);
  const [jpwVerse, setJpwVerse] = useState(1);

  // Study Guides State
  const [guideTitle, setGuideTitle] = useState('');
  const [guideSubtitle, setGuideSubtitle] = useState('');
  const [guideCategory, setGuideCategory] = useState('');
  const [guideReadTime, setGuideReadTime] = useState('');
  const [guideDifficulty, setGuideDifficulty] = useState('Introductory');
  const [guideRating, setGuideRating] = useState(5.0);
  const [guideImage, setGuideImage] = useState('');
  const [guideEbookId, setGuideEbookId] = useState('');

  // Reading Plans State
  const [planTitle, setPlanTitle] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planDays, setPlanDays] = useState(30);
  const [planColor, setPlanColor] = useState('bg-blue-500');
  const [planReadings, setPlanReadings] = useState<{day: number, book: string, chapter: number}[]>([]);
  const [planReadingDay, setPlanReadingDay] = useState(1);
  const [planReadingBook, setPlanReadingBook] = useState('Genesis');
  const [planReadingChapter, setPlanReadingChapter] = useState(1);

  const fetchItems = async (table: string) => {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setItems(data);
      if (error) console.error(error);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (subTab === 'manage' && activeTab) {
      const tableMap: any = {
        'article': 'articles',
        'devotional': 'devotionals',
        'sermon': 'sermons',
        'music': 'music',
        'video': 'videos',
        'event': 'events',
        'study-guides': 'study_guides',
        'plans': 'reading_plans',
        'jpw': 'prophetic_words',
        'ebook': 'ebooks',
        'commentary': 'commentaries',
        'intros': 'book_intros',
        'summaries': 'chapter_summaries',
        'collections': 'collections'
      };
      const table = tableMap[activeTab];
      if (table) fetchItems(table);
    }
  }, [activeTab, subTab]);

  const deleteItem = async (table: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      setItems(items.filter(item => item.id !== id));
    } else {
      alert('Error deleting item');
    }
  };

  const editItem = (item: any) => {
    setEditId(item.id);
    setSubTab('create');
    
    // Switch through active tabs to populate form
    switch (activeTab) {
      case 'commentary':
        setBook(item.book);
        setChapter(item.chapter);
        setVerse(item.verse);
        setCommentaryContent(item.content);
        break;
      case 'intros':
        setBook(item.book);
        setIntroContent(item.content);
        break;
      case 'summaries':
        setBook(item.book);
        setSummaryChapter(item.chapter);
        setSummaryContent(item.content);
        break;
      case 'article':
        setArticleTitle(item.title);
        setArticleContent(item.content);
        setRelatedVerses(item.related_verses || []);
        break;
      case 'devotional':
        setDevoTitle(item.title);
        setDevoContent(item.content);
        setDevoDate(item.date || '');
        break;
      case 'sermon':
        setSermonTitle(item.title);
        setSermonPreacher(item.preacher);
        setSermonSeries(item.series || '');
        setSermonSpotifyId(item.embed_id);
        setSermonDesc(item.description || '');
        setSermonDate(item.date || '');
        break;
      case 'music':
        setMusicTitle(item.title);
        setMusicArtist(item.artist);
        setMusicAlbum(item.album || '');
        setMusicSpotifyId(item.embed_id);
        setMusicGenre(item.genre || '');
        break;
      case 'video':
        setVideoTitle(item.title);
        setVideoUrl(item.url);
        setVideoDescription(item.description || '');
        break;
      case 'event':
        setEventTitle(item.title);
        setEventDate(item.date || '');
        setEventDescription(item.description || '');
        break;
      case 'collections':
        setCollectionTitle(item.title);
        setCollectionDesc(item.description || '');
        setCollectionType(item.type);
        setCollectionContentType(item.content_type);
        setCollectionImageUrl(item.image_url || '');
        fetchCollectionItems(item.id);
        break;
      case 'study-guides':
        setGuideTitle(item.title);
        setGuideSubtitle(item.subtitle);
        setGuideCategory(item.category || '');
        setGuideReadTime(item.read_time || '');
        setGuideDifficulty(item.difficulty || 'Introductory');
        setGuideRating(item.rating || 5.0);
        setGuideImage(item.image_url || '');
        setGuideEbookId(item.ebook_id || '');
        break;
    }
  };


  const [stats, setStats] = useState({
    users: 0,
    articles: 0,
    sermons: 0,
    plans: 0,
    groups: 0,
    commentaries: 0
  });

  const fetchStats = async () => {
    const [
      { count: uCount },
      { count: aCount },
      { count: sCount },
      { count: pCount },
      { count: gCount },
      { count: cCount }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      supabase.from('sermons').select('*', { count: 'exact', head: true }),
      supabase.from('reading_plans').select('*', { count: 'exact', head: true }),
      supabase.from('study_groups').select('*', { count: 'exact', head: true }),
      supabase.from('commentaries').select('*', { count: 'exact', head: true })
    ]);

    setStats({
      users: uCount || 0,
      articles: aCount || 0,
      sermons: sCount || 0,
      plans: pCount || 0,
      groups: gCount || 0,
      commentaries: cCount || 0
    });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setItems(items.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure? This will remove the user from the Empire registry.')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (!error) {
      setItems(items.filter(u => u.id !== userId));
    }
  };

  const fetchUsers = async () => {
    setLoadingItems(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoadingItems(false);
  };

  const fetchThreads = async () => {
    setLoadingItems(true);
    const { data } = await supabase.from('threads').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoadingItems(false);
  };

  useEffect(() => {
    if (activeTab === 'user') {
      fetchUsers();
      const channel = supabase.channel('public:profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers()).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
    if (activeTab === 'mod') {
      fetchThreads();
      const channel = supabase.channel('public:threads').on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, () => fetchThreads()).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeTab]);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      alert(`User role updated to ${newRole}`);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteThread = async (threadId: string) => {
    if (!confirm('Permanently delete this thread and its contents?')) return;
    try {
      await supabase.from('threads').delete().eq('id', threadId);
    } catch (err) {
      console.error(err);
    }
  };


  const addPlanReading = () => {
    setPlanReadings([...planReadings, { day: planReadingDay, book: planReadingBook, chapter: planReadingChapter }]);
  };

  const removePlanReading = (index: number) => {
    setPlanReadings(planReadings.filter((_, i) => i !== index));
  };

  const saveReadingPlan = async () => {
    if (!planTitle || !planDesc) { alert('Fill in title and description.'); return; }
    setIsSaving(true);
    try {
      const data = {
        title: planTitle,
        description: planDesc,
        duration_days: Number(planDays),
        color: planColor,
        readings: planReadings,
        updated_at: new Date().toISOString()
      };
      if (editId) {
        await supabase.from('reading_plans').update(data).eq('id', editId);
      } else {
        await supabase.from('reading_plans').insert({ ...data, created_at: new Date().toISOString() });
      }
      alert(editId ? 'Reading plan updated!' : 'Reading plan created!');
      setPlanTitle(''); setPlanDesc(''); setPlanReadings([]);
      setEditId(null);
      if (subTab === 'manage') fetchItems('reading_plans');
    } catch (err) {
      console.error(err);
      alert('Error saving reading plan');
    } finally {
      setIsSaving(false);
    }
  };


  // Autosave Article
  useAutosave({ articleTitle, articleContent, relatedVerses }, async (data) => {
    if (!data.articleTitle || !data.articleContent || !user) return;
    await supabase.from('drafts').upsert({
       id: 'article',
       user_id: user.id,
       data,
       updated_at: new Date().toISOString()
    });
  }, 2000);

  // Autosave Commentary
  useAutosave({ book, chapter, verse, commentaryContent }, async (data) => {
    if (!data.commentaryContent || !user) return;
    const id = `${data.book}_${data.chapter}_${data.verse}`.replace(/\s+/g, '_');
    await supabase.from('drafts').upsert({
       id: 'commentary_' + id,
       user_id: user.id,
       data,
       updated_at: new Date().toISOString()
    });
  }, 2000);

  // Autosave Book Intro
  useAutosave({ book, introContent }, async (data) => {
    if (!data.introContent || !user) return;
    const id = data.book.replace(/\s+/g, '_');
    await supabase.from('drafts').upsert({
       id: 'intro_' + id,
       user_id: user.id,
       data,
       updated_at: new Date().toISOString()
    });
  }, 2000);

  // Autosave Chapter Summary
  useAutosave({ book, summaryChapter, summaryContent }, async (data) => {
    if (!data.summaryContent || !user) return;
    const id = `${data.book}_${data.summaryChapter}`.replace(/\s+/g, '_');
    await supabase.from('drafts').upsert({
       id: 'summary_' + id,
       user_id: user.id,
       data,
       updated_at: new Date().toISOString()
    });
  }, 2000);


  // Autosave Devotional
  useAutosave({ devoTitle, devoContent, devoDate }, async (data) => {
    if (!data.devoTitle || !data.devoContent || !user) return;
    await supabase.from('drafts').upsert({
       id: 'devo',
       user_id: user.id,
       data,
       updated_at: new Date().toISOString()
    });
  }, 2000);

  const addRelatedVerse = () => {
    setRelatedVerses([...relatedVerses, { book: articleVerseBook, chapter: articleVerseChapter, verse: articleVerseVerse }]);
  };

  const removeRelatedVerse = (index: number) => {
    setRelatedVerses(relatedVerses.filter((_, i) => i !== index));
  };
  
  useEffect(() => {
    const fetchEbooks = async () => {
        const { data } = await supabase.from('ebooks').select('*');
        if (data) setEbooks(data);
    };
    fetchEbooks();
  }, []);
  

  const saveStudyGuide = async () => {
    if (!guideTitle || !guideSubtitle) { alert('Title and subtitle are required.'); return; }
    try {
      await supabase.from('study_guides').insert({
        title: guideTitle,
        subtitle: guideSubtitle,
        category: guideCategory,
        read_time: guideReadTime,
        difficulty: guideDifficulty,
        rating: guideRating,
        image_url: guideImage,
        ebook_id: guideEbookId,
        created_at: new Date().toISOString()
      });
      alert('Study Guide archived!');
      setGuideTitle(''); setGuideSubtitle(''); setGuideCategory(''); setGuideReadTime(''); setGuideImage(''); setGuideEbookId('');
    } catch (err) {
      console.error(err);
      alert('Error saving study guide.');
    }
  };

  
  const saveCommentary = async () => { 
    if (!commentaryContent) return;
    const id = `${book}_${chapter}_${verse}`.replace(/\s+/g, '_');
    await supabase.from('commentaries').upsert({ id, book, chapter, verse, content: commentaryContent, author_id: user?.id, updated_at: new Date().toISOString() });
    alert('Commentary saved!'); 
    setCommentaryContent(''); 
  };
  
  const saveBookIntro = async () => {
    if (!introContent) return;
    const id = book.replace(/\s+/g, '_');
    await supabase.from('book_intros').upsert({ id, book, content: introContent, updated_at: new Date().toISOString() });
    alert('Book Introduction saved!');
    setIntroContent('');
  };

  const saveChapterSummary = async () => {
    if (!summaryContent) return;
    const id = `${book}_${summaryChapter}`.replace(/\s+/g, '_');
    await supabase.from('chapter_summaries').upsert({ id, book, chapter: summaryChapter, content: summaryContent, updated_at: new Date().toISOString() });
    alert('Chapter Summary saved!');
    setSummaryContent('');
  };

  const saveDevotional = async () => { 
    if (!devoTitle || !devoContent) return;
    setIsSaving(true);
    try {
      const data = {
        title: devoTitle,
        content: devoContent,
        date: devoDate,
        updated_at: new Date().toISOString()
      };

      if (editId) {
        await supabase.from('devotionals').update(data).eq('id', editId);
      } else {
        await supabase.from('devotionals').insert({ ...data, created_at: new Date().toISOString() });
      }

      alert(editId ? 'Devotional updated!' : 'Devotional published!'); 
      setDevoTitle(''); setDevoContent(''); setDevoDate(''); setEditId(null);
      if (subTab === 'manage') fetchItems('devotionals');
    } catch (err) {
      console.error(err);
      alert('Error saving devotional');
    } finally {
      setIsSaving(false);
    }
  };
  
  const saveArticle = async () => { 
    if (!articleTitle || !articleContent) return;
    setIsSaving(true);
    try {
      const data = { 
        title: articleTitle, 
        content: articleContent, 
        related_verses: relatedVerses, 
        author_id: user?.id, 
        updated_at: new Date().toISOString() 
      };

      if (editId) {
        await supabase.from('articles').update(data).eq('id', editId);
      } else {
        await supabase.from('articles').insert({ ...data, created_at: new Date().toISOString() });
      }

      alert(editId ? 'Article updated!' : 'Article published!'); 
      setArticleTitle(''); 
      setArticleContent('');
      setRelatedVerses([]);
      setEditId(null);
      if (subTab === 'manage') fetchItems('articles');
    } catch (err) {
      console.error(err);
      alert('Error saving article');
    } finally {
      setIsSaving(false);
    }
  };
  const saveEbookMetadata = async () => { 
    if (!ebookTitle || !ebookAuthor) { alert('Fill in title and author.'); return; }
    await supabase.from('ebooks').insert({ title: ebookTitle, author: ebookAuthor, cover_url: ebookCover, created_at: new Date().toISOString(), author_id: user?.id });
    alert('Book metadata saved!'); 
    setEbookTitle(''); setEbookAuthor(''); setEbookCover('');
  };
  const saveChapter = async () => { 
    if (!selectedEbookId) { alert('Please select a book.'); return; }
    await supabase.from('ebook_chapters').insert({ ebook_id: selectedEbookId, title: chapterTitle, content: chapterContent, chapter_order: chapterOrder, updated_at: new Date().toISOString() });
    alert('Chapter saved!'); setChapterTitle(''); setChapterContent(''); 
  };
// ...

  const fetchCollectionItems = async (collectionId: string) => {
    const { data } = await supabase
      .from('collection_items')
      .select('*, item_id')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true });
    
    if (data) {
      // Fetch actual item details
      const itemsWithDetails = await Promise.all(data.map(async (ci) => {
        let table = '';
        switch (ci.item_type) {
          case 'sermon': table = 'sermons'; break;
          case 'article': table = 'articles'; break;
          case 'music': table = 'music'; break;
          case 'video': table = 'videos'; break;
        }
        if (table) {
          const { data: itemData } = await supabase.from(table).select('*').eq('id', ci.item_id).single();
          return { ...ci, itemDetails: itemData };
        }
        return ci;
      }));
      setCurrentCollectionItems(itemsWithDetails);
    }
  };

  const searchItemsForCollection = async () => {
    if (!searchItemTerm) return;
    let table = '';
    switch (collectionContentType) {
      case 'sermon': table = 'sermons'; break;
      case 'article': table = 'articles'; break;
      case 'music': table = 'music'; break;
      case 'video': table = 'videos'; break;
      case 'mixed': table = 'sermons'; break; // Default to sermons for mixed for now or handle all
    }
    
    if (table) {
      const { data } = await supabase
        .from(table)
        .select('*')
        .ilike('title', `%${searchItemTerm}%`)
        .limit(10);
      if (data) setAvailableItems(data);
    }
  };

  const addItemToCollection = (item: any) => {
    if (currentCollectionItems.find(ci => ci.item_id === item.id)) return;
    setCurrentCollectionItems([...currentCollectionItems, { 
      item_id: item.id, 
      item_type: collectionContentType === 'mixed' ? 'sermon' : collectionContentType, 
      itemDetails: item,
      sort_order: currentCollectionItems.length
    }]);
  };

  const removeCollectionItem = (index: number) => {
    setCurrentCollectionItems(currentCollectionItems.filter((_, i) => i !== index));
  };

  const saveCollection = async () => {
    if (!collectionTitle) { alert('Title is required.'); return; }
    setIsSaving(true);
    try {
      const collectionData = {
        title: collectionTitle,
        description: collectionDesc,
        type: collectionType,
        content_type: collectionContentType,
        image_url: collectionImageUrl,
        creator_id: user?.id,
        updated_at: new Date().toISOString()
      };

      let collectionId = editId;
      if (editId) {
        await supabase.from('collections').update(collectionData).eq('id', editId);
      } else {
        const { data, error } = await supabase.from('collections').insert({ ...collectionData, created_at: new Date().toISOString() }).select().single();
        if (error) throw error;
        collectionId = data.id;
      }

      // Sync items
      // Delete existing items for simplicity in sync
      if (editId) {
        await supabase.from('collection_items').delete().eq('collection_id', editId);
      }

      if (currentCollectionItems.length > 0) {
        const itemsToInsert = currentCollectionItems.map((ci, index) => ({
          collection_id: collectionId,
          item_id: ci.item_id,
          item_type: ci.item_type,
          sort_order: index
        }));
        await supabase.from('collection_items').insert(itemsToInsert);
      }

      alert(editId ? 'Collection updated!' : 'Collection created!');
      setCollectionTitle(''); setCollectionDesc(''); setCollectionImageUrl(''); setCurrentCollectionItems([]);
      setEditId(null);
      if (subTab === 'manage') fetchItems('collections');
    } catch (err) {
      console.error(err);
      alert('Error saving collection');
    } finally {
      setIsSaving(false);
    }
  };


  const saveVideo = async () => { 
    if (!videoTitle || !videoUrl) { alert('Fill in title and URL.'); return; }
    setIsSaving(true);
    try {
      const data = { 
        title: videoTitle, 
        url: videoUrl, 
        description: videoDescription, 
        updated_at: new Date().toISOString() 
      };
      if (editId) {
        await supabase.from('videos').update(data).eq('id', editId);
      } else {
        await supabase.from('videos').insert({ ...data, created_at: new Date().toISOString() });
      }
      alert(editId ? 'Video updated!' : 'Video lesson added!'); 
      setVideoTitle(''); setVideoUrl(''); setVideoDescription('');
      setEditId(null);
      if (subTab === 'manage') fetchItems('videos');
    } catch (err) {
      console.error(err);
      alert('Error saving video');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSermon = async () => {
    if (!sermonTitle || !sermonPreacher || !sermonSpotifyId) {
      alert('Title, Preacher, and Spotify ID are required.');
      return;
    }
    
    setIsSaving(true);
    // Auto-extract Spotify ID from full URL if pasted
    let embedId = sermonSpotifyId;
    if (embedId.includes('episode/')) {
       embedId = embedId.split('episode/')[1].split('?')[0];
    } else if (embedId.includes('track/')) {
       embedId = embedId.split('track/')[1].split('?')[0];
    }

    try {
      const data = {
        title: sermonTitle,
        preacher: sermonPreacher,
        series: sermonSeries,
        embed_id: embedId,
        description: sermonDesc,
        date: sermonDate,
        updated_at: new Date().toISOString()
      };

      if (editId) {
        await supabase.from('sermons').update(data).eq('id', editId);
      } else {
        await supabase.from('sermons').insert({ ...data, created_at: new Date().toISOString() });
      }

      alert(editId ? 'Sermon updated!' : 'Sermon published to the sanctuary!');
      setSermonTitle(''); setSermonPreacher(''); setSermonSeries(''); setSermonSpotifyId(''); setSermonDesc('');
      setEditId(null);
      if (subTab === 'manage') fetchItems('sermons');
    } catch (err) {
      console.error(err);
      alert('Error saving sermon.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveMusic = async () => {
    if (!musicTitle || !musicArtist || !musicSpotifyId) {
      alert('Title, Artist, and Spotify ID are required.');
      return;
    }

    setIsSaving(true);
    let embedId = musicSpotifyId.trim();
    let type = 'track';
    let platform: 'spotify' | 'youtube' = 'spotify';

    if (embedId.includes('youtube.com/') || embedId.includes('youtu.be/')) {
       platform = 'youtube';
       if (embedId.includes('v=')) {
          embedId = embedId.split('v=')[1].split('&')[0];
       } else if (embedId.includes('youtu.be/')) {
          embedId = embedId.split('youtu.be/')[1].split('?')[0];
       }
    } else if (embedId.includes('track/')) {
       embedId = embedId.split('track/')[1].split('?')[0];
       type = 'track';
    } else if (embedId.includes('album/')) {
       embedId = embedId.split('album/')[1].split('?')[0];
       type = 'album';
    } else if (embedId.includes('playlist/')) {
       embedId = embedId.split('playlist/')[1].split('?')[0];
       type = 'playlist';
    } else if (embedId.includes('episode/')) {
       embedId = embedId.split('episode/')[1].split('?')[0];
       type = 'episode';
    }

    try {
      const data = {
        title: musicTitle,
        artist: musicArtist,
        album: musicAlbum,
        embed_id: embedId,
        embed_type: type,
        platform: platform,
        genre: musicGenre,
        updated_at: new Date().toISOString()
      };

      if (editId) {
        await supabase.from('music').update(data).eq('id', editId);
      } else {
        await supabase.from('music').insert({ ...data, created_at: new Date().toISOString() });
      }

      alert(editId ? 'Music updated!' : 'Music added to the archive!');
      setMusicTitle(''); setMusicArtist(''); setMusicAlbum(''); setMusicSpotifyId(''); setMusicGenre('');
      setEditId(null);
      if (subTab === 'manage') fetchItems('music');
    } catch (err) {
      console.error(err);
      alert('Error saving music.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const savePropheticWord = async () => {
    if (!jpwTitle || !jpwContent) { alert('Fill in title and content.'); return; }
    setIsSaving(true);
    try {
      const data = {
        title: jpwTitle,
        content: jpwContent,
        book: jpwBook,
        chapter: Number(jpwChapter),
        verse: Number(jpwVerse),
        updated_at: new Date().toISOString()
      };
      if (editId) {
        await supabase.from('prophetic_words').update(data).eq('id', editId);
      } else {
        await supabase.from('prophetic_words').insert({ 
          ...data, 
          user_id: user?.id,
          created_at: new Date().toISOString(),
          prayer_count: 0 
        });
      }
      alert(editId ? 'Word updated!' : 'Prophetic word added!');
      setJpwTitle(''); setJpwContent('');
      setEditId(null);
      if (subTab === 'manage') fetchItems('prophetic_words');
    } catch (err) {
      console.error(err);
      alert('Error saving prophetic word');
    } finally {
      setIsSaving(false);
    }
  };

  const saveEvent = async () => { 
    if (!eventTitle || !eventDate || !eventDescription) return;
    setIsSaving(true);
    try {
      const data = {
        title: eventTitle,
        date: eventDate,
        description: eventDescription,
        updated_at: new Date().toISOString()
      };
      if (editId) {
        await supabase.from('events').update(data).eq('id', editId);
      } else {
        await supabase.from('events').insert({ ...data, created_at: new Date().toISOString() });
      }
      alert(editId ? 'Event updated!' : 'Event added!'); 
      setEventTitle(''); setEventDate(''); setEventDescription(''); 
      setEditId(null);
      if (subTab === 'manage') fetchItems('events');
    } catch (err) {
      console.error(err);
      alert('Error saving event');
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    { title: 'Summaries', tab: 'summaries', icon: BookMarked },
    { title: 'Intros', tab: 'intros', icon: BookMarked },
    { title: 'Commentary', tab: 'commentary', icon: BookMarked },
    { title: 'Playlists & Series', tab: 'collections', icon: ListChecks },
    { title: 'Sermons', tab: 'sermon', icon: ListChecks },
    { title: 'Sacred Melodies', tab: 'music', icon: Mic },
    { title: 'Devotionals', tab: 'devotional', icon: BookOpen },
    { title: 'Articles', tab: 'article', icon: FileText },
    { title: 'Ebooks', tab: 'ebook', icon: BookOpen },
    { title: 'Video Lessons', tab: 'video', icon: BookOpen },
    { title: 'JPW', tab: 'jpw', icon: BookMarked },
    { title: 'Reading Plans', tab: 'plans', icon: ListChecks },
    { title: 'Study Guides', tab: 'study-guides', icon: GraduationCap },
    { title: 'System', tab: 'system', icon: Database },
    { title: 'Moderation', tab: 'mod', icon: ShieldAlert },
    { title: 'Events', tab: 'event', icon: CalendarDays },
    { title: 'User Management', tab: 'user', icon: Users },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black/50 text-[var(--color-text)]">
      {/* Sidebar */}
      <nav className="w-full md:w-64 border-b md:border-r border-white/10 p-4 md:p-6 flex flex-row md:flex-col gap-4 md:gap-8 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-hide">
        <h1 className="text-lg md:text-2xl font-serif font-bold text-[var(--color-primary)] whitespace-nowrap">Admin Panel</h1>
        <div className="flex flex-row md:flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab as any)}
                className={`flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl transition-all duration-200 whitespace-nowrap ${
                  isActive ? 'bg-[var(--color-primary)] text-[var(--color-background)]' : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm md:font-semibold">{item.title}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 p-4 md:p-10 overflow-auto">
        {/* Module Header & Sub-tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold capitalize text-white">
              {activeTab?.replace('-', ' ')}
            </h2>
            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mt-1">
              Empire Administration Module
            </p>
          </div>

          {activeTab && !['user', 'mod', 'system'].includes(activeTab) && (
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => { setSubTab('create'); setEditId(null); }}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${subTab === 'create' ? 'bg-[var(--color-primary)] text-black shadow-neon' : 'text-white/40 hover:text-white'}`}
              >
                Create
              </button>
              <button 
                onClick={() => setSubTab('manage')}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${subTab === 'manage' ? 'bg-[var(--color-primary)] text-black shadow-neon' : 'text-white/40 hover:text-white'}`}
              >
                Manage
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab || 'empty'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl"
          >
            {activeTab === 'intros' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold">Book Introductions</h2>
                <div className="grid grid-cols-1 gap-6">
                  <input value={book} onChange={e => setBook(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Book Name (e.g. Genesis)" />
                </div>
                <RichTextEditor content={introContent} onChange={setIntroContent} />
                <button onClick={saveBookIntro} className="bg-white text-black w-full py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">Save Book Introduction</button>
              </div>
            )}
            {activeTab === 'summaries' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold">Chapter Summaries & Context</h2>
                <div className="grid grid-cols-2 gap-6">
                  <input value={book} onChange={e => setBook(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Book" />
                  <input type="number" value={summaryChapter} onChange={e => setSummaryChapter(Number(e.target.value))} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Chapter" />
                </div>
                <RichTextEditor content={summaryContent} onChange={setSummaryContent} />
                <button onClick={saveChapterSummary} className="bg-white text-black w-full py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">Save Chapter Summary</button>
              </div>
            )}
            {activeTab === 'collections' && (
              <div className="space-y-6">
                {subTab === 'create' ? (
                  <>
                    <h2 className="text-3xl font-serif font-bold">{editId ? 'Edit' : 'Create'} Playlist or Series</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <input value={collectionTitle} onChange={e => setCollectionTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white" placeholder="Title" />
                      <select value={collectionType} onChange={e => setCollectionType(e.target.value as any)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white">
                        <option value="playlist">Playlist</option>
                        <option value="series">Series</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <select value={collectionContentType} onChange={e => setCollectionContentType(e.target.value as any)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white">
                        <option value="sermon">Sermons</option>
                        <option value="article">Articles</option>
                        <option value="music">Music</option>
                        <option value="video">Videos</option>
                        <option value="mixed">Mixed</option>
                      </select>
                      <input value={collectionImageUrl} onChange={e => setCollectionImageUrl(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white" placeholder="Image URL (Thumbnail)" />
                    </div>
                    <textarea value={collectionDesc} onChange={e => setCollectionDesc(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white" placeholder="Description" rows={3} />
                    
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                      <h3 className="font-bold">Manage Items</h3>
                      <div className="flex gap-2">
                        <input 
                          value={searchItemTerm} 
                          onChange={e => setSearchItemTerm(e.target.value)} 
                          className="flex-1 p-3 rounded-lg bg-black/20 border border-white/10" 
                          placeholder={`Search ${collectionContentType}...`} 
                        />
                        <button onClick={searchItemsForCollection} className="px-4 py-2 bg-white/10 rounded-lg">Search</button>
                      </div>

                      {availableItems.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 bg-black/30 rounded-xl">
                          {availableItems.map(item => (
                            <button key={item.id} onClick={() => addItemToCollection(item)} className="p-2 text-left hover:bg-white/5 rounded text-xs border border-white/5 flex justify-between items-center group">
                              <span>{item.title}</span>
                              <span className="opacity-0 group-hover:opacity-100 text-[var(--color-primary)]">+ Add</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="space-y-2 mt-4">
                        <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Items in this Collection</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-hide">
                          {currentCollectionItems.map((ci, i) => (
                            <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10 group">
                              <div className="flex items-center gap-3">
                                <span className="text-white/20 font-mono text-[10px] w-4">{i + 1}</span>
                                <span className="text-sm font-bold text-white">{ci.itemDetails?.title || 'Unknown Item'}</span>
                                <span className="text-[8px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/40">{ci.item_type}</span>
                              </div>
                              <button onClick={() => removeCollectionItem(i)} className="text-red-400 p-1 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">×</button>
                            </div>
                          ))}
                          {currentCollectionItems.length === 0 && (
                            <p className="text-center p-8 text-white/20 italic text-xs">No items added to this collection yet.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {editId && (
                        <button onClick={() => { setEditId(null); setCollectionTitle(''); setCollectionDesc(''); setCurrentCollectionItems([]); }} className="bg-white/10 text-white flex-1 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">Cancel</button>
                      )}
                      <button onClick={saveCollection} disabled={isSaving} className="bg-white text-black flex-[2] py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        {editId ? 'Update Collection' : 'Create Collection'}
                      </button>
                    </div>
                  </>
                ) : (
                  <ManagementList table="collections" loadingItems={loadingItems} items={items} onEdit={editItem} onDelete={deleteItem} />
                )}
              </div>
            )}
            {activeTab === 'commentary' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold">In The Elects Commentary</h2>
                <div className="grid grid-cols-3 gap-6">
                  <input value={book} onChange={e => setBook(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Book" />
                  <input type="number" value={chapter} onChange={e => setChapter(Number(e.target.value))} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Chapter" />
                  <input type="number" value={verse} onChange={e => setVerse(Number(e.target.value))} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Verse" />
                </div>
                <RichTextEditor content={commentaryContent} onChange={setCommentaryContent} />
                <button onClick={saveCommentary} className="bg-white text-black w-full py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">Save Commentary</button>
              </div>
            )}
            {activeTab === 'user' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold">User Management</h2>
                <div className="grid gap-4">
                  {items.map(u => (
                    <div key={u.id} className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1541447237128-f4bcb61782af?auto=format&fit=crop&q=80&w=128'} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                        <div>
                          <p className="font-bold text-white leading-none">{u.displayName || 'Unknown Envoy'}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Status: <span className={u.role === 'admin' ? 'text-yellow-400 font-black' : ''}>{u.role === 'admin' ? 'Admin' : 'User'}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleAdmin(u.id, u.role || 'user')}
                          className={`text-[10px] px-3 py-1 rounded-md border transition-all ${
                            u.role === 'admin' 
                            ? 'bg-white/5 hover:bg-white/10 text-white/60 border-white/5' 
                            : 'bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-500 border-yellow-500/20'
                          }`}
                        >
                          {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'mod' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold">Moderation Center</h2>
                <div className="grid gap-4">
                  {items.length === 0 ? (
                    <p className="text-white/20 italic">No threads found to moderate.</p>
                  ) : (
                    items.map(t => (
                      <div key={t.id} className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between group">
                        <div>
                          <p className="font-bold text-white group-hover:text-red-400 transition-colors">{t.title}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">ID: {t.id}</p>
                        </div>
                        <button onClick={() => deleteThread(t.id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {activeTab === 'devotional' && (
              <div className="space-y-6">
                {subTab === 'create' ? (
                  <>
                    <h2 className="text-3xl font-serif font-bold">{editId ? 'Edit' : 'Publish'} Devotional</h2>
                    <input value={devoTitle} onChange={e => setDevoTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Title" />
                    <input type="date" value={devoDate} onChange={e => setDevoDate(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" />
                    <RichTextEditor content={devoContent} onChange={setDevoContent} />
                    <div className="flex gap-4">
                      {editId && (
                        <button onClick={() => { setEditId(null); setDevoTitle(''); setDevoContent(''); setDevoDate(''); }} className="bg-white/10 text-white flex-1 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">Cancel</button>
                      )}
                      <button onClick={saveDevotional} disabled={isSaving} className="bg-white text-black flex-[2] py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        {editId ? 'Update Devotional' : 'Publish Devotional'}
                      </button>
                    </div>
                  </>
                ) : (
                  <ManagementList table="devotionals" loadingItems={loadingItems} items={items} onEdit={editItem} onDelete={deleteItem} />
                )}
              </div>
            )}
            {activeTab === 'article' && (
              <div className="space-y-6">
                {subTab === 'create' ? (
                  <>
                    <h2 className="text-3xl font-serif font-bold">{editId ? 'Edit' : 'Manage'} Article</h2>
                    <input value={articleTitle} onChange={e => setArticleTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Title" />
                    <RichTextEditor content={articleContent} onChange={setArticleContent} />
                    
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                      <h3 className="text-xl font-bold">Link to Verses</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <input value={articleVerseBook} onChange={e => setArticleVerseBook(e.target.value)} className="p-3 rounded-lg bg-black/20 border border-white/10" placeholder="Book" />
                        <input type="number" value={articleVerseChapter} onChange={e => setArticleVerseChapter(Number(e.target.value))} className="p-3 rounded-lg bg-black/20 border border-white/10" placeholder="Chapter" />
                        <input type="number" value={articleVerseVerse} onChange={e => setArticleVerseVerse(Number(e.target.value))} className="p-3 rounded-lg bg-black/20 border border-white/10" placeholder="Verse" />
                      </div>
                      <button onClick={addRelatedVerse} className="text-xs px-4 py-2 bg-blue-600 rounded-lg">Add Link</button>
                      
                      <div className="flex flex-wrap gap-2">
                        {relatedVerses.map((rv, i) => (
                          <span key={i} className="px-2 py-1 bg-white/10 rounded flex items-center gap-2 text-xs">
                            {rv.book} {rv.chapter}:{rv.verse}
                            <button onClick={() => removeRelatedVerse(i)} className="text-red-400">×</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {editId && (
                        <button onClick={() => { setEditId(null); setArticleTitle(''); setArticleContent(''); setRelatedVerses([]); }} className="bg-white/10 text-white flex-1 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">Cancel</button>
                      )}
                      <button onClick={saveArticle} disabled={isSaving} className="bg-white text-black flex-[2] py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        {editId ? 'Update Article' : 'Publish Article'}
                      </button>
                    </div>
                  </>
                ) : (
                  <ManagementList table="articles" loadingItems={loadingItems} items={items} onEdit={editItem} onDelete={deleteItem} />
                )}
              </div>
            )}
            {activeTab === 'ebook' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold">Manage Ebook Library</h2>
                <div className="grid grid-cols-2 gap-6">
                    <input value={ebookTitle} onChange={e => setEbookTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Book Title" />
                    <input value={ebookAuthor} onChange={e => setEbookAuthor(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Author" />
                </div>
                <input value={ebookCover} onChange={e => setEbookCover(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Cover Image URL" />
                <button onClick={saveEbookMetadata} className="bg-white text-black w-full py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">Save Book Metadata</button>
                
                <h3 className="text-2xl font-serif font-bold pt-6 border-t border-white/10">Add Chapter</h3>
                <select value={selectedEbookId} onChange={e => setSelectedEbookId(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white">
                  <option value="">Select a Book</option>
                  {ebooks.map(eb => <option key={eb.id} value={eb.id}>{eb.title}</option>)}
                </select>
                <input value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Chapter Title" />
                <input type="number" value={chapterOrder} onChange={e => setChapterOrder(Number(e.target.value))} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Chapter Order" />
                <RichTextEditor content={chapterContent} onChange={setChapterContent} />
                <button onClick={saveChapter} className="bg-white text-black w-full py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">Save Chapter</button>
              </div>
            )}
            {activeTab === 'video' && (
              <div className="space-y-6">
                {subTab === 'create' ? (
                  <>
                    <h2 className="text-3xl font-serif font-bold">{editId ? 'Edit' : 'Manage'} Video Lessons</h2>
                    <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Title" />
                    <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="YouTube URL" />
                    <RichTextEditor content={videoDescription} onChange={setVideoDescription} />
                    <div className="flex gap-4">
                      {editId && (
                        <button onClick={() => { setEditId(null); setVideoTitle(''); setVideoUrl(''); setVideoDescription(''); }} className="bg-white/10 text-white flex-1 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">Cancel</button>
                      )}
                      <button onClick={saveVideo} disabled={isSaving} className="bg-white text-black flex-[2] py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        {editId ? 'Update Video' : 'Add Video Lesson'}
                      </button>
                    </div>
                  </>
                ) : (
                  <ManagementList table="videos" loadingItems={loadingItems} items={items} onEdit={editItem} onDelete={deleteItem} />
                )}
              </div>
            )}
            {activeTab === 'sermon' && (
              <div className="space-y-6">
                {subTab === 'create' ? (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-neon">
                        <ListChecks size={28} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-serif font-bold text-white leading-tight">{editId ? 'Edit' : 'Publish'} Audio Sermon</h2>
                        <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">The Spoken Word Sanctuary</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Message Title</label>
                          <input value={sermonTitle} onChange={e => setSermonTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 transition-all" placeholder="e.g. The Power of Grace" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Preacher</label>
                          <input value={sermonPreacher} onChange={e => setSermonPreacher(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 transition-all" placeholder="e.g. Pastor John Doe" />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Sermon Series</label>
                          <input value={sermonSeries} onChange={e => setSermonSeries(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 transition-all" placeholder="e.g. Foundations of Faith" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Publish Date</label>
                          <input type="date" value={sermonDate} onChange={e => setSermonDate(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 transition-all" />
                       </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Spotify Episode ID or URL</label>
                        <input value={sermonSpotifyId} onChange={e => setSermonSpotifyId(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 transition-all" placeholder="ID (e.g. 1a2b3c) or full link" />
                        <p className="text-[10px] text-white/20 italic">If you paste the full URL, Elects AI will auto-extract the ID for embedding.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Short Description</label>
                      <textarea value={sermonDesc} onChange={e => setSermonDesc(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 transition-all" placeholder="What was this message about?" rows={3} />
                    </div>

                    <div className="flex gap-4">
                      {editId && (
                        <button onClick={() => { setEditId(null); setSermonTitle(''); setSermonPreacher(''); setSermonSeries(''); setSermonSpotifyId(''); setSermonDesc(''); }} className="bg-white/10 text-white flex-1 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">Cancel</button>
                      )}
                      <button onClick={saveSermon} disabled={isSaving} className="flex-[2] py-4 bg-emerald-500 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-neon flex items-center justify-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        {editId ? 'Update Sermon' : 'Publish to Sanctuary'}
                      </button>
                    </div>
                  </>
                ) : (
                  <ManagementList table="sermons" loadingItems={loadingItems} items={items} onEdit={editItem} onDelete={deleteItem} />
                )}
              </div>
            )}
            {activeTab === 'music' && (
              <div className="space-y-6">
                {subTab === 'create' ? (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-neon">
                        <Mic size={28} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-serif font-bold text-white leading-tight">{editId ? 'Edit' : 'Add'} Sacred Melody</h2>
                        <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Worship and Spiritual Songs</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                           <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Song Title</label>
                           <input value={musicTitle} onChange={e => setMusicTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 transition-all" placeholder="e.g. 10,000 Reasons" />
                       </div>
                       <div className="space-y-2">
                           <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Artist / Leader</label>
                           <input value={musicArtist} onChange={e => setMusicArtist(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 transition-all" placeholder="e.g. Matt Redman" />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                           <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Album / Series</label>
                           <input value={musicAlbum} onChange={e => setMusicAlbum(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 transition-all" placeholder="e.g. Alone with My Faith" />
                       </div>
                       <div className="space-y-2">
                           <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Genre / Style</label>
                           <input value={musicGenre} onChange={e => setMusicGenre(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 transition-all" placeholder="e.g. Contemporary Worship" />
                       </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Share Link (Spotify or YouTube)</label>
                        <input value={musicSpotifyId} onChange={e => setMusicSpotifyId(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 transition-all" placeholder="Paste Spotify or YouTube link here" />
                        <p className="text-[10px] text-white/20 italic">Use YouTube links if you want full playback without requiring users to log in to Spotify.</p>
                    </div>

                    <div className="flex gap-4">
                      {editId && (
                        <button onClick={() => { setEditId(null); setMusicTitle(''); setMusicArtist(''); setMusicAlbum(''); setMusicSpotifyId(''); setMusicGenre(''); }} className="bg-white/10 text-white flex-1 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">Cancel</button>
                      )}
                      <button onClick={saveMusic} disabled={isSaving} className="flex-[2] py-4 bg-blue-500 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-neon flex items-center justify-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        {editId ? 'Update Melody' : 'Add to Archive'}
                      </button>
                    </div>
                  </>
                ) : (
                  <ManagementList table="music" loadingItems={loadingItems} items={items} onEdit={editItem} onDelete={deleteItem} />
                )}
              </div>
            )}
            {activeTab === 'jpw' && (
              <div className="space-y-6">
                {subTab === 'create' ? (
                  <>
                    <h2 className="text-3xl font-serif font-bold">{editId ? 'Edit' : 'Manage'} Prophetic Journey</h2>
                    <div className="grid grid-cols-1 gap-6">
                      <input value={jpwTitle} onChange={e => setJpwTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Title" />
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <input value={jpwBook} onChange={e => setJpwBook(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Book" />
                        <input type="number" value={jpwChapter} onChange={e => setJpwChapter(Number(e.target.value))} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Chapter" />
                        <input type="number" value={jpwVerse} onChange={e => setJpwVerse(Number(e.target.value))} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Verse" />
                    </div>
                    <RichTextEditor content={jpwContent} onChange={setJpwContent} />
                    <div className="flex gap-4">
                      {editId && (
                        <button onClick={() => { setEditId(null); setJpwTitle(''); setJpwContent(''); }} className="bg-white/10 text-white flex-1 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">Cancel</button>
                      )}
                      <button onClick={savePropheticWord} disabled={isSaving} className="bg-[#4285F4] text-white flex-[2] py-4 rounded-xl font-bold hover:bg-[#3474E0] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        {editId ? 'Update Word' : 'Add Prophetic Declaration'}
                      </button>
                    </div>
                  </>
                ) : (
                  <ManagementList table="prophetic_words" loadingItems={loadingItems} items={items} onEdit={editItem} onDelete={deleteItem} />
                )}
              </div>
            )}
            {activeTab === 'event' && (
              <div className="space-y-6">
                {subTab === 'create' ? (
                  <>
                    <h2 className="text-3xl font-serif font-bold">{editId ? 'Edit' : 'Manage'} Event</h2>
                    <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Title" />
                    <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-gray-400" placeholder="Date" />
                    <RichTextEditor content={eventDescription} onChange={setEventDescription} />
                    <div className="flex gap-4">
                      {editId && (
                        <button onClick={() => { setEditId(null); setEventTitle(''); setEventDate(''); setEventDescription(''); }} className="bg-white/10 text-white flex-1 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">Cancel</button>
                      )}
                      <button onClick={saveEvent} disabled={isSaving} className="bg-white text-black flex-[2] py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        {editId ? 'Update Event' : 'Add Event'}
                      </button>
                    </div>
                  </>
                ) : (
                  <ManagementList table="events" loadingItems={loadingItems} items={items} onEdit={editItem} onDelete={deleteItem} />
                )}
              </div>
            )}
            {activeTab === 'plans' && (
              <div className="space-y-6">
                {subTab === 'create' ? (
                  <>
                    <h2 className="text-3xl font-serif font-bold">{editId ? 'Edit' : 'Create'} Reading Plan</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <input value={planTitle} onChange={e => setPlanTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white" placeholder="Plan Title" />
                      <input type="number" value={planDays} onChange={e => setPlanDays(Number(e.target.value))} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white" placeholder="Duration (Days)" />
                    </div>
                    <textarea value={planDesc} onChange={e => setPlanDesc(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white" placeholder="Description" rows={3} />
                    
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                      <h3 className="font-bold">Add Daily Readings</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <input type="number" value={planReadingDay} onChange={e => setPlanReadingDay(Number(e.target.value))} className="p-3 rounded-lg bg-black/20 border border-white/10" placeholder="Day #" />
                        <input value={planReadingBook} onChange={e => setPlanReadingBook(e.target.value)} className="p-3 rounded-lg bg-black/20 border border-white/10" placeholder="Book" />
                        <input type="number" value={planReadingChapter} onChange={e => setPlanReadingChapter(Number(e.target.value))} className="p-3 rounded-lg bg-black/20 border border-white/10" placeholder="Chapter" />
                      </div>
                      <button onClick={addPlanReading} className="text-xs px-4 py-2 bg-blue-600 rounded-lg">Add Reading</button>
                      
                      <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                        {planReadings.map((pr, i) => (
                          <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded text-xs">
                            <span>Day {pr.day}: {pr.book} {pr.chapter}</span>
                            <button onClick={() => removePlanReading(i)} className="text-red-400">Remove</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {editId && (
                        <button onClick={() => { setEditId(null); setPlanTitle(''); setPlanDesc(''); setPlanReadings([]); }} className="bg-white/10 text-white flex-1 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">Cancel</button>
                      )}
                      <button onClick={saveReadingPlan} disabled={isSaving} className="bg-white text-black flex-[2] py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        {editId ? 'Update Plan' : 'Create Plan'}
                      </button>
                    </div>
                  </>
                ) : (
                  <ManagementList table="reading_plans" loadingItems={loadingItems} items={items} onEdit={editItem} onDelete={deleteItem} />
                )}
              </div>
            )}
            {activeTab === 'study-guides' && (
              <div className="space-y-6">
                {subTab === 'create' ? (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-neon">
                        <GraduationCap size={28} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-serif font-bold text-white leading-tight">{editId ? 'Edit' : 'Manage'} Study Guides</h2>
                        <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Curated Educational Resources</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Guide Title</label>
                        <input value={guideTitle} onChange={e => setGuideTitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="e.g. The Empire Manifesto" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Subtitle / hook</label>
                        <input value={guideSubtitle} onChange={e => setGuideSubtitle(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="e.g. Understanding 1 Peter 2:9" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Category</label>
                        <input value={guideCategory} onChange={e => setGuideCategory(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="e.g. Foundations" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Read Time</label>
                        <input value={guideReadTime} onChange={e => setGuideReadTime(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="e.g. 15 min" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Difficulty</label>
                        <select value={guideDifficulty} onChange={e => setGuideDifficulty(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                          <option value="Introductory">Introductory</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Rating (1-5)</label>
                        <input type="number" step="0.1" value={guideRating} onChange={e => setGuideRating(Number(e.target.value))} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Header Image URL</label>
                      <input value={guideImage} onChange={e => setGuideImage(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="https://unsplash.com/..." />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Link to Ebook (Optional ID)</label>
                      <input value={guideEbookId} onChange={e => setGuideEbookId(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white" placeholder="Ebook ID for redirection" />
                    </div>

                    <div className="flex gap-4">
                      {editId && (
                        <button onClick={() => { setEditId(null); setGuideTitle(''); setGuideSubtitle(''); setGuideCategory(''); setGuideReadTime(''); setGuideImage(''); setGuideEbookId(''); }} className="bg-white/10 text-white flex-1 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">Cancel</button>
                      )}
                      <button onClick={saveStudyGuide} disabled={isSaving} className="flex-[2] py-4 bg-indigo-500 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-neon flex items-center justify-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        {editId ? 'Update Guide' : 'Archive Guide'}
                      </button>
                    </div>
                  </>
                ) : (
                  <ManagementList table="study_guides" loadingItems={loadingItems} items={items} onEdit={editItem} onDelete={deleteItem} />
                )}
              </div>
            )}
            {activeTab === 'system' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-500/20 rounded-2xl flex items-center justify-center text-gray-400 shadow-neon">
                    <Database size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-white leading-tight">System Infrastructure</h2>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Empire Maintenance & Data</p>
                  </div>
                </div>
              </div>
            )}
            {!activeTab && (
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Active Users', value: stats.users, icon: Users, color: 'text-blue-400' },
                    { label: 'Articles Published', value: stats.articles, icon: FileText, color: 'text-emerald-400' },
                    { label: 'Study Plans', value: stats.plans, icon: BookMarked, color: 'text-yellow-400' }
                  ].map((stat, i) => (
                    <div key={i} className="glass-panel p-8 rounded-[2rem] border border-white/10 flex flex-col items-center text-center space-y-2">
                      <stat.icon size={32} className={stat.color} />
                      <div className="text-4xl font-serif font-bold text-white">{stat.value}</div>
                      <div className="text-[10px] uppercase tracking-widest font-black text-white/40">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="glass-panel p-10 rounded-[3rem] border border-white/10 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent flex flex-col items-center text-center space-y-6">
                   <div className="w-20 h-20 bg-[var(--color-primary)]/20 rounded-[2rem] flex items-center justify-center text-[var(--color-primary)] shadow-neon">
                      <Sparkles size={40} />
                   </div>
                   <h2 className="text-5xl font-serif font-bold text-white leading-tight">Welcome to the Throne Room</h2>
                   <p className="text-lg text-white/60 max-w-xl italic leading-relaxed">
                     "And I will give unto thee the keys of the kingdom of heaven: and whatsoever thou shalt bind on earth shall be bound in heaven..."
                   </p>
                   <div className="pt-4 flex gap-4">
                      <button onClick={() => setActiveTab('article')} className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">Write Article</button>
                      <button onClick={() => setActiveTab('user')} className="px-8 py-4 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest text-xs border border-white/10 hover:bg-white/10 transition-all">Manage Users</button>
                   </div>
                </div>
              </div>
            )}
            {!activeTab && <div className="text-gray-500">Select a module to begin.</div>}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
