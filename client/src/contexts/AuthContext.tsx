import { useToast } from '@/hooks/use-toast';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  dateOfBirth?: string;
  cefrLevel: 'B2' | 'C1' | 'C2';
  fieldsOfInterest: string[];
  aiDataConsent: boolean;
  points: number;
  wordsLearned: number;
  articlesRead: number;
  videosWatched: number;
  createdAt: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: string;
  cefrLevel: 'B2' | 'C1' | 'C2';
  fieldsOfInterest: string[];
  aiDataConsent: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      toast({
        title: "Logged in successfully!",
        description: "Welcome back to your profile.",
      });

      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials. Please try again.';
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      toast({
        title: "Registered successfully!",
        description: "Welcome to English Learning App. You can now start your learning journey.",
      });

      setUser(data.user);
    } catch (error) {
      console.error('Registration error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Email address already in use.';
      
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: errorMessage,
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      toast({
        title: "Logged out successfully!",
        description: "You have been logged out of your account.",
      });

      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been updated.",
      });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { User, LoginCredentials, RegisterCredentials };