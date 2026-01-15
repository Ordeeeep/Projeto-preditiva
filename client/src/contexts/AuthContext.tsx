import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

interface Usuario {
  id: string;
  nomeCompleto: string;
  email: string;
  whatsapp: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (nomeCompleto: string, email: string, whatsapp: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      loadUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (token: string) => {
    try {
      const user = await authService.getCurrentUser(token);
      setUsuario(user);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, senha: string) => {
    const response = await authService.login(email, senha);
    setToken(response.token);
    setUsuario(response.usuario);
    localStorage.setItem('token', response.token);
  };

  const register = async (nomeCompleto: string, email: string, whatsapp: string, senha: string) => {
    const response = await authService.register(nomeCompleto, email, whatsapp, senha);
    setToken(response.token);
    setUsuario(response.usuario);
    localStorage.setItem('token', response.token);
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!usuario,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};




