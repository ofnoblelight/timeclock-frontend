import { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './theme';
import { handleAuthRedirect, getToken, getUser, setToken, setUser, clearAuth } from './auth';
import { authRefresh } from './api';
import ClockScreen from './components/ClockScreen';
import HoursScreen from './components/HoursScreen';
import AdminScreen from './components/AdminScreen';
import SettingsPanel from './components/SettingsPanel';
import Nav from './components/Nav';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const GHL_APP_ID = '699cbb983dff6c4ed7aa685c';

// Request SSO session from GHL parent window
function requestGhlSso() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('SSO timeout')), 5000);

    function handler(event) {
      console.log('SSO: received message', event.origin, event.data);
      if (event.data && event.data.message === 'REQUEST_USER_DATA_RESPONSE') {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve(event.data.payload);
      }
    }

    window.addEventListener('message', handler);
    console.log('SSO: sending REQUEST_USER_DATA to parent');

    // Ask GHL parent for session data
    window.parent.postMessage({ message: 'REQUEST_USER_DATA' }, '*');
  });
}

// Exchange encrypted session data for our JWT
async function ssoLogin(sessionData) {
  const res = await fetch(`${API_URL}/api/auth/sso`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionData }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'SSO failed');
  }

  return res.json();
}

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

function AuthGate({ children }) {
  const { c } = useTheme();
  const [state, setState] = useState('loading');
  const [user, setUserState] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function authenticate() {
      // 1. Check URL for token (OAuth redirect)
      const urlToken = handleAuthRedirect();

      if (urlToken) {
        // Try refresh to get user data
        try {
          const data = await authRefresh(urlToken);
          setUser(data.user);
          setUserState(data.user);
          setState('authenticated');
          return;
        } catch {
          setUserState({ name: 'User', role: 'admin' });
          setState('authenticated');
          return;
        }
      }

      // 2. Check existing token in storage
      const existingToken = getToken();
      if (existingToken) {
        const cachedUser = getUser();
        if (cachedUser) {
          setUserState(cachedUser);
          setState('authenticated');
          return;
        }
        try {
          const data = await authRefresh(existingToken);
          setUser(data.user);
          setUserState(data.user);
          setState('authenticated');
          return;
        } catch {
          clearAuth();
        }
      }

      // 3. If inside GHL iframe, try SSO
      if (isInIframe()) {
        try {
          const ssoData = await requestGhlSso();
          if (ssoData) {
            const result = await ssoLogin(ssoData);
            setToken(result.token);
            setUser(result.user);
            setUserState(result.user);
            setState('authenticated');
            return;
          }
        } catch (err) {
          console.log('SSO failed:', err.message);
          setError('SSO: ' + err.message);
        }
      }

      setState('unauthenticated');
    }

    authenticate();
  }, []);

  if (state === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: c.bg, color: c.text3, fontSize: 15,
      }}>
        Connecting...
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
        {error && (
          <div style={{ fontSize: 12, color: c.red, marginTop: 8 }}>{error}</div>
        )}
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
