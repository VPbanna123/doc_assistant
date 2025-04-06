// import React, { createContext, useState, ReactNode } from "react";

// interface AuthContextType {
//   user: { email: string } | null;
//   setUser: (user: { email: string } | null) => void;
// }

// export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<{ email: string } | null>(null);

//   return (
//     <AuthContext.Provider value={{ user, setUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useContext } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/authApi';
import { sendPasswordResetEmail, resetPassword } from '../services/authService';
// Re-export the User interface from authApi
export type { User } from '../api/authApi';

interface AuthContextType {
  user: authApi.User | null;
  token: string | null;
  setUser: React.Dispatch<React.SetStateAction<authApi.User | null>>; // Add this line
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  
  updateUserProfile: (updates: Partial<authApi.User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for easier context consumption
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<authApi.User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load user on startup
  useEffect(() => {
    const loadToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('authToken');
        
        // if (savedToken) {
        //   setToken(savedToken);
        //   const userData = await authApi.getUserProfile();
        //   setUser(userData);
        // }
        if (savedToken) {
          try {
            // Try parsing the token in case it was stored as a stringified JSON object
            const parsedToken = JSON.parse(savedToken);
            setToken(parsedToken);
          } catch (parseError) {
            // If the token is a simple string, set it directly without parsing
            setToken(savedToken);
          }
  
          // Retrieve the user profile using the saved token
          const userData = await authApi.getUserProfile();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadToken();
  }, []);

  // const login = async (email: string, password: string) => {
  //   try {
  //     setLoading(true);
  //     setError(null);
      
  //     const { token, user } = await authApi.login(email, password);
      
  //     setToken(token);
  //     setUser(user);
  //   } catch (error: any) {
  //     setError(error.message || 'Login failed');
  //     throw error;
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Logging in with:", email);
      const response = await authApi.login(email, password);
      console.log("Login response received:", !!response);
      
      // Check if token exists in response
      if (!response.token) {
        console.error("No token in login response");
        throw new Error("Authentication failed: No token in response");
      }
      
      console.log("Token received after login:", !!response.token);
      
      // Verify token is stored correctly
      await authApi.storeToken(response.token);
      const storedToken = await authApi.getToken();
      console.log("Token stored and retrieved:", !!storedToken);
      
      setToken(response.token);
      setUser(response.user);
    } catch (error: any) {
      console.error("Login error:", error.message);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  
  const logout = async () => {
    try {
      await authApi.removeToken();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const updateUserProfile = async (updates: Partial<authApi.User>) => {
    try {
      setLoading(true);
      const updatedUser = await authApi.updateProfile(updates);
      setUser(updatedUser);
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(email);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (token: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      await resetPassword(token, newPassword);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  // Add to your AuthContext.tsx
const checkAuthStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    console.log("Auth token exists:", !!token);
    if (token) {
      // Inspect token content without verification
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        console.log("Token payload:", JSON.parse(jsonPayload));
      } catch (e) {
        console.log("Failed to decode token:", e);
      }
    }
    return !!token;
  } catch (error) {
    console.error("Error checking auth status:", error);
    return false;
  }
};

// Call this in useEffect
useEffect(() => {
  checkAuthStatus();
}, []);


  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      setUser, // Add this
      login, 
      logout, 
      loading, 
      error,
      updateUserProfile,
      forgotPassword,
      resetPassword: handleResetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
