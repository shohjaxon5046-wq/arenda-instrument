import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';

interface AuthContextType {
  currentUser: AdminUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => { success: boolean; error?: string };
  changeUsername: (currentPassword: string, newUsername: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'arenda_admin_session_v1';
const USERNAME_STORAGE_KEY = 'arenda_admin_username_v1';
const PASS_STORAGE_KEY = 'arenda_admin_password_v1';

// Default Admin credentials requested by user
const DEFAULT_ADMIN_USERNAME = 'shoxjaxon';
const DEFAULT_ADMIN_PASSWORD = 'Jaxon887';
const DEFAULT_ADMIN_NAME = 'Shoxjaxon';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getStoredUsername = () => localStorage.getItem(USERNAME_STORAGE_KEY) || DEFAULT_ADMIN_USERNAME;
  const getStoredPassword = () => localStorage.getItem(PASS_STORAGE_KEY) || DEFAULT_ADMIN_PASSWORD;

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch {
      return null;
    }
  });

  const login = (username: string, password: string) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const expectedUser = getStoredUsername().toLowerCase();
    const expectedPass = getStoredPassword();

    if (cleanUser === expectedUser && cleanPass === expectedPass) {
      const adminUser: AdminUser = {
        username: getStoredUsername(),
        fullName: DEFAULT_ADMIN_NAME,
        role: 'admin',
        loginAt: new Date().toISOString()
      };

      setCurrentUser(adminUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Login yoki parol noto‘g‘ri! Begonalar kirishi qat’iyan taqiqlangan.' 
    };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const changePassword = (currentPass: string, newPass: string) => {
    const activePass = getStoredPassword();
    if (currentPass.trim() !== activePass) {
      return { success: false, error: 'Hozirgi amaldagi parol noto‘g‘ri kiritildi!' };
    }
    if (newPass.trim().length < 5) {
      return { success: false, error: 'Yangi parol kamida 5 ta belgidan iborat bo‘lishi kerak!' };
    }

    localStorage.setItem(PASS_STORAGE_KEY, newPass.trim());
    return { success: true };
  };

  const changeUsername = (currentPass: string, newUsername: string) => {
    const activePass = getStoredPassword();
    if (currentPass.trim() !== activePass) {
      return { success: false, error: 'Parolingiz noto‘g‘ri kiritildi!' };
    }
    if (newUsername.trim().length < 3) {
      return { success: false, error: 'Yangi login kamida 3 ta belgidan iborat bo‘lishi kerak!' };
    }

    localStorage.setItem(USERNAME_STORAGE_KEY, newUsername.trim());
    if (currentUser) {
      const updated = { ...currentUser, username: newUsername.trim() };
      setCurrentUser(updated);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    }
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        changePassword,
        changeUsername
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
