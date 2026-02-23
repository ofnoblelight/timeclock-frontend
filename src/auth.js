const TOKEN_KEY = 'tc_token';
const USER_KEY = 'tc_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Check URL for token param (from GHL OAuth redirect)
export function handleAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    setToken(token);
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    return token;
  }
  return getToken();
}
