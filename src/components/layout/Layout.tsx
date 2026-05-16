import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { BookOpen, Home as HomeIcon, Settings, PenTool, LayoutDashboard, Calendar, FileText, Book, Video, Mic, Map, Bell, Menu, LogIn, User, Search, Sun, Library, Layers, Users, BookMarked, BrainCircuit, ChevronDown, ChevronUp, ChevronRight, UserPlus, MessageSquare, HandHelping, ListChecks, BookOpenText, Shield, Award, Music, Command, GraduationCap, Feather } from 'lucide-react';
import { useState } from 'react';
import CommandSearch from '../CommandSearch';
import AppLogo from '../AppLogo';
import { Logo } from '../Logo';
import GuidedTour from '../GuidedTour';
import FloatingActionMenu from '../FloatingActionMenu';

export default function Layout() {
  const { profile, user, logout, toggleAdminMode, isAdminMode } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Handle scroll to hide/show header
  const handleScroll = (e: any) => {
    const currentScrollY = e.target.scrollTop;
    
    // Maintain visibility on home page for hero section
    if (location.pathname === '/') {
      setIsHeaderVisible(true);
      setLastScrollY(currentScrollY);
      return;
    }

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
    setLastScrollY(currentScrollY);
  };

  // Get initials for avatar
  const initials = user ? (profile?.displayName ? profile.displayName.substring(0, 2).toUpperCase() : '??') : '';

  const [activePopover, setActivePopover] = useState<string | null>(null);

  const coreLinks = [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/read', icon: BookOpen, label: 'Read' },
    { to: '/ai', icon: BrainCircuit, label: 'Elects AI' },
  ];

  const libraryLinks = [
    { to: '/devotionals', icon: Sun, label: 'Devotional', description: 'Life & Immortality' },
    { to: '/articles', icon: FileText, label: 'Articles', description: 'Deep findings' },
    { to: '/ebooks', icon: BookOpenText, label: 'Ebooks', description: 'Resources' },
    { to: '/videos', icon: Video, label: 'Lessons', description: 'Video series' },
    { to: '/sermons', icon: Mic, label: 'Sermons', description: 'Messages' },
    { to: '/music', icon: Music, label: 'Melodies', description: 'Sacred songs' },
  ];

  const communityLinks = [
    { to: '/jpw', icon: Feather, label: 'JPW', description: 'Journey of Prophetic Words' },
    { to: '/prayers', icon: HandHelping, label: 'Prayers', description: 'Join in prayer' },
    { to: '/study-groups', icon: UserPlus, label: 'Groups', description: 'Connect' },
    { to: '/forum', icon: MessageSquare, label: 'Forum', description: 'Discuss' },
  ];

  const utilityLinks = [
    { to: '/notebook', icon: PenTool, label: 'Notebook', description: 'Full rich notebook' },
    { to: '/study-guides', icon: GraduationCap, label: 'Study Guides', description: 'Curated paths' },
    { to: '/plans', icon: ListChecks, label: 'Plans', description: 'Reading plans' },
    { to: '/calendar', icon: Calendar, label: 'Events', description: 'Gatherings' },
  ];

  return (
    <div className="flex w-full h-[100dvh] bg-[var(--color-background)] text-[var(--color-text)] overflow-hidden transition-colors duration-500 relative">
      <CommandSearch isOpen={searchOpen} setIsOpen={setSearchOpen} />
      
      {/* Dynamic Nature Background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: 'var(--theme-bg-image)',
          opacity: 'var(--theme-bg-opacity, 0.4)'
        }}
      ></div>

      {/* Subtle Ambient Light */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary)] opacity-5 blur-[150px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary)] opacity-5 blur-[150px] animate-blob animation-delay-2000" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-16 hover:w-56 glass-panel border-r border-[var(--color-border-subtle)] flex-col py-6 z-20 shrink-0 transition-all duration-500 overflow-y-auto group">
        <div className="flex items-center justify-center mb-6">
            <Link to="/" className="flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                <AppLogo className="w-8 h-8 group-hover:w-10 group-hover:h-10 transition-all duration-500 text-[var(--color-primary)] drop-shadow-neon" />
            </Link>
        </div>
        
        <nav className="flex-1 flex flex-col gap-1 text-[var(--color-text-muted)] w-full px-3">
          <div className="flex flex-col gap-1 mb-4">
            {coreLinks.map(link => {
              const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
              const targetId = `sidebar-${link.to.replace('/', '') || 'home'}`;
              return (
                <Link key={link.to} to={link.to} id={targetId} title={link.label} className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-300 ${isActive ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-neon-glow' : 'hover:bg-[var(--color-text)]/5 hover:text-[var(--color-text)]'}`}>
                  <link.icon size={20} className="shrink-0" />
                  <span className="w-0 group-hover:w-auto overflow-hidden text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500">{link.label}</span>
                </Link>
              )
            })}
          </div>
          
          <div className="flex flex-col gap-1">
            {[
              { id: 'library', title: 'Library', links: libraryLinks, icon: Library },
              { id: 'community', title: 'Community', icon: Users, links: communityLinks },
              { id: 'utility', title: 'Utilities', icon: Layers, links: utilityLinks }
            ].map((group) => (
              <div key={group.id} className="w-full">
                <button 
                  onClick={() => setActivePopover(activePopover === group.id ? null : group.id)}
                  className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-300 ${activePopover === group.id ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-neon-glow' : 'hover:bg-[var(--color-text)]/5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                >
                  <group.icon size={20} className={`shrink-0 ${activePopover === group.id ? 'text-[var(--color-primary)]' : ''}`} />
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="w-0 group-hover:w-auto overflow-hidden text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500">{group.title}</span>
                    <ChevronDown size={14} className={`hidden group-hover:block transition-transform duration-300 ${activePopover === group.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {activePopover === group.id && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-1 ml-6 pl-4 border-l border-white/5 my-1 py-1">
                        {group.links.map(link => {
                          const subTargetId = `sidebar-${link.to.replace('/', '')}`;
                          return (
                            <Link 
                              key={link.to} 
                              to={link.to} 
                              id={subTargetId}
                              className={`flex items-center gap-3 p-2 rounded-lg transition-all text-xs ${location.pathname === link.to ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/5 font-bold' : 'hover:text-[var(--color-primary)] hover:bg-[var(--color-text)]/5'}`}
                            >
                              <link.icon size={14} className="shrink-0" />
                              <span className="w-0 group-hover:w-full overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-500 truncate whitespace-nowrap">{link.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          
          <div className="mt-auto space-y-1 pt-4 border-t border-[var(--color-border-subtle)]">
            <Link to="/profile" className="flex items-center gap-4 px-3 py-2.5 hover:bg-[var(--color-text)]/5 rounded-xl transition-all text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                <Settings size={20} className="shrink-0" /> 
                <span className="w-0 group-hover:w-auto overflow-hidden text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500">Settings</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 z-10 transition-all duration-500 pt-[72px] md:pt-0">
        {/* Top Header Bar */}
        <header className={`h-[72px] glass-panel border-b border-[var(--color-border-subtle)] flex items-center px-4 md:px-8 justify-between shrink-0 fixed md:sticky top-0 w-full z-30 transition-all duration-500 ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-4">
            <AppLogo size={28} className="md:hidden" />
            <h1 className="font-serif text-base md:text-lg italic text-[var(--color-text)] truncate max-w-[150px] md:max-w-none">
                {profile?.displayName && (
                  <>
                    <span className="hidden sm:inline">Welcome, {profile.displayName}</span>
                    <span className="sm:hidden">Hello, {profile.displayName.split(' ')[0]}</span>
                  </>
                )}
             </h1>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-4">
             <button onClick={() => setSearchOpen(true)} className={`p-2 rounded-full transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-primary)]`}>
                <Search size={22} />
             </button>
             
             {/* Temporary Role Switcher */}
             {/* <button onClick={toggleAdminMode} className={`text-xs px-2 py-1 rounded ${isAdminMode ? 'bg-red-900/50 text-red-100' : 'bg-[var(--color-text)]/10'}`}>Admin: {isAdminMode ? 'On' : 'Off'}</button> */}
             
             <Link to="/notifications" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"><Bell size={20} className="hover:animate-swing"/></Link>
             {user ? (
               <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-clay)] flex items-center justify-center text-white font-bold text-xs uppercase cursor-pointer relative group shadow-neon-glow ring-2 ring-[var(--color-text)]/20">
                 {initials}
                 <div className="absolute top-12 right-0 glass-panel shadow-2xl rounded-xl border border-[var(--color-border-subtle)] w-40 py-2 hidden group-hover:block z-50 text-[var(--color-text)] text-sm animate-fade-in">
                   <Link to="/profile" className="block w-full text-left px-4 py-2 hover:bg-[var(--color-text)]/10">Profile Settings</Link>
                   <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-[var(--color-text)]/10 text-red-400">Sign Out</button>
                 </div>
               </div>
             ) : (
                <Link to="/profile" className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all group">
                  <LogIn size={22} className="group-hover:scale-110 transition-transform" />
                </Link>
             )}
           </div>
         </header>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden fixed inset-0 backdrop-blur-sm z-40"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="md:hidden fixed bottom-0 left-0 right-0 h-[80vh] glass-panel border-t border-[var(--color-border-subtle)] rounded-t-[2.5rem] z-[60] shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="w-12 h-1.5 bg-[var(--color-text-muted)]/20 rounded-full mx-auto my-4 shrink-0" />
                
                <div className="flex-1 overflow-y-auto px-6 pb-24">
                  <div className="flex items-center gap-4 mb-8">
                     <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="group relative">
                        <div className="absolute inset-0 bg-[var(--color-primary)]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                        <AppLogo size={60} className="relative z-10 transition-transform duration-500 group-hover:scale-110" />
                     </Link>
                     <div>
                       <h3 className="font-serif font-bold text-xl text-[var(--color-text)]">{user ? (profile?.displayName || 'Royal Priest') : <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="text-[var(--color-primary)] hover:underline">Sign In</Link>}</h3>
                       <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-black">{user ? 'Spiritual Citizen' : 'Guest Traveler'}</p>
                     </div>
                  </div>

                  <nav className="flex flex-col gap-1">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {coreLinks.map(link => (
                        <Link 
                          key={link.to} 
                          to={link.to} 
                          onClick={() => setMobileMenuOpen(false)} 
                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${location.pathname === link.to ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]' : 'bg-[var(--color-text)]/5 border-transparent text-[var(--color-text-muted)]'}`}
                        >
                          <link.icon size={20} />
                          <span className="text-xs font-bold uppercase tracking-tighter">{link.label}</span>
                        </Link>
                      ))}
                    </div>

                    <div className="space-y-2">
                       <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-muted)] px-2 mb-2">Sanctuary Libraries</p>
                       {[
                         { id: 'library', title: 'Library', links: libraryLinks, icon: Library },
                         { id: 'community', title: 'Community', icon: Users, links: communityLinks },
                         { id: 'utility', title: 'Utilities', icon: Layers, links: utilityLinks }
                       ].map((group) => (
                         <div key={group.id} className="w-full">
                           <button 
                             onClick={() => setActivePopover(activePopover === group.id ? null : group.id)}
                             className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activePopover === group.id ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20' : 'bg-[var(--color-text)]/5 text-[var(--color-text)] hover:bg-[var(--color-text)]/10 border border-transparent'}`}
                           >
                             <div className="flex items-center gap-4">
                               <group.icon size={20} /> 
                               <span className="font-bold">{group.title}</span>
                             </div>
                             <ChevronDown size={18} className={`transition-transform duration-300 ${activePopover === group.id ? 'rotate-180' : ''}`} />
                           </button>

                           <AnimatePresence initial={false}>
                             {activePopover === group.id && (
                               <motion.div 
                                 initial={{ height: 0 }}
                                 animate={{ height: 'auto' }}
                                 exit={{ height: 0 }}
                                 transition={{ duration: 0.3, ease: 'easeInOut' }}
                                 className="overflow-hidden"
                               >
                                 <div className="bg-[var(--color-text)]/5 rounded-2xl overflow-hidden mt-1 space-y-px">
                                   {group.links.map(link => (
                                     <Link 
                                       key={link.to} 
                                       to={link.to} 
                                       onClick={() => setMobileMenuOpen(false)} 
                                       className={`flex items-center gap-4 px-6 py-4 transition-all ${location.pathname === link.to ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/5 font-bold' : 'text-[var(--color-text)]'}`}
                                     >
                                       <link.icon size={18} /> 
                                       <div className="flex flex-col">
                                         <span className="text-sm font-medium">{link.label}</span>
                                         <span className="text-[10px] opacity-70 font-normal">{link.description}</span>
                                       </div>
                                     </Link>
                                   ))}
                                 </div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                         </div>
                       ))}
                    </div>
                    
                    <div className="mt-8 space-y-4">
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-text)]/5 text-[var(--color-text)] transition-all">
                        <Settings size={20} /> 
                        <span className="font-bold">Settings & Profile</span>
                      </Link>

                      {/* Legal Links for Mobile */}
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-muted)] px-4 mb-2">Legal</p>
                      <div className="grid grid-cols-3 gap-2 px-6">
                        <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">About</Link>
                        <Link to="/privacy" onClick={() => setMobileMenuOpen(false)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">Privacy</Link>
                        <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">Terms</Link>
                        <Link to="/acceptable-use" onClick={() => setMobileMenuOpen(false)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">Acceptable Use</Link>
                        <Link to="/cookies" onClick={() => setMobileMenuOpen(false)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">Cookies</Link>
                        <Link to="/copyright" onClick={() => setMobileMenuOpen(false)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">Copyright</Link>
                      </div>

                      {user && (
                        <button onClick={logout} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-500/10 text-rose-400 transition-all">
                          <LogIn size={20} className="rotate-180" /> 
                          <span className="font-bold">Sign Out</span>
                        </button>
                      )}
                    </div>
                  </nav>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Workspace content bounds */}
        <div 
          onScroll={handleScroll}
          className="flex-1 bg-transparent overflow-y-auto overflow-x-hidden flex flex-col relative w-full h-full pb-mobile-nav md:pb-0"
        >
           <AnimatePresence mode="wait">
             <motion.div
               key={location.pathname}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="w-full h-full"
             >
               <Outlet />
             </motion.div>
           </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] glass-panel border-t border-[var(--color-border-subtle)] z-50 flex justify-around items-center px-2 pb-safe">
         <Link to="/" className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${location.pathname === '/' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
           <HomeIcon size={location.pathname === '/' ? 24 : 22} className={location.pathname === '/' ? 'drop-shadow-neon' : ''} />
           <span className="text-[10px] font-medium">Home</span>
         </Link>
         <Link to="/dashboard" className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${location.pathname === '/dashboard' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
           <LayoutDashboard size={location.pathname === '/dashboard' ? 24 : 22} className={location.pathname === '/dashboard' ? 'drop-shadow-neon' : ''} />
           <span className="text-[10px] font-medium">Dashboard</span>
         </Link>
         <Link to="/read" className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${location.pathname === '/read' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
           <BookOpen size={location.pathname === '/read' ? 24 : 22} className={location.pathname === '/read' ? 'drop-shadow-neon' : ''} />
           <span className="text-[10px] font-medium">Read</span>
         </Link>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${mobileMenuOpen ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
           <Menu size={mobileMenuOpen ? 24 : 22} />
           <span className="text-[10px] font-medium">More</span>
         </button>
      </div>

      <FloatingActionMenu />
      <GuidedTour />
    </div>
  );
}
