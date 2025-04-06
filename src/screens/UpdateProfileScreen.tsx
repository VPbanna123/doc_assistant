import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

// Define types for profile data
interface ProfileData {
  name: string;
  email: string;
  phone: string;
  bio: string;
}

// Define navigation type
type RootStackParamList = {
  Home: undefined;
  UpdateProfile: undefined;
  // Add other screens as needed
};

type UpdateProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UpdateProfile'>;

const UpdateProfileScreen: React.FC = () => {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',  
    bio: '',    
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const navigation = useNavigation<UpdateProfileScreenNavigationProp>();

  // Fetch current profile data 
  useEffect(() => {
 
    setLoading(false);
  }, [user]);

  // Handle form field changes
  const handleChange = (field: keyof ProfileData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleUpdateProfile = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    
    try {
      // Use your context's updateUserProfile function
      await updateUserProfile({
        name: formData.name,
        email: formData.email,
        
      });
      
      // Show success feedback
      alert('Profile updated successfully');
      navigation.goBack();
    } catch (err) {
      setError('Failed to update profile: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Update Profile</Text>
        
        {error && <Text style={styles.error}>{error}</Text>}
        
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            value={formData.name}
            onChangeText={(text) => handleChange('name', text)}
            style={styles.input}
            placeholder="Enter your full name"
          />
          
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={formData.phone}
            onChangeText={(text) => handleChange('phone', text)}
            style={styles.input}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
          
          <Text style={styles.label}>Bio</Text>
          <TextInput
            value={formData.bio}
            onChangeText={(text) => handleChange('bio', text)}
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <TouchableOpacity 
            style={[
              styles.button,
              submitting && styles.buttonDisabled
            ]}
            onPress={handleUpdateProfile}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  // Your existing styles
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  innerContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0c8ff',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#d9534f',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fde8e8',
    borderRadius: 5,
    textAlign: 'center',
  },
});

export default UpdateProfileScreen;
