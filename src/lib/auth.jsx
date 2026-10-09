import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

const AuthContext = createContext(null);

/**
 * الجلسة + العضوية في شركة التأكيد.
 * membership = { member: { role }, company, platformRate } أو { member: null } لمستخدم بلا شركة.
 */
export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  const refresh = useCallback(async () => {
    if (!getToken()) { setMembership(null); setLoading(false); return null; }
    setLoading(true);
    try {
      const { data } = await api.get('/confirmation/me');
      setMembership(data);
      return data;
    } catch {
      setMembership(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [token, refresh]);

  const login = (newToken) => { setToken(newToken); setTokenState(newToken); };
  const logout = () => { setToken(null); setTokenState(null); setMembership(null); };

  return (
    <AuthContext.Provider value={{ token, membership, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
