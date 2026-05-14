import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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
    <div className="max-w-6xl mx-auto p-4 md:p-12 pb-24 md:pb-12 animate-fade-in">
      <h1 className="text-3xl md:text-5xl font-serif font-bold mb-8 md:mb-12">E-Books Library</h1>
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
