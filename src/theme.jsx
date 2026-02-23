import { createContext, useContext, useState } from 'react';

const ThemeCtx = createContext();

export function useTheme() {
  return useContext(ThemeCtx);
}

export function getColors(mode, accent) {
  const d = mode === 'dark';
  return {
    bg: d ? '#111114' : '#f5f5f7',
    surface: d ? '#1c1c1f' : '#ffffff',
    surface2: d ? '#232326' : '#f0f0f2',
    raised: d ? '#2a2a2e' : '#e8e8ec',
    border: d ? '#2a2a2e' : '#e0e0e4',
    text: d ? '#f0f0f3' : '#1a1a1e',
    text2: d ? '#a0a0a8' : '#6e6e78',
    text3: d ? '#68686f' : '#9e9ea8',
    accent,
    accentLine: accent + '44',
    recess: d ? '#0a0a0d' : '#d4d4d8',
    shadow: d ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)',
    navBg: d ? '#111114' : '#ffffff',
    navBorder: d ? '#1c1c1f' : '#ebebef',
    overlay: d ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
    green: '#22c55e',
    greenDk: '#15803d',
    red: '#ef4444',
    redDk: '#b91c1c',
  };
}

const THEME_KEY = 'tc_theme';
const ACCENT_KEY = 'tc_accent';

function loadPref(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => loadPref(THEME_KEY, 'dark'));
  const [accent, setAccentState] = useState(() => loadPref(ACCENT_KEY, '#f97316'));

  const setMode = (m) => {
    setModeState(m);
    try { localStorage.setItem(THEME_KEY, m); } catch {}
  };

  const setAccent = (a) => {
    setAccentState(a);
    try { localStorage.setItem(ACCENT_KEY, a); } catch {}
  };

  const c = getColors(mode, accent);

  return (
    <ThemeCtx.Provider value={{ c, accent, setAccent, mode, setMode }}>
      {children}
    </ThemeCtx.Provider>
  );
}
