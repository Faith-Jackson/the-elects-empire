import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserSettings {
  themePreference: string;
  accentPreference?: string;
  fontSize: string;
  fontFamily: string;
  commentaryLayout: 'inline' | 'sidebar';
  bibleTranslation: string;
  lineSpacing: 'relaxed' | 'normal' | 'tight';
  textAlignment: 'left' | 'center' | 'justify';
  bgOpacity: number;
}

export interface UserProfile extends UserSettings {
  id: string; // Changed from uid to id to match Supabase
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  streak?: number;
  totalChaptersRead?: number;
  lastReadDate?: string;
  isOnline?: boolean;
  lastSeen?: any;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  settings: UserSettings;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateTheme: (theme: string) => Promise<void>;
  updateAccent: (accent: string) => Promise<void>;
  updateSetting: (key: keyof UserSettings, value: string | boolean | number) => Promise<void>;
  toggleAdminMode: () => void;
  isAdminMode: boolean;
}

const defaultSettings: UserSettings = {
  themePreference: 'amoled',
  accentPreference: 'default',
  fontSize: 'text-[17px] md:text-[19px]',
  fontFamily: 'font-serif',
  commentaryLayout: 'inline',
  bibleTranslation: 'KJV',
  lineSpacing: 'relaxed',
  textAlignment: 'left',
  bgOpacity: 40
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem('userSettings');
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      // JSON parse error
    }
    
    return {
      ...defaultSettings,
      themePreference: localStorage.getItem('guestThemePreference') || defaultSettings.themePreference,
      accentPreference: localStorage.getItem('guestAccentPreference') || defaultSettings.accentPreference
    };
  });

  // Toggle role helper
  const toggleAdminMode = () => setIsAdminMode(!isAdminMode);

  // Use isAdminMode in profile checks
  const effectiveProfile = isAdminMode 
    ? { ...profile!, role: 'admin' as const } 
    : profile;

  const applySettingsToDOM = (s: UserSettings) => {
    document.documentElement.setAttribute('data-theme', s.themePreference);
    document.documentElement.style.setProperty('--theme-bg-opacity', `${(s.bgOpacity ?? 40) / 100}`);
    if (s.accentPreference && s.accentPreference !== 'default') {
      document.documentElement.setAttribute('data-accent', s.accentPreference);
    } else {
      document.documentElement.removeAttribute('data-accent');
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is code for 'no rows returned'
        throw error;
      }

      if (data) {
        const profileData = data as UserProfile;
        setProfile(profileData);
        const updatedSettings: UserSettings = {
          themePreference: profileData.themePreference ?? settings.themePreference,
          accentPreference: profileData.accentPreference ?? settings.accentPreference,
          fontSize: profileData.fontSize ?? settings.fontSize,
          fontFamily: profileData.fontFamily ?? settings.fontFamily,
          commentaryLayout: profileData.commentaryLayout ?? settings.commentaryLayout,
          bibleTranslation: profileData.bibleTranslation ?? settings.bibleTranslation,
          lineSpacing: profileData.lineSpacing ?? settings.lineSpacing,
          textAlignment: profileData.textAlignment ?? settings.textAlignment,
          bgOpacity: profileData.bgOpacity ?? settings.bgOpacity
        };
        setSettings(updatedSettings);
        localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
        applySettingsToDOM(updatedSettings);
        
        // Update online status
        await supabase.from('profiles').update({ isOnline: true, lastSeen: new Date().toISOString() }).eq('id', userId);
      } else {
        // Create profile if it doesn't exist
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const newProfile: Partial<UserProfile> = {
            id: userId,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            role: session.user.email === 'i.am.the13thdisciple@gmail.com' ? 'admin' : 'user',
            isOnline: true,
            lastSeen: new Date().toISOString(),
            ...settings
          };
          const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
          if (insertError) throw insertError;
          setProfile(newProfile as UserProfile);
        }
      }
    } catch (e) {
      console.error("Error fetching/creating user profile:", e);
    }
  };

  useEffect(() => {
    applySettingsToDOM(settings);
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Real-time profile updates
    const profileSubscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as UserProfile;
            setProfile(data);
            const updatedSettings: UserSettings = {
              themePreference: data.themePreference ?? settings.themePreference,
              accentPreference: data.accentPreference ?? settings.accentPreference,
              fontSize: data.fontSize ?? settings.fontSize,
              fontFamily: data.fontFamily ?? settings.fontFamily,
              commentaryLayout: data.commentaryLayout ?? settings.commentaryLayout,
              bibleTranslation: data.bibleTranslation ?? settings.bibleTranslation,
              lineSpacing: data.lineSpacing ?? settings.lineSpacing,
              textAlignment: data.textAlignment ?? settings.textAlignment,
              bgOpacity: data.bgOpacity ?? settings.bgOpacity
            };
            setSettings(updatedSettings);
            localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
            applySettingsToDOM(updatedSettings);
          }
        }
      )
      .subscribe();

    // Heartbeat every 2 minutes
    const interval = setInterval(() => {
      supabase.from('profiles').update({ lastSeen: new Date().toISOString() }).eq('id', user.id);
    }, 120000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        supabase.from('profiles').update({ isOnline: true, lastSeen: new Date().toISOString() }).eq('id', user.id);
      } else {
        supabase.from('profiles').update({ isOnline: false }).eq('id', user.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      profileSubscription.unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      supabase.from('profiles').update({ isOnline: false }).eq('id', user.id);
    };
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        await supabase.from('profiles').update({ isOnline: false, lastSeen: new Date().toISOString() }).eq('id', user.id);
      }
      localStorage.removeItem('isDemoMode');
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: string | boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    applySettingsToDOM(newSettings);
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    
    if (key === 'themePreference') localStorage.setItem('guestThemePreference', String(value));
    if (key === 'accentPreference') localStorage.setItem('guestAccentPreference', String(value));
    
    if (user) {
      await supabase.from('profiles').update({ [key]: value }).eq('id', user.id);
    }
  };

  const updateTheme = async (theme: string) => updateSetting('themePreference', theme);
  const updateAccent = async (accent: string) => updateSetting('accentPreference', accent);

  return (
    <AuthContext.Provider value={{ user, profile: effectiveProfile, loading, settings, signInWithGoogle, logout, updateTheme, updateAccent, updateSetting, toggleAdminMode, isAdminMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
