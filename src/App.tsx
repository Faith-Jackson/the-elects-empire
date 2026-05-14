import { ReactNode, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { nativeService } from './services/nativeService';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import BibleReader from './pages/BibleReader';
import SearchPage from './pages/SearchPage';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Terms from './pages/legal/Terms';
import AcceptableUse from './pages/legal/AcceptableUse';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import Copyright from './pages/legal/Copyright';
import Credits from './pages/Credits';
import About from './pages/legal/About';
import Prayers from './pages/Prayers';
import JPW from './pages/JPW';
import Devotionals from './pages/Devotionals';
import Articles from './pages/Articles';
import StudyGroup from './pages/StudyGroup';
import Forum from './pages/Forum';
import Ebooks from './pages/Ebooks';
import EbookReader from './pages/EbookReader';
import StudyGroupDetail from './pages/StudyGroupDetail';
import CategoryDetail from './pages/CategoryDetail';
import ThreadDetail from './pages/ThreadDetail';
import NotificationsPage from './pages/NotificationsPage';
import VideoLessons from './pages/VideoLessons';
import SermonArchive from './pages/SermonArchive';
import MusicArchive from './pages/MusicArchive';
import CalendarView from './pages/CalendarView';
import UserDashboard from './pages/UserDashboard';
import ReadingPlansPage from './pages/ReadingPlansPage';
import ScriptureMemory from './pages/ScriptureMemory';
import BiblicalRoadmap from './pages/BiblicalRoadmap';
import ElectsAI from './pages/ElectsAI';
import JournalPage from './pages/JournalPage';
import Notebook from './pages/Notebook';
import StudyGuides from './pages/StudyGuides';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VersePopupProvider } from './components/BibleVersePopup';

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
          <Router>
            <NativeHandler>
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
              </Route>
            </Routes>
            </NativeHandler>
          </Router>
        </VersePopupProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}