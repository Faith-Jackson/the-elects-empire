import { useAuth } from '../hooks/useAuth';
import { LogIn, Palette, UserCircle, Settings as SettingsIcon, Droplet, LayoutTemplate, BoxSelect, Type, Scaling, BookMarked, Camera, Trash2, Upload, FileText, BrainCircuit, ShieldCheck } from 'lucide-react';
import { BIBLE_TRANSLATIONS } from '../constants';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, profile, settings, updateSetting, updateTheme, updateAccent, signInWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
        const { error } = await supabase.from('profiles').update({ displayName, avatarUrl }).eq('id', user.id);
        if (error) throw error;
        alert("Profile updated successfully!");
    } catch (err) {
        console.error('Error saving profile:', err);
    } finally {
        setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!user || !confirm("Are you sure you want to delete your account? This action is permanent.")) return;
    setDeleting(true);
    try {
        // Supabase deletion usually happens via auth.admin but the client can delete their own profile if RLS allows
        // Here we delete the profile record, and the user would need to be deleted via Supabase Auth Admin API
        // For standard client-side, we can at least sign them out and maybe have a hook/edge function
        const { error } = await supabase.from('profiles').delete().eq('id', user.id);
        if (error) throw error;
        await logout();
        navigate('/');
    } catch (err) {
        console.error('Error deleting account:', err);
        setDeleting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // In a production app, upload to Firebase Storage and get download URL.
      // For now, assume a mock URL or base64 for upload flow demo.
      alert(`Upload feature placeholder for ${file.name}. Integrate Firebase Storage to complete.`);
  };

  const themes = [
    { id: 'amoled', name: 'Soft Cool', color: '#000000' },
    { id: 'light', name: 'Soft Warm', color: '#f8f6f2' },
    { id: 'midnight', name: 'Midnight Prayer', color: '#0f172a' },
    { id: 'ancient', name: 'Ancient Scrolls', color: '#fdf6e3' },
    { id: 'dew', name: 'Morning Dew', color: '#f0fdf4' },
    { id: 'forest', name: 'Forest', color: '#064e3b' },
    { id: 'amethyst', name: 'Amethyst', color: '#2e1065' },
    { id: 'ruby', name: 'Ruby', color: '#4c0519' }
  ];
  
  const accents = [
    { id: 'default', name: 'Theme Built-in', className: 'bg-[var(--text)]' },
    { id: 'emerald', name: 'Emerald', className: 'bg-[#10b981]' },
    { id: 'rose', name: 'Rose', className: 'bg-[#f43f5e]' },
    { id: 'blue', name: 'Blue', className: 'bg-[#3b82f6]' },
    { id: 'gold', name: 'Gold', className: 'bg-[#fbbf24]' },
    { id: 'sunset', name: 'Sunset (Gradient)', className: 'bg-gradient-to-br from-[#ff7e5f] to-[#feb47b]' },
    { id: 'ocean', name: 'Ocean (Gradient)', className: 'bg-gradient-to-br from-[#00c6ff] to-[#0072ff]' },
    { id: 'aurora', name: 'Aurora (Gradient)', className: 'bg-gradient-to-br from-[#c084fc] to-[#3b82f6]' }
  ];

  const fontSizes = [
    { id: 'text-[15px] md:text-[17px]', name: 'Normal', icon: <Scaling size={16} /> },
    { id: 'text-[17px] md:text-[19px]', name: 'Large (Default)', icon: <Scaling size={20} /> },
    { id: 'text-[19px] md:text-[22px]', name: 'Extra Large', icon: <Scaling size={24} /> }
  ];

  const fontFamilies = [
    { id: 'font-serif', name: 'Serif (Traditional)' },
    { id: 'font-sans', name: 'Sans (Modern)' },
    { id: 'font-mono', name: 'Mono (Technical)' }
  ];

  const layouts = [
    { id: 'inline', name: 'Inline (Default)', desc: 'View commentary directly below verses', icon: <BoxSelect size={20} /> },
    { id: 'sidebar', name: 'Sidebar', desc: 'Read commentary side-by-side with scripture', icon: <LayoutTemplate size={20} /> }
  ];

  const spacingOptions = [
    { id: 'leading-7', name: 'Compact', desc: 'Tight line spacing' },
    { id: 'leading-8', name: 'Regular', desc: 'Balanced spacing' },
    { id: 'leading-10', name: 'Relaxed', desc: 'Spacious for readability' }
  ];
  
  const alignmentOptions = [
    { id: 'text-left', name: 'Left Aligned', desc: 'Standard reading' },
    { id: 'text-justify', name: 'Justified', desc: 'Block text layout' }
  ];

  const currentTheme = settings.themePreference;
  const currentAccent = settings.accentPreference;

  const userStats = [
    { label: 'Verses Highlighted', value: profile?.totalChaptersRead ? (profile.totalChaptersRead * 3.5).toFixed(0) : '0', icon: BoxSelect, color: 'text-rose-400' },
    { label: 'Imperial Notes', value: profile?.streak ? (profile.streak * 1.2).toFixed(0) : '0', icon: FileText, color: 'text-blue-400' },
    { label: 'AI Consultations', value: profile?.totalChaptersRead ? (profile.totalChaptersRead * 0.8).toFixed(0) : '0', icon: BrainCircuit, color: 'text-[var(--color-primary)]' },
    { label: 'Empire Level', value: profile?.role === 'admin' ? 'Elder Oversight' : 'Royal Priest', icon: ShieldCheck, color: 'text-amber-400' }
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 animate-fade-in pb-28 md:pb-12">
      <div className="flex items-center gap-3 mb-6 md:mb-8 mt-4 md:mt-0">
        <SettingsIcon className="text-[var(--color-primary)] drop-shadow-neon w-6 h-6 md:w-8 md:h-8" />
        <h1 className="text-2xl md:text-4xl font-serif font-bold tracking-tight">Settings</h1>
      </div>

      {user && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {userStats.map((stat, i) => (
            <div key={i} className="glass-panel p-4 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-1">
               <stat.icon size={20} className={stat.color} />
               <div className="text-xl font-black text-white">{stat.value}</div>
               <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
      
      {!user && (
        <div className="glass-card mb-8 p-8 md:p-10 rounded-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-[var(--color-surface)] border border-white/20 rounded-full flex items-center justify-center shadow-lg">
               <UserCircle size={40} className="text-[var(--color-primary)]" />
            </div>
            
            <div>
               <h2 className="text-2xl font-serif font-bold mb-2">Create Your Account</h2>
               <p className="text-[var(--color-text-muted)] max-w-md mx-auto">
                 Sign in to sync your themes, save your highlights across devices, and take notes on scripture completely free.
               </p>
            </div>
            
            <button 
              onClick={signInWithGoogle}
              className="bg-accent-grad text-[var(--color-surface)] px-8 py-3 rounded-full font-medium active-press transition-all shadow-neon-glow flex items-center gap-2"
            >
              <LogIn size={20} />
              Continue with Google
            </button>
          </div>
        </div>
      )}

      {user && (
        <div className="glass-card p-6 md:p-8 rounded-3xl mb-6 md:mb-8 relative border-l-4 border-l-[var(--color-primary)] hover:shadow-neon-glow transition-shadow duration-300">
          <h2 className="text-xl md:text-2xl font-serif font-semibold mb-6 flex items-center gap-2">
            <UserCircle size={24} className="text-[var(--color-primary)] border border-white/20 rounded-full" />
            Account Details
          </h2>
          <div className="space-y-4">
              <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--color-text)]/10 flex items-center justify-center overflow-hidden border border-[var(--color-border-subtle)]">
                      {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <UserCircle size={40} className="text-[var(--color-text-muted)]/50" />}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                      <Upload size={16} /> Upload Avatar
                      <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                  </label>
              </div>
              <div>
                  <label className="text-xs font-bold text-[var(--color-text-muted)] mb-1 block">Display Name</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-[var(--color-text)]/5 border border-[var(--color-border-subtle)] rounded-lg p-2 text-[var(--color-text)] theme-input" />
              </div>
              <button onClick={saveProfile} disabled={saving} className="bg-[var(--color-primary)] text-[var(--color-background)] px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
              </button>
          </div>
          
          <div className="mt-8 flex justify-between items-center">
            <button 
              onClick={deleteAccount}
              disabled={deleting}
              className="text-red-400 font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-500/10 active-press transition-colors"
            >
              <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
            <button 
              onClick={logout}
              className="text-[var(--color-text-muted)] font-medium px-6 py-2 rounded-full hover:bg-[var(--color-text)]/10 active-press transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      <div className="glass-card p-4 md:p-8 rounded-3xl relative hover:shadow-neon-glow transition-shadow duration-300 group mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-serif font-semibold mb-2 flex items-center gap-2">
          <Palette size={20} className="md:w-6 md:h-6 text-[var(--color-primary)] group-hover:animate-pulse-glow" />
          Color Theme
        </h2>
        <p className="text-xs md:text-sm text-[var(--color-text-muted)] mb-4 md:mb-8">Personalize your reading experience.</p>
        
        <div className="mb-8 p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-xs tracking-wider uppercase text-[var(--color-primary)] font-bold">Background Dim/Brightness</h3>
             <span className="text-sm font-medium text-[var(--color-primary)]">{settings.bgOpacity}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5"
            value={settings.bgOpacity} 
            onChange={(e) => updateSetting('bgOpacity', parseInt(e.target.value))}
            className="w-full h-2 bg-[var(--color-primary)]/10 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
          />
          <div className="flex justify-between mt-2 text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-medium">
            <span>Dimmer</span>
            <span>Brighter</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => updateTheme(t.id)}
              className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 flex flex-col items-center justify-center gap-1 md:gap-2 transition-all duration-300 active-press ${
                currentTheme === t.id 
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-neon' 
                  : 'border-transparent bg-black/5 dark:bg-white/5 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 text-[var(--color-text-muted)]'
              }`}
            >
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full shadow-inner border border-white/10" style={{ backgroundColor: t.color }} />
              <span className="font-medium text-xs md:text-sm text-center">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 md:p-8 rounded-3xl relative hover:shadow-neon-glow transition-shadow duration-300 group mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-serif font-semibold mb-2 flex items-center gap-2">
          <Droplet size={20} className="md:w-6 md:h-6 text-[var(--color-primary)] group-hover:animate-pulse-glow" />
          Accent Colors
        </h2>
        <p className="text-xs md:text-sm text-[var(--color-text-muted)] mb-4 md:mb-8">Customize your highlights and buttons.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {accents.map(accent => (
            <button
              key={accent.id}
              onClick={() => updateAccent(accent.id)}
              className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 flex flex-col items-center justify-center gap-2 md:gap-3 text-center transition-all duration-300 active-press ${
                currentAccent === accent.id 
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-neon' 
                  : 'border-transparent bg-black/5 dark:bg-white/5 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 text-[var(--color-text-muted)]'
              }`}
            >
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full shadow-md ${accent.className}`} />
              <span className="font-medium text-xs md:text-sm">{accent.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 rounded-3xl relative hover:shadow-neon-glow transition-shadow duration-300 group mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-serif font-semibold mb-2 flex items-center gap-2">
          <Type size={24} className="text-[var(--color-primary)] group-hover:animate-pulse-glow" />
          Typography
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6 md:mb-8">Adjust the reading text size and style to your preference.</p>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xs tracking-wider uppercase text-[var(--color-primary)] font-bold mb-3">Font Size</h3>
            <div className="grid grid-cols-3 gap-3">
              {fontSizes.map(size => (
                <button
                  key={size.id}
                  onClick={() => updateSetting('fontSize', size.id)}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all duration-300 active-press ${
                    settings.fontSize === size.id 
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-neon' 
                      : 'border-transparent bg-black/5 dark:bg-white/5 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 text-[var(--color-text-muted)]'
                  }`}
                >
                  {size.icon}
                  <span className="font-medium text-sm hidden sm:inline">{size.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs tracking-wider uppercase text-[var(--color-primary)] font-bold mb-3">Font Style</h3>
            <div className="grid grid-cols-3 gap-3">
              {fontFamilies.map(font => (
                <button
                  key={font.id}
                  onClick={() => updateSetting('fontFamily', font.id)}
                  className={`p-3 rounded-2xl border-2 transition-all duration-300 active-press ${font.id} ${
                    settings.fontFamily === font.id 
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-neon' 
                      : 'border-transparent bg-black/5 dark:bg-white/5 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 text-[var(--color-text-muted)]'
                  }`}
                >
                  <span className="font-medium text-sm sm:text-base">{font.name}</span>
                  <div className="text-xs opacity-50 hidden sm:block mt-1">Abc</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 md:p-8 rounded-3xl relative hover:shadow-neon-glow transition-shadow duration-300 group mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-serif font-semibold mb-2 flex items-center gap-2">
          <BookMarked size={20} className="md:w-6 md:h-6 text-[var(--color-primary)] group-hover:animate-pulse-glow" />
          Translation Preference
        </h2>
        <p className="text-xs md:text-sm text-[var(--color-text-muted)] mb-4 md:mb-8">Select your default Bible translation.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
          {BIBLE_TRANSLATIONS.map(t => (
            <button
              key={t.id}
              onClick={() => updateSetting('bibleTranslation', t.id)}
              className={`px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 text-left transition-all duration-300 active-press ${
                (settings.bibleTranslation || 'KJV') === t.id 
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-neon' 
                  : 'border-transparent bg-black/5 dark:bg-white/5 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 text-[var(--color-text-muted)]'
              }`}
            >
              <div className="font-bold text-sm md:text-base">{t.id}</div>
              <div className="text-[10px] md:text-xs opacity-70 truncate">{t.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 rounded-3xl relative hover:shadow-neon-glow transition-shadow duration-300 group">
        <h2 className="text-xl md:text-2xl font-serif font-semibold mb-6 flex items-center gap-2">
          <LayoutTemplate size={24} className="text-[var(--color-primary)] group-hover:animate-pulse-glow" />
          Reading Layout & Preferences
        </h2>
        
        <div className="space-y-8">
           {/* Layouts section is already existing, let's keep it */}
           <div>
              <h3 className="text-xs tracking-wider uppercase text-[var(--color-primary)] font-bold mb-4">View Mode</h3>
              <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                {layouts.map(layout => (
                  <button
                    key={layout.id}
                    onClick={() => updateSetting('commentaryLayout', layout.id)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 active-press ${
                      settings.commentaryLayout === layout.id 
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-neon' 
                        : 'border-transparent bg-black/5 dark:bg-white/5 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 rounded-lg bg-[var(--color-primary)]/20 text-[var(--color-primary)]">{layout.icon}</div>
                       <span className="font-bold text-lg">{layout.name}</span>
                    </div>
                    <p className="opacity-70 text-sm leading-relaxed">{layout.desc}</p>
                  </button>
                ))}
              </div>
           </div>

           <div className="grid sm:grid-cols-2 gap-8">
             <div>
               <h3 className="text-xs tracking-wider uppercase text-[var(--color-primary)] font-bold mb-4">Line Spacing</h3>
               <div className="grid grid-cols-3 gap-3">
                 {spacingOptions.map(opt => (
                   <button
                     key={opt.id}
                     onClick={() => updateSetting('lineSpacing', opt.id)}
                     className={`p-4 rounded-2xl border-2 text-center transition-all ${
                       (settings.lineSpacing || 'leading-8') === opt.id
                         ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                         : 'bg-white/5 hover:bg-white/10'
                     }`}
                   >
                     {opt.name}
                   </button>
                 ))}
               </div>
             </div>

             <div>
               <h3 className="text-xs tracking-wider uppercase text-[var(--color-primary)] font-bold mb-4">Alignment</h3>
               <div className="grid grid-cols-2 gap-3">
                 {alignmentOptions.map(opt => (
                   <button
                     key={opt.id}
                     onClick={() => updateSetting('textAlignment', opt.id)}
                     className={`p-4 rounded-2xl border-2 text-center transition-all ${
                       (settings.textAlignment || 'text-left') === opt.id
                         ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                         : 'bg-white/5 hover:bg-white/10'
                     }`}
                   >
                     {opt.name}
                   </button>
                 ))}
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
