// src/api/authApi.ts
import {
    logIn,
    getCurrentUser,
    storeToken,
    removeToken,
    signUp,
    updateProfile,
    getToken,
    isAuthenticated,
    User,
    AuthResponse,
    sendPasswordResetEmail, 
    resetPassword,
  } from '../services/authService';
  
  // Re-export interfaces
  export type { User, AuthResponse };
  
  // Export with appropriate names to match what AuthContext expects
  export const login = logIn;
  export const getUserProfile = getCurrentUser;
  
  // Re-export other functions that might be needed
  export { 
    storeToken,
    removeToken,
    signUp,
    updateProfile,
    isAuthenticated,
    getToken ,
    sendPasswordResetEmail, 
    resetPassword,
  };
  