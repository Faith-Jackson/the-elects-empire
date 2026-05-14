import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Bell, Check, Trash2, MessageSquare, HandHelping, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  type?: 'reply' | 'prayer' | 'system';
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data as Notification[]);
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase.channel(`public:notifications:${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
            fetchNotifications();
        })
        .subscribe();

    setLoading(false);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    await supabase.from('notifications').delete().eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'reply': return <MessageSquare size={16} className="text-blue-400" />;
      case 'prayer': return <HandHelping size={16} className="text-emerald-400" />;
      default: return <Sparkles size={16} className="text-purple-400" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-10 mb-20">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--color-primary)]/10 rounded-2xl text-[var(--color-primary)]">
            <Bell size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Notifications</h1>
            <p className="text-sm text-white/40">{notifications.filter(n => !n.read).length} unread updates</p>
          </div>
        </div>
        
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] hover:text-white transition-colors flex items-center gap-2"
          >
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20 opacity-20">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : notifications.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-panel p-5 rounded-2xl border transition-all flex items-start gap-4 group ${
                  n.read ? 'border-white/5 opacity-60' : 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5'
                }`}
              >
                <div className="mt-1 p-2 bg-white/5 rounded-lg">
                  {getIcon(n.type)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <p className={`text-sm leading-relaxed ${n.read ? 'text-white/70' : 'text-white font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.read && (
                    <button 
                      onClick={() => markAsRead(n.id)}
                      className="p-2 bg-white/5 hover:bg-emerald-500/20 text-white/40 hover:text-emerald-400 rounded-lg transition-all"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(n.id)}
                    className="p-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-lg transition-all"
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl">
            <Bell size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/30 italic">No notifications yet. You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
