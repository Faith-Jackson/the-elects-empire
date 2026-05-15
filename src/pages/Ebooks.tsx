import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { BookOpenText } from 'lucide-react';

interface Ebook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
}

export default function Ebooks() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEbooks = async () => {
      const { data } = await supabase.from('ebooks').select('*');
      if (data) setEbooks(data as Ebook[]);
    };
    fetchEbooks();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 pb-32 animate-fade-in space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
              <BookOpenText size={12} className="text-[var(--color-primary)]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-black">Sacred Library</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-serif font-bold text-[var(--color-text)] tracking-tightest leading-[0.9]">Ebooks</h1>
           <p className="text-[var(--color-text-muted)] text-lg md:text-xl font-serif max-w-2xl italic leading-relaxed">
             "Curated spiritual resources and library of the saints."
           </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
        {ebooks.map((ebook) => (
          <div 
            key={ebook.id}
            onClick={() => navigate(`/ebooks/${ebook.id}`)}
            className="glass-card p-6 rounded-3xl border border-white/10 text-center hover:bg-white/5 transition-all duration-300 group cursor-pointer"
          >
            <img 
              src={ebook.cover_url || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400`} 
              alt={ebook.title} 
              className="w-full h-64 object-cover rounded-xl mb-4" 
              referrerPolicy="no-referrer"
            />
            <h3 className="font-serif font-semibold text-lg">{ebook.title}</h3>
            <p className="text-sm text-[var(--color-text-muted)]">{ebook.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
