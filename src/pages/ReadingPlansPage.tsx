import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Calendar, CheckCircle2, ChevronRight, PlayCircle, Loader2, Sparkles, BrainCircuit, Wand2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { generateStudyPlan } from '../services/groqService';
import { motion, AnimatePresence } from 'motion/react';

export default function ReadingPlansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [activePlans, setActivePlans] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');

  const fetchPlans = async () => {
    const { data } = await supabase.from('reading_plans').select('*').order('created_at', { ascending: false });
    if (data) setPlans(data);
  };

  const fetchUserPlans = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_plans').select('*').eq('user_id', user.id);
    if (data) {
      const plansData: Record<string, any> = {};
      data.forEach(d => {
        plansData[d.plan_id] = d;
      });
      setActivePlans(plansData);
    }
  };

  useEffect(() => {
    fetchPlans();

    if (!user) {
      setLoading(false);
      return;
    }

    fetchUserPlans();

    const plansChannel = supabase.channel('public:reading_plans').on('postgres_changes', { event: '*', schema: 'public', table: 'reading_plans' }, () => fetchPlans()).subscribe();
    const userPlansChannel = supabase.channel(`public:user_plans:${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'user_plans', filter: `user_id=eq.${user.id}` }, () => fetchUserPlans()).subscribe();

    setLoading(false);

    return () => {
      supabase.removeChannel(plansChannel);
      supabase.removeChannel(userPlansChannel);
    };
  }, [user]);

  const generateAIPlan = async () => {
    if (!topic.trim() || !user) return;
    setIsGenerating(true);
    try {
      const planReadings = await generateStudyPlan(topic);
      const planTitle = `Journey to ${topic}`;
      const planDesc = `A personalized ${planReadings.length}-day spiritual journey exploring the themes of ${topic}, curated by Elects AI.`;
      
      const { data: newPlan, error } = await supabase.from('reading_plans').insert([{
        title: planTitle,
        description: planDesc,
        duration_days: planReadings.length,
        color: 'bg-[var(--color-primary)] shadow-neon-glow animate-pulse',
        is_ai: true,
        creator_id: user.id,
        readings: planReadings,
        created_at: new Date().toISOString()
      }]).select().single();

      if (!error && newPlan) {
        await enrollInPlan(newPlan);
        setTopic('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const enrollInPlan = async (plan: any) => {
    if (!user) return;
    await supabase.from('user_plans').upsert({
      user_id: user.id,
      plan_id: plan.id,
      started_at: new Date().toISOString(),
      current_day: 1,
      completed_days: []
    });
  };

  const continueReading = (userPlan: any, planDetails: any) => {
    const currentDay = userPlan.current_day || 1;
    const reading = planDetails.readings?.find((r: any) => r.day === currentDay);
    if (reading) {
      navigate(`/read?book=${reading.book}&chapter=${reading.chapter}&planId=${planDetails.id}&day=${currentDay}`);
    } else {
      navigate('/read');
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-primary)]" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto text-white space-y-12 mb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
              <Calendar size={12} className="text-[var(--color-primary)]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-black">Imperial Strategy</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-serif font-bold text-[var(--color-text)] tracking-tightest leading-[0.9]">Plans</h1>
           <p className="text-[var(--color-text-muted)] text-lg md:text-xl font-serif max-w-2xl italic leading-relaxed">
             "Strategic reading plans to immerse yourself in the fullness of Scripture."
           </p>
        </div>
      </div>

      {user && (
        <section className="mb-12">
          <div className="glass-panel p-6 rounded-3xl border border-[var(--color-primary)]/20 shadow-neon-glow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BrainCircuit size={80} className="text-[var(--color-primary)]" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-[var(--color-primary)]">
                <Sparkles size={16} />
                <span className="text-xs font-black uppercase tracking-widest">AI Study Shepherd</span>
              </div>
              <h2 className="text-2xl font-serif font-bold mb-4">Curate Your Personal Journey</h2>
              <p className="text-sm text-white/50 mb-6 max-w-xl">
                Tell Elects AI what spiritual theme or book you wish to dwell on. I will curate a personalized 7-day study plan, complete with scripture and reflections.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input 
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g., 'Overcoming Fear' or 'The Psalms of David'"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                  {isGenerating && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="animate-spin text-[var(--color-primary)]" size={16} /></div>}
                </div>
                <button 
                  onClick={generateAIPlan}
                  disabled={isGenerating || !topic.trim()}
                  className="bg-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white text-black font-black px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-neon-glow active:scale-95"
                >
                  <Wand2 size={16} />
                  {isGenerating ? 'Curating Archives...' : 'Generate Plan'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {!user ? (
        <div className="glass-panel p-8 rounded-2xl text-center border-dashed border-white/20">
          <p className="text-white/60 mb-4">Sign in to enroll in reading plans and track your progress.</p>
          <Link to="/profile" className="bg-[var(--color-primary)] text-[var(--color-background)] px-6 py-2 rounded-full font-bold">Sign In</Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Active Plans */}
          {Object.keys(activePlans).length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 font-serif border-b border-white/10 pb-2">My Active Plans</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {Object.values(activePlans).map(plan => {
                  const planDetails = plans.find(p => p.id === plan.plan_id);
                  if (!planDetails) return null;
                  const progress = Math.round((plan.completed_days.length / planDetails.duration_days) * 100);

                  return (
                    <div key={plan.id} className="glass-card p-6 rounded-2xl border border-[var(--color-primary)]/30 relative overflow-hidden group hover:shadow-neon-glow transition-all">
                      <div className={`absolute top-0 left-0 w-2 h-full ${planDetails.color || 'bg-[var(--color-primary)]'}`} />
                      <div className="ml-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{planDetails.title}</h3>
                          <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/70">Day {plan.current_day} of {planDetails.duration_days}</span>
                        </div>
                        
                        <div className="w-full bg-white/5 rounded-full h-2 my-4">
                          <div className={`h-2 rounded-full ${planDetails.color || 'bg-[var(--color-primary)]'} transition-all`} style={{ width: `${progress}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center mt-6">
                           <span className="text-xs text-white/50">{progress}% Completed</span>
                           <button 
                             onClick={() => continueReading(plan, planDetails)}
                             className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1"
                           >
                             <PlayCircle size={14} /> Continue Reading
                           </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Discover Plans */}
          <div>
            <h2 className="text-xl font-bold mb-4 font-serif border-b border-white/10 pb-2">Discover New Plans</h2>
            {plans.filter(p => !activePlans[p.id]).length === 0 ? (
              <p className="text-white/30 italic text-sm">Check back later for new reading plans.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.filter(p => !activePlans[p.id]).map(plan => (
                  <div key={plan.id} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg mb-2">{plan.title}</h3>
                      <p className="text-sm text-white/60 mb-4 leading-relaxed line-clamp-3">{plan.description}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                      <span className="text-xs font-bold text-white/40">{plan.duration_days} Days</span>
                      <button 
                        onClick={() => enrollInPlan(plan)}
                        className="text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest hover:text-white transition flex items-center gap-1"
                      >
                        Enroll <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
