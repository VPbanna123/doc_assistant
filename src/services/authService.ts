
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';

const API_URL = "https://doc-assistant-sa93.onrender.com/api/auth";


// Define TypeScript interfaces
export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
success: boolean;
message:string
  token: string;
  user: User;
}

// Helper function for API calls

const handleApiResponse = async <T>(response: Response): Promise<T> => {
  // const text = await response.text();
  const data=await response.json().catch(()=>null);

  if (!response.ok) {
    // You can log or throw a more detailed error
    // throw new Error(`API error: ${response.status} - ${text}`);
    throw new Error(data?.message || `error ${response.status}`)
  }

  // Try to parse JSON, otherwise throw
  try {
    // return JSON.parse(text) as T;
    return data as T;
  } catch (e) {
    // throw new Error(`Failed to parse JSON: ${text}`);
    throw new Error("Failed to parse JSON response");
  }
};
// Store both token and user
export const storeAuth = async (auth: AuthResponse): Promise<void> => {
  try {
    await AsyncStorage.setItem('authData', JSON.stringify(auth));
  } catch (error) {
    console.error('Error storing auth data', error);
    throw new Error('Failed to store authentication data');
  }
};

export const getAuth = async (): Promise<AuthResponse | null> => {
  try {
    const data = await AsyncStorage.getItem('authData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving auth data', error);
    return null;
  }
};

export const removeAuth = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('authData');
  } catch (error) {
    console.error('Error removing auth data', error);
  }
};

// Store auth token
export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('authToken', token);
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
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  
    const data = await handleApiResponse<AuthResponse>(response);
    
    // Store the token automatically upon successful login
    await storeToken(data.token);
      const storedToken = await getToken();
    console.log('Token after login:', storedToken);
    if (!storedToken) throw new Error("Token storage failed");
    return data;
  } catch (error:any) {
    throw error;
  }
};

export const verifyOtp=async(email:string,otp:string):Promise<AuthResponse>=>{
  try {
      const response=await fetch(`${API_URL}/verifyotp`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,otp})
      });

      const data=await handleApiResponse<AuthResponse>(response);
      return data;

  } catch (error:any) {
    throw error;
  }
}

export const resetPassword=async(email:string,password:string):Promise<AuthResponse>=>{
  try {
    const response=await fetch(`${API_URL}/resetPassword`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email,newPassword: password})
    });
    const data=await handleApiResponse<AuthResponse>(response)
   return data;
  } catch (error:any) {
    throw error
  }
}
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
  
  const response = await fetch(`${API_URL}/profile`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
    if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
 
 const data = await response.json(); // parse JSON
  return data.user; 
};

// Update user profile
export const updateProfile = async (updates: Partial<User>): Promise<User> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_URL}/update-profile`, {
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

export const sendPasswordResetEmail = async (email: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/forgot-password`, {
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

