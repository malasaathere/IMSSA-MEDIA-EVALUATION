"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { account, databases, APPWRITE_DB_ID } from './appwrite';
import { Models, AppwriteException, Query } from 'appwrite';

interface UserProfile {
  $id: string;
  name: string;
  email: string;
  roles: string[];
  events: string[];
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_TIMEOUT_MS = 10_000;

function withTimeout<T>(operation: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS)),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const fetchProfile = async (authUserId: string) => {
    try {
      const response = await withTimeout(databases.listDocuments(APPWRITE_DB_ID, "users", [
        Query.equal("authUserId", authUserId)
      ]), "Profile loading timed out.");
      if (response.total > 0) {
        const doc = response.documents[0];
        setProfile({
          $id: doc.$id,
          name: doc.name,
          email: doc.email,
          roles: doc.roles || [],
          events: doc.events || []
        });
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
      setProfile(null);
    }
  };

  const checkSession = async () => {
    try {
      const currentUser = await withTimeout(account.get(), "The login service took too long to respond.");
      setUser(currentUser);
      await fetchProfile(currentUser.$id);
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 401) {
        setUser(null);
        setProfile(null);
      } else {
        console.error("Auth check failed", error);
        setUser(null);
        setProfile(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await withTimeout(account.createEmailPasswordSession(email, pass), "The login service took too long to respond.");
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
      setProfile(null);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, login, logout }}>
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
