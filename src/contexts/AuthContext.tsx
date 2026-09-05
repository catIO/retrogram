import React, { createContext, useContext, useState, useEffect } from 'react';

import { client } from '../config/sanity';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check if there's a token in localStorage on initial load
    const token = localStorage.getItem('auth_token')?.trim();
    if (token) {
      client.config({ token });
      setIsAuthenticated(true);
    }
  }, []);

  const login = (token: string) => {
    const trimmed = token.trim();
    localStorage.setItem('auth_token', trimmed);
    client.config({ token: trimmed });
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    const defaultToken = import.meta.env.VITE_SANITY_TOKEN?.trim() || undefined;
    client.config({ token: defaultToken });
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 