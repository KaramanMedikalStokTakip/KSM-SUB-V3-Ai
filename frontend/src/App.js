import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import '@/index.css';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import POS from './pages/POS';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import PWAInstallBanner from './components/PWAInstallBanner';
import { supabase } from './lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session with Supabase Auth
    const initializeApp = async () => {
      try {
        // Get existing session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Fetch user details from users table
          const { data: userData, error } = await supabase
            .from('users')
            .select('id, username, email, role, branch, created_at')
            .eq('id', session.user.id)
            .single();
          
          if (!error && userData) {
            setUser(userData);
          }
        } else {
          // Fallback to localStorage for backward compatibility
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              setUser(JSON.parse(userData));
            } catch (e) {
              localStorage.removeItem('user');
            }
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error);
      }
      
      setLoading(false);
      
      // Load and apply theme on app initialization
      const savedTheme = localStorage.getItem('theme') || 'light';
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    };
    
    initializeApp();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, username, email, role, branch, created_at')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('user');
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route
            path="/*"
            element={
              user ? (
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/stock" element={<Stock />} />
                    <Route path="/pos" element={<POS />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
      <PWAInstallBanner />
    </AuthContext.Provider>
  );
}

export default App;
export { supabase };