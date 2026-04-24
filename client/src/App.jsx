import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import FocusPet from './components/FocusPet.jsx';

const Welcome        = lazy(() => import('./pages/Welcome.jsx'));
const Login          = lazy(() => import('./pages/Login.jsx'));
const Signup         = lazy(() => import('./pages/Signup.jsx'));
const Dashboard      = lazy(() => import('./pages/Dashboard.jsx'));
const Goals          = lazy(() => import('./pages/Goals.jsx'));
const Profile        = lazy(() => import('./pages/Profile.jsx'));
const AccountSettings = lazy(() => import('./pages/AccountSettings.jsx'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage.jsx'));
const People         = lazy(() => import('./pages/People.jsx'));
const Messages       = lazy(() => import('./pages/Messages.jsx'));
const GroupSessions  = lazy(() => import('./pages/GroupSessions.jsx'));
const GroupSessionRoom = lazy(() => import('./pages/GroupSessionRoom.jsx'));
const Quiz           = lazy(() => import('./pages/Quiz.jsx'));
const Files          = lazy(() => import('./pages/Files.jsx'));

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading…</div>;
  return user ? children : <Navigate to="/welcome" replace />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading…</div>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <ErrorBoundary>
      <ToastContainer />
      {user && <FocusPet />}
      <Navbar />

      <Suspense fallback={<div className="container">Loading…</div>}>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
          <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/users/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/people" element={<PrivateRoute><People /></PrivateRoute>} />
          <Route path="/quiz" element={<PrivateRoute><Quiz /></PrivateRoute>} />
          <Route path="/files" element={<PrivateRoute><Files /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/messages/:userId" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/group-sessions" element={<PrivateRoute><GroupSessions /></PrivateRoute>} />
          <Route path="/group-sessions/:id" element={<PrivateRoute><GroupSessionRoom /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><AccountSettings /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
