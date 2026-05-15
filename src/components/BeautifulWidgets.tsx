import { motion } from 'motion/react';
import { Activity, Users, Heart, Zap } from 'lucide-react';

export function SpiritualPulse() {
  const activities = [
    { label: 'Citizens Online', value: '1,248', icon: Users, color: 'text-cyan-400' },
    { label: 'Prayers Today', value: '342', icon: Heart, color: 'text-rose-400' },
    { label: 'Chapters Read', value: '5,892', icon: Activity, color: 'text-emerald-400' },
    { label: 'Rhemas Shared', value: '89', icon: Zap, color: 'text-amber-400' },
  ];

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border-subtle)] bg-black group/pulse">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 group-hover/pulse:scale-110 transition-transform duration-[10s] ease-linear"
        style={{ backgroundImage: 'url(/assets/images/spiritual_pulse.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/40 to-transparent" />

      <div className="relative z-10 p-8 md:p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <h3 className="font-serif font-bold text-xl text-white">Empire Pulse</h3>
          <span className="text-[10px] uppercase tracking-widest text-cyan-400/70 font-black">Live Spiritual Activity</span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {activities.map((item, idx) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-1"
            >
              <div className="flex items-center gap-2">
                <item.icon size={14} className={item.color} />
                <span className="text-2xl font-bold text-white tracking-tighter">{item.value}</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{item.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
           <div className="flex -space-x-2">
             {[1,2,3,4,5].map(i => (
               <div key={i} className="w-6 h-6 rounded-full border border-black bg-white/10 backdrop-blur-sm overflow-hidden">
                 <img src={`https://i.pravatar.cc/100?u=pulse${i}`} alt="user" />
               </div>
             ))}
           </div>
           <span className="text-[9px] uppercase tracking-tighter text-white/30 font-bold">Connecting the saints...</span>
        </div>
      </div>
    </div>
  );
}

export function SacredBanner() {
  return (
    <div className="relative w-full h-[250px] md:h-[300px] overflow-hidden rounded-[3rem] border border-[var(--color-border-subtle)] bg-black group/banner">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-60 group-hover/banner:scale-105 transition-transform duration-[20s] ease-linear"
        style={{ backgroundImage: 'url(/assets/images/sacred_banner.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 backdrop-blur-md mb-2">
            <Zap size={12} className="text-amber-400 animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.3em] text-amber-400 uppercase">Scripture illumination</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight glow-text-white italic">
            "The Word was with God, <br /> and the Word was God."
          </h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/50 font-black">John 1:1 • The Foundational Rhema</p>
        </motion.div>
      </div>
    </div>
  );
}
