"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { account } from './appwrite';
import { Models, AppwriteException } from 'appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 401) {
        setUser(null);
      } else {
        console.error("Auth check failed", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await account.createEmailPasswordSession(email, pass);
      await checkSession();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
