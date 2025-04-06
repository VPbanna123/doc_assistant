
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "http://localhost:5000/api/auth";
const USER_API_URL = "http://localhost:5000/api/user";

// Define TypeScript interfaces
export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Helper function for API calls
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }
  return data as T;
};

// Store auth token
export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('authToken', JSON.stringify(token));
  } catch (error) {
    console.error('Error storing auth token', error);
    throw new Error('Failed to store authentication token');
  }
};

// Get auth token
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error retrieving auth token', error);
    return null;
  }
};

// Remove auth token (for logout)
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error removing auth token', error);
  }
};

// Sign up function
export const signUp = async (name: string, email: string, password: string): Promise<void> => {
  const response = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  await handleApiResponse<{ message: string }>(response);
};

// Log in function
export const logIn = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleApiResponse<AuthResponse>(response);
  
  // Store the token automatically upon successful login
  await storeToken(data.token);
  
  return data;
};

// Log out function
export const logOut = async (): Promise<void> => {
  await removeToken();
};

// Get current user profile
export const getCurrentUser = async (): Promise<User> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${USER_API_URL}/profile`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  
  return handleApiResponse<User>(response);
};

// Update user profile
export const updateProfile = async (updates: Partial<User>): Promise<User> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${USER_API_URL}/profile`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updates)
  });
  
  return handleApiResponse<User>(response);
};

// Change password
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_URL}/change-password`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  
  return handleApiResponse<{ message: string }>(response);
};

// Verify if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send reset email');
    }
    
    return data;
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to send reset email');
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }
    
    return data;
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
};