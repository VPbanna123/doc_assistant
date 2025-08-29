
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Animated, Easing } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

// Safe MaterialIcons import with fallback
let MaterialIcons;
try {
  MaterialIcons = require('react-native-vector-icons/MaterialIcons').default;
} catch (e) {
  console.log('MaterialIcons not available, using text fallback');
}

// Icon component with MaterialIcons or text fallback
const Icon = ({ name, size, color, style }: { name: string, size: number, color: string, style?: any }) => {
  if (MaterialIcons) {
    return <MaterialIcons name={name} size={size} color={color} style={style} />;
  }
  
  // Fallback to text icons if MaterialIcons fails
  const iconMap: { [key: string]: string } = {
    'arrow-back': '←',
    'person': '👤',
    'email': '📧',
    'phone': '📞',
    'info': 'ℹ️',
    'save': '💾',
    'close': '✖',
    'check-circle': '✅',
    'error': '❌'
  };
  
  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {iconMap[name] || '•'}
    </Text>
  );
};

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
  const [success, setSuccess] = useState<boolean>(false);
  const navigation = useNavigation<UpdateProfileScreenNavigationProp>();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setLoading(false);
    
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [user]);

  // Handle form field changes
  const handleChange = (field: keyof ProfileData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  // Button press animation
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // Handle form submission
  const handleUpdateProfile = async (): Promise<void> => {
    animateButton();
    setSubmitting(true);
    setError(null);
    
    try {
      await updateUserProfile({
        name: formData.name,
        email: formData.email,
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err) {
      setError('Failed to update profile: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerGradient} />
        
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Update Profile</Text>
          <Text style={styles.headerSubtitle}>Edit your personal information</Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[
          styles.innerContainer,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          
          {/* Success Message */}
          {success && (
            <View style={styles.successMessage}>
              <Icon name="check-circle" size={20} color="#10b981" style={styles.messageIcon} />
              <Text style={styles.successText}>Profile updated successfully!</Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorMessage}>
              <Icon name="error" size={20} color="#ef4444" style={styles.messageIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.form}>
            {/* Full Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                <Icon name="person" size={16} color="#6b7280" style={styles.labelIcon} />
                Full Name
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => handleChange('name', text)}
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
            
            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                <Icon name="email" size={16} color="#6b7280" style={styles.labelIcon} />
                Email Address
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => handleChange('email', text)}
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            
            {/* Phone Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                <Icon name="phone" size={16} color="#6b7280" style={styles.labelIcon} />
                Phone Number
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => handleChange('phone', text)}
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            
            {/* Bio Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                <Icon name="info" size={16} color="#6b7280" style={styles.labelIcon} />
                Bio
              </Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  value={formData.bio}
                  onChangeText={(text) => handleChange('bio', text)}
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#9ca3af"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity 
                  style={[
                    styles.saveButton,
                    submitting && styles.buttonDisabled
                  ]}
                  onPress={handleUpdateProfile}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Icon name="save" size={18} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={submitting}
              >
                <Icon name="close" size={18} color="#6b7280" style={styles.buttonIcon} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Header (matching other pages)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 45 : 20,
    position: 'relative',
    zIndex: 1,
  },
  
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3b82f6',
    opacity: 0.95,
  },
  
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1,
  },
  
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
    zIndex: 1,
  },
  
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  
  headerSpacer: {
    width: 42,
  },
  
  scrollView: {
    flex: 1,
  },
  
  innerContainer: {
    padding: 20,
    paddingTop: 30,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Success and Error Messages
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  
  messageIcon: {
    marginRight: 12,
  },
  
  successText: {
    color: '#059669',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  
  errorText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  
  // Form Styling
  form: {
    width: '100%',
  },
  
  fieldContainer: {
    marginBottom: 24,
  },
  
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  labelIcon: {
    marginRight: 8,
  },
  
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  input: {
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '400',
  },
  
  textAreaContainer: {
    minHeight: 100,
  },
  
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  
  // Button Styling
  buttonContainer: {
    marginTop: 32,
    gap: 16,
  },
  
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonIcon: {
    marginRight: 8,
  },
  
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    flexDirection: 'row',
  },
  
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default UpdateProfileScreen;
