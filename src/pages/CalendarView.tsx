import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react';
import { motion } from "motion/react";
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
}

export default function CalendarView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (data) setEvents(data as Event[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel('public:events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-4 md:p-8 pb-24"
    >
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-black mb-4">Upcoming Events</h1>
        <p className="text-[var(--color-text-muted)] text-lg">Join us in fellowship and growth.</p>
      </header>
      
      {loading ? (
        <div className="py-20 text-center text-[var(--color-text-muted)]">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="glass-card p-8 md:p-12 rounded-3xl border border-[var(--color-primary)]/30 text-center">
            <p className="text-[var(--color-text-muted)] italic">No upcoming events this month.</p>
        </div>
      ) : (
        <div className="space-y-6">
            {events.map((event) => {
                const dateObj = new Date(event.date);
                const month = dateObj.toLocaleDateString(undefined, { month: 'short' });
                const day = dateObj.toLocaleDateString(undefined, { day: '2-digit' });
                
                return (
                <motion.div 
                    key={event.id}
                    whileHover={{ scale: 1.02 }}
                    className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row md:items-center gap-6 hover:border-[var(--color-primary)]/30 transition-all"
                >
                    <div className="w-20 h-20 bg-[var(--color-primary)]/10 rounded-2xl flex flex-col items-center justify-center text-[var(--color-primary)] shrink-0 shadow-neon-glow">
                    <span className="text-sm font-bold uppercase">{month}</span>
                    <span className="text-2xl font-black">{day}</span>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold">{event.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1.5"><Clock size={16} /> {event.time}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={16} /> {event.location}</span>
                        <span className="flex items-center gap-1.5"><Users size={16} /> {event.category}</span>
                    </div>
                    </div>

                    <button className="bg-[var(--color-primary)] text-[var(--color-background)] px-6 py-2 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all">
                    Save Date
                    </button>
                </motion.div>
                );
            })}
        </div>
      )}
    </motion.div>
  );
}
