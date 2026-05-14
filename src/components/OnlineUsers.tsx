import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Circle } from 'lucide-react';

export default function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  const fetchOnlineUsers = async () => {
    // Check for users who seen in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
    const { data } = await supabase
      .from('profiles')
      .select('id, displayName, avatarUrl, isOnline, lastSeen')
      .eq('isOnline', true)
      .gte('lastSeen', fiveMinutesAgo)
      .limit(20);
    
    if (data) setOnlineUsers(data);
  };

  useEffect(() => {
    fetchOnlineUsers();

    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchOnlineUsers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="glass-panel p-4 rounded-xl border border-white/10 mb-6">
      <h3 className="text-sm font-bold text-white/60 mb-3 flex items-center gap-2 uppercase tracking-wider">
        <Users size={16} /> Online Now ({onlineUsers.length})
      </h3>
      <div className="flex flex-wrap gap-3">
        {onlineUsers.map(user => (
          <div key={user.id} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full border border-white/5">
            <div className="relative">
                <img 
                    src={user.avatarUrl || `https://images.unsplash.com/photo-1541447237128-f4bcb61782af?auto=format&fit=crop&q=80&w=32`} 
                    alt={user.displayName} 
                    className="w-6 h-6 rounded-full border border-white/20"
                    referrerPolicy="no-referrer"
                />
                <Circle size={8} className="absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500" />
            </div>
            <span className="text-xs text-white/80 max-w-[80px] truncate">{user.displayName || 'Studious User'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
