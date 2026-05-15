import { ReactNode, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { nativeService } from './services/nativeService';
import Layout from './components/layout/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VersePopupProvider } from './components/BibleVersePopup';
import SEO from './components/SEO';
import NotFound from './components/NotFound';

// Lazy load pages for scalability
const Home = lazy(() => import('./pages/Home'));
const BibleReader = lazy(() => import('./pages/BibleReader'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Terms = lazy(() => import('./pages/legal/Terms'));
const AcceptableUse = lazy(() => import('./pages/legal/AcceptableUse'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));
const Copyright = lazy(() => import('./pages/legal/Copyright'));
const Credits = lazy(() => import('./pages/Credits'));
const About = lazy(() => import('./pages/legal/About'));
const Prayers = lazy(() => import('./pages/Prayers'));
const JPW = lazy(() => import('./pages/JPW'));
const Devotionals = lazy(() => import('./pages/Devotionals'));
const Articles = lazy(() => import('./pages/Articles'));
const StudyGroup = lazy(() => import('./pages/StudyGroup'));
const Forum = lazy(() => import('./pages/Forum'));
const Ebooks = lazy(() => import('./pages/Ebooks'));
const EbookReader = lazy(() => import('./pages/EbookReader'));
const StudyGroupDetail = lazy(() => import('./pages/StudyGroupDetail'));
const CategoryDetail = lazy(() => import('./pages/CategoryDetail'));
const ThreadDetail = lazy(() => import('./pages/ThreadDetail'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const VideoLessons = lazy(() => import('./pages/VideoLessons'));
const SermonArchive = lazy(() => import('./pages/SermonArchive'));
const MusicArchive = lazy(() => import('./pages/MusicArchive'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const ReadingPlansPage = lazy(() => import('./pages/ReadingPlansPage'));
const ScriptureMemory = lazy(() => import('./pages/ScriptureMemory'));
const BiblicalRoadmap = lazy(() => import('./pages/BiblicalRoadmap'));
const ElectsAI = lazy(() => import('./pages/ElectsAI'));
const JournalPage = lazy(() => import('./pages/JournalPage'));
const Notebook = lazy(() => import('./pages/Notebook'));
const StudyGuides = lazy(() => import('./pages/StudyGuides'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] gap-6">
    <div className="w-16 h-16 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
    <p className="text-[var(--color-primary)] font-serif italic text-lg animate-pulse">Illuminating the path...</p>
  </div>
);

function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode, adminOnly?: boolean }) {
  const { profile, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!profile) return <Navigate to="/profile" />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/" />;
  
  return children;
}

function NativeHandler({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Initial status bar setup
    nativeService.setStatusBar(true); // Default to dark for this app style
    
    // Hardware back button for Android/Native
    const unlisten = nativeService.initHardwareButtons(() => {
      if (window.location.pathname !== '/') {
        navigate(-1);
      }
    });

    return unlisten;
  }, [navigate]);

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <VersePopupProvider>
          <SEO />
          <Router>
            <NativeHandler>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/read" element={<BibleReader />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/prayers" element={<ProtectedRoute><Prayers /></ProtectedRoute>} />
                    <Route path="/jpw" element={<ProtectedRoute><JPW /></ProtectedRoute>} />
                    <Route path="/devotionals" element={<Devotionals />} />
                    <Route path="/articles" element={<Articles />} />
                    <Route path="/study-groups" element={<StudyGroup />} />
                    <Route path="/study-groups/:groupId" element={<StudyGroupDetail />} />
                    <Route path="/forum" element={<Forum />} />
                    <Route path="/forum/categories/:categoryId" element={<CategoryDetail />} />
                    <Route path="/threads/:threadId" element={<ThreadDetail />} />
                    <Route path="/ebooks" element={<Ebooks />} />
                    <Route path="/ebooks/:id" element={<EbookReader />} />
                    <Route path="/videos" element={<VideoLessons />} />
                    <Route path="/sermons" element={<SermonArchive />} />
                    <Route path="/music" element={<MusicArchive />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/plans" element={<ReadingPlansPage />} />
                    <Route path="/memory" element={<ProtectedRoute><ScriptureMemory /></ProtectedRoute>} />
                    <Route path="/roadmap" element={<ProtectedRoute><BiblicalRoadmap /></ProtectedRoute>} />
                    <Route path="/study-guides" element={<StudyGuides />} />
                    <Route path="/ai" element={<ElectsAI />} />
                    <Route path="/calendar" element={<CalendarView />} />
                    <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                    <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
                    <Route path="/notebook" element={<ProtectedRoute><Notebook /></ProtectedRoute>} />
                    
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/acceptable-use" element={<AcceptableUse />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                    <Route path="/copyright" element={<Copyright />} />
                    <Route path="/credits" element={<Credits />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </NativeHandler>
          </Router>
        </VersePopupProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}