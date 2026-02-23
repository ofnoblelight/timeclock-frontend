import { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './theme';
import { handleAuthRedirect, getToken, getUser, setUser, clearAuth } from './auth';
import { authRefresh } from './api';
import ClockScreen from './components/ClockScreen';
import HoursScreen from './components/HoursScreen';
import AdminScreen from './components/AdminScreen';
import SettingsPanel from './components/SettingsPanel';
import Nav from './components/Nav';

function AuthGate({ children }) {
  const { c } = useTheme();
  const [state, setState] = useState('loading'); // loading | authenticated | unauthenticated
  const [user, setUserState] = useState(null);

  useEffect(() => {
    const token = handleAuthRedirect();

    if (!token) {
      setState('unauthenticated');
      return;
    }

    // Try to refresh / validate token and get user info
    const cachedUser = getUser();
    if (cachedUser) {
      setUserState(cachedUser);
      setState('authenticated');
      return;
    }

    // Refresh token to get user data
    authRefresh(token)
      .then((data) => {
        setUser(data.user);
        setUserState(data.user);
        setState('authenticated');
      })
      .catch(() => {
        // Token is valid (didn't get 401 from middleware),
        // just proceed without cached user
        setUserState({ name: 'User', role: 'user' });
        setState('authenticated');
      });
  }, []);

  if (state === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: c.bg, color: c.text3, fontSize: 15,
      }}>
        Loading...
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: c.bg, color: c.text, padding: 24, gap: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, fontWeight: 700 }}>Timeclock Basics</div>
        <div style={{ fontSize: 15, color: c.text3, maxWidth: 300, lineHeight: 1.5 }}>
          Open this app from your GoHighLevel account to get started.
        </div>
        <div style={{ width: 40, height: 2, background: c.accent, borderRadius: 1, opacity: 0.5, marginTop: 8 }} />
        <div style={{ fontSize: 13, color: c.text3, marginTop: 12 }}>
          No access token found.
        </div>
      </div>
    );
  }

  return children(user);
}

function AppShell({ user }) {
  const { c } = useTheme();
  const [tab, setTab] = useState('clock');
  const [showSettings, setShowSettings] = useState(false);
  const isAdmin = user?.role === 'admin';

  // If non-admin tries to view admin tab, redirect
  useEffect(() => {
    if (tab === 'admin' && !isAdmin) setTab('clock');
  }, [tab, isAdmin]);

  return (
    <div style={{
      maxWidth: 460, margin: '0 auto', minHeight: '100vh',
      background: c.bg, color: c.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, paddingBottom: 68 }}>
        {tab === 'clock' && <ClockScreen user={user} />}
        {tab === 'hours' && <HoursScreen />}
        {tab === 'admin' && isAdmin && <AdminScreen onSettings={() => setShowSettings(true)} />}
      </div>

      <Nav tab={tab} setTab={setTab} isAdmin={isAdmin} />

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthGate>
        {(user) => <AppShell user={user} />}
      </AuthGate>
    </ThemeProvider>
  );
}
