import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Team from './pages/Team';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <AppLayout><Projects /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <AppLayout><ProjectDetail /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/projects/:id/team" element={
            <ProtectedRoute>
              <AppLayout><Team /></AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
