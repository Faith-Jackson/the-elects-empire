import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { processBibleReferences, useBibleVerseLinks } from '../lib/bibleLinker';
import { sanitizeHTML } from '../lib/security';

interface Ebook {
  title: string;
  author: string;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

export default function EbookReader() {
  const { id } = useParams<{ id: string }>();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Initialize the auto-linker event listener
  useBibleVerseLinks();

  useEffect(() => {
    const fetchEbook = async () => {
      if (!id) return;
      const { data: ebookData } = await supabase.from('ebooks').select('*').eq('id', id).single();
      if (ebookData) {
        setEbook(ebookData as Ebook);
      }
      
      const { data: chaptersData } = await supabase
        .from('ebook_chapters')
        .select('*')
        .eq('ebook_id', id)
        .order('order', { ascending: true });
      
      if (chaptersData) {
        setChapters(chaptersData as Chapter[]);
        if (chaptersData.length > 0) setActiveChapterId(chaptersData[0].id);
      }
      
      setLoading(false);
    };
    fetchEbook();
  }, [id]);

  if (loading) return <div className="p-12 text-center">Loading Book...</div>;
  if (!ebook) return <div className="p-12 text-center">Book not found.</div>;

  const activeChapter = chapters.find(c => c.id === activeChapterId);
  
  // Process content for verse links
  const processedContent = activeChapter ? processBibleReferences(activeChapter.content) : '';

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black/50 text-white overflow-hidden">
      <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-6 overflow-y-auto shrink-0 max-h-[40vh] md:max-h-none">
        <button onClick={() => navigate('/ebooks')} className="mb-4 md:mb-6 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Library
        </button>
        <h2 className="font-serif font-bold text-lg md:text-xl mb-4 truncate">{ebook.title}</h2>
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            {chapters.map(chapter => (
                <button 
                  key={chapter.id} 
                  onClick={() => setActiveChapterId(chapter.id)}
                  className={`whitespace-nowrap md:whitespace-normal md:w-full text-left px-4 md:px-2 py-2 rounded text-sm transition-colors ${activeChapterId === chapter.id ? 'bg-[var(--color-primary)] text-black' : 'bg-white/5 md:bg-transparent hover:bg-white/10'}`}
                >
                    {chapter.title}
                </button>
            ))}
        </div>
      </nav>
      
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {activeChapter ? (
            <article className="glass-card p-6 md:p-12 rounded-3xl border border-white/10 max-w-4xl mx-auto shadow-2xl">
                <h1 className="text-3xl md:text-4xl font-serif font-bold mb-6 md:mb-8">{activeChapter.title}</h1>
                <div 
                className="prose prose-invert prose-base md:prose-lg max-w-none text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(processedContent) }}
                />
            </article>
        ) : <p className="text-center opacity-50 mt-12">Select a chapter to begin reading.</p>}
      </main>
    </div>
  );
}
