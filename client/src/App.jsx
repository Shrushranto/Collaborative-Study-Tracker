import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';

import ToastContainer from './components/ToastContainer.jsx';
import AIChatbot from './components/AIChatbot.jsx';
import FocusPet from './components/FocusPet.jsx';
import Welcome from './pages/Welcome.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Goals from './pages/Goals.jsx';
import Profile from './pages/Profile.jsx';
import AccountSettings from './pages/AccountSettings.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import People from './pages/People.jsx';
import Messages from './pages/Messages.jsx';
import GroupSessions from './pages/GroupSessions.jsx';
import GroupSessionRoom from './pages/GroupSessionRoom.jsx';
import Quiz from './pages/Quiz.jsx';
import Files from './pages/Files.jsx';

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

function PersistentFocusPet() {
  return <FocusPet />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <ToastContainer />
      {/* <AIChatbot /> */}
      {user && <PersistentFocusPet />}
      <Navbar />

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
    </>
  );
}
