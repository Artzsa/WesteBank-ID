import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Verification from './pages/Verification';
import Leaderboard from './pages/Leaderboard';
import Users from './pages/Users';
import Pickups from './pages/Pickups';
import Analytics from './pages/Analytics';
import Finances from './pages/Finances';
import Prices from './pages/Prices';
import Broadcast from './pages/Broadcast';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppLayout = ({ children }) => {
  return (
    <div className="drawer lg:drawer-open bg-[#f8faf6]">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-screen overflow-x-hidden">
        <Navbar />
        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div> 
      
      <div className="drawer-side z-50">
        <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <Sidebar />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/verification" element={
            <ProtectedRoute>
              <AppLayout><Verification /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <AppLayout><Leaderboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              <AppLayout><Users /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/pickups" element={
            <ProtectedRoute>
              <AppLayout><Pickups /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <AppLayout><Analytics /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout><Profile /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/finances" element={
            <ProtectedRoute>
              <AppLayout><Finances /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/prices" element={
            <ProtectedRoute>
              <AppLayout><Prices /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/broadcast" element={
            <ProtectedRoute>
              <AppLayout><Broadcast /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/rewards" element={
            <ProtectedRoute>
              <AppLayout><Rewards /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <ToastContainer 
          position="bottom-right" 
          theme="colored" 
          autoClose={3000}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
