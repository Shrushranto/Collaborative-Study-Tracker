import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';
import { ensureKeys } from '../utils/crypto.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(async (res) => {
        setUser(res.data.user);
        await ensureKeys(api);
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    await ensureKeys(api);
  }

  async function signup(name, email, password) {
    const res = await api.post('/auth/signup', { name, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    await ensureKeys(api);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  function refreshUser() {
    return api.get('/auth/me').then((res) => setUser(res.data.user));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
