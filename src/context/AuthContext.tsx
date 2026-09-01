/**
 * ProcureFlow Enterprise - Authentication & Role Context
 * Supports Sign In, Sign Up, Live Persona Switcher, and Session Persistence
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { INITIAL_USERS } from '../data/seedData';
import { api } from '../api/client';

export interface SignUpData {
  name: string;
  email: string;
  phone?: string;
  role?: UserRole;
  department?: string;
  password?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User;
  token: string | null;
  usersList: User[];
  signIn: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (userData: SignUpData) => Promise<{ success: boolean; message?: string }>;
  signOut: () => void;
  loginAsPersona: (role: UserRole) => Promise<void>;
  loginWithEmail: (email: string) => Promise<boolean>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default Admin: Navneet Gupta
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if user was previously authenticated
    return localStorage.getItem('procureflow_authenticated') === 'true';
  });
  const [usersList, setUsersList] = useState<User[]>(INITIAL_USERS);

  useEffect(() => {
    const savedUserId = localStorage.getItem('procureflow_user_id');
    const savedAuth = localStorage.getItem('procureflow_authenticated') === 'true';
    const savedToken = localStorage.getItem('procureflow_token');

    if (savedAuth && savedUserId) {
      const found = INITIAL_USERS.find((u) => u.id === savedUserId);
      if (found) {
        setCurrentUser(found);
        setToken(savedToken || `jwt_token_${found.id}_demo`);
        setIsAuthenticated(true);
      }
    }
    refreshUsers();
  }, []);

  const refreshUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.success && res.data) {
        setUsersList(res.data);
      }
    } catch (e) {
      console.warn('Using initial users fallback');
    }
  };

  const signIn = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const res = await api.login({ email: trimmedEmail, password });
      if (res.success && res.data && res.data.user) {
        const user = res.data.user;
        setCurrentUser(user);
        setToken(res.data.accessToken);
        setIsAuthenticated(true);
        localStorage.setItem('procureflow_authenticated', 'true');
        localStorage.setItem('procureflow_token', res.data.accessToken);
        localStorage.setItem('procureflow_user_id', user.id);
        return { success: true, message: 'Authentication successful' };
      }
      // Fallback matching against local list
      const matched = usersList.find((u) => u.email.toLowerCase() === trimmedEmail) ||
        INITIAL_USERS.find((u) => u.email.toLowerCase() === trimmedEmail);
      if (matched) {
        setCurrentUser(matched);
        const newToken = `jwt_token_${matched.id}_${Date.now()}`;
        setToken(newToken);
        setIsAuthenticated(true);
        localStorage.setItem('procureflow_authenticated', 'true');
        localStorage.setItem('procureflow_token', newToken);
        localStorage.setItem('procureflow_user_id', matched.id);
        return { success: true, message: 'Authentication successful' };
      }
      return { success: false, message: 'User not found with this email. Please check your credentials or sign up.' };
    } catch (err: any) {
      console.error('Sign in error:', err);
      // Even if server failed, check local users
      const trimmedEmail = email.trim().toLowerCase();
      const matched = usersList.find((u) => u.email.toLowerCase() === trimmedEmail) ||
        INITIAL_USERS.find((u) => u.email.toLowerCase() === trimmedEmail);
      if (matched) {
        setCurrentUser(matched);
        const newToken = `jwt_token_${matched.id}_${Date.now()}`;
        setToken(newToken);
        setIsAuthenticated(true);
        localStorage.setItem('procureflow_authenticated', 'true');
        localStorage.setItem('procureflow_token', newToken);
        localStorage.setItem('procureflow_user_id', matched.id);
        return { success: true, message: 'Authentication successful' };
      }
      return { success: false, message: err?.message || 'Invalid email or password' };
    }
  };

  const signUp = async (userData: SignUpData): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.signup(userData);
      if (res.success && res.data && res.data.user) {
        const user = res.data.user;
        setCurrentUser(user);
        setToken(res.data.accessToken);
        setIsAuthenticated(true);
        localStorage.setItem('procureflow_authenticated', 'true');
        localStorage.setItem('procureflow_token', res.data.accessToken);
        localStorage.setItem('procureflow_user_id', user.id);
        await refreshUsers();
        return { success: true, message: 'Account registered successfully' };
      }

      // Fallback local registration
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '+91 99000 11223',
        role: userData.role || UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        department: userData.department || 'General Operations',
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      setUsersList((prev) => [newUser, ...prev]);
      setCurrentUser(newUser);
      const newToken = `jwt_token_${newUser.id}_${Date.now()}`;
      setToken(newToken);
      setIsAuthenticated(true);
      localStorage.setItem('procureflow_authenticated', 'true');
      localStorage.setItem('procureflow_token', newToken);
      localStorage.setItem('procureflow_user_id', newUser.id);
      return { success: true, message: 'Account created successfully' };
    } catch (err: any) {
      console.error('Sign up error:', err);
      return { success: false, message: err?.message || 'Could not complete registration' };
    }
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setToken(null);
    localStorage.removeItem('procureflow_authenticated');
    localStorage.removeItem('procureflow_token');
    localStorage.removeItem('procureflow_user_id');
  };

  const loginAsPersona = async (role: UserRole) => {
    const target = usersList.find((u) => u.role === role) || INITIAL_USERS.find((u) => u.role === role) || usersList[0];
    setCurrentUser(target);
    const newToken = `jwt_token_${target.id}_${Date.now()}`;
    setToken(newToken);
    setIsAuthenticated(true);
    localStorage.setItem('procureflow_authenticated', 'true');
    localStorage.setItem('procureflow_token', newToken);
    localStorage.setItem('procureflow_user_id', target.id);
  };

  const loginWithEmail = async (email: string): Promise<boolean> => {
    const res = await signIn(email);
    return res.success;
  };

  const logout = () => {
    signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        token,
        usersList,
        signIn,
        signUp,
        signOut,
        loginAsPersona,
        loginWithEmail,
        logout,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

