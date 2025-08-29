import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { resetPassword } from '../services/authService';
import { RootStackParamList } from '../App';

// Safe MaterialIcons import with proper typing
let MaterialIcons: any;
try {
  MaterialIcons = require('react-native-vector-icons/MaterialIcons').default;
} catch (e) {
  console.log('MaterialIcons not available, using text fallback');
  MaterialIcons = null;
}

// Icon component with MaterialIcons or text fallback
const Icon = ({ name, size, color, style }: { name: string, size: number, color: string, style?: any }) => {
  if (MaterialIcons) {
    return <MaterialIcons name={name} size={size} color={color} style={style} />;
  }
  
  // Fallback to text icons if MaterialIcons fails
  const iconMap: { [key: string]: string } = {
    'arrow-back': '←',
    'lock': '🔒',
    'visibility': '👁',
    'visibility-off': '🙈',
    'check': '✅',
    'error': '❌',
    'shield': '🛡️'
  };
  
  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {iconMap[name] || '•'}
    </Text>
  );
};

type Props = StackScreenProps<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email, otpToken } = route.params;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Refs for inputs
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    // Focus first input
    setTimeout(() => {
      newPasswordRef.current?.focus();
    }, 100);
  }, []);

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  // Handle password change
  const handleNewPasswordChange = (password: string) => {
    setNewPassword(password);
    setPasswordStrength(checkPasswordStrength(password));
    if (error) setError(null);
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (password: string) => {
    setConfirmPassword(password);
    if (error) setError(null);
  };

  // Validate passwords
  const validatePasswords = () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (passwordStrength < 3) {
      setError('Password is too weak. Include uppercase, lowercase, numbers, and special characters');
      return false;
    }

    return true;
  };

  // Shake animation for errors
  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Button press animation
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!validatePasswords()) {
      shakeError();
      return;
    }

    animateButton();
    setIsLoading(true);
    setError(null);

    try {
      const data = await resetPassword(email, newPassword);

      Alert.alert(
        'Success!',
        'Your password has been reset successfully. Please login with your new password.',
        [
          {
            text: 'Login Now',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Network error. Please check your connection.');
      shakeError();
    } finally {
      setIsLoading(false);
    }
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return '#ef4444';
      case 2:
      case 3: return '#f59e0b';
      case 4:
      case 5: return '#10b981';
      default: return '#6b7280';
    }
  };

  // Get password strength text
  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return 'Very Weak';
      case 2: return 'Weak';
      case 3: return 'Fair';
      case 4: return 'Good';
      case 5: return 'Strong';
      default: return '';
    }
  };

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
          <Text style={styles.headerTitle}>Reset Password</Text>
          <Text style={styles.headerSubtitle}>Create your new password</Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          {/* Security Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Icon name="shield" size={40} color="#3b82f6" />
            </View>
          </View>

          {/* Instructions */}
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>
            Your new password must be different from your previous password
          </Text>

          {/* Form */}
          <Animated.View style={[
            styles.formContainer,
            { transform: [{ translateX: shakeAnim }] }
          ]}>
            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Icon name="error" size={20} color="#ef4444" style={styles.errorIcon} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* New Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>New Password</Text>
              <View style={[
                styles.inputContainer,
                error && styles.inputContainerError
              ]}>
                <Icon name="lock" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  ref={newPasswordRef}
                  style={styles.input}
                  value={newPassword}
                  onChangeText={handleNewPasswordChange}
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  returnKeyType="next"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon 
                    name={showNewPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View 
                      style={[
                        styles.strengthFill,
                        { 
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: getPasswordStrengthColor()
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                    {getPasswordStrengthText()}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[
                styles.inputContainer,
                error && styles.inputContainerError
              ]}>
                <Icon name="lock" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  onSubmitEditing={handleResetPassword}
                  returnKeyType="done"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon 
                    name={showConfirmPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              </View>

              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchContainer}>
                  {newPassword === confirmPassword ? (
                    <View style={styles.matchSuccess}>
                      <Icon name="check" size={16} color="#10b981" />
                      <Text style={styles.matchSuccessText}>Passwords match</Text>
                    </View>
                  ) : (
                    <View style={styles.matchError}>
                      <Icon name="error" size={16} color="#ef4444" />
                      <Text style={styles.matchErrorText}>Passwords don't match</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password must contain:</Text>
              <View style={styles.requirement}>
                <Icon 
                  name={newPassword.length >= 8 ? "check" : "error"} 
                  size={16} 
                  color={newPassword.length >= 8 ? "#10b981" : "#6b7280"} 
                />
                <Text style={[
                  styles.requirementText,
                  { color: newPassword.length >= 8 ? "#10b981" : "#6b7280" }
                ]}>
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.requirement}>
                <Icon 
                  name={/[A-Z]/.test(newPassword) ? "check" : "error"} 
                  size={16} 
                  color={/[A-Z]/.test(newPassword) ? "#10b981" : "#6b7280"} 
                />
                <Text style={[
                  styles.requirementText,
                  { color: /[A-Z]/.test(newPassword) ? "#10b981" : "#6b7280" }
                ]}>
                  One uppercase letter
                </Text>
              </View>
              <View style={styles.requirement}>
                <Icon 
                  name={/[a-z]/.test(newPassword) ? "check" : "error"} 
                  size={16} 
                  color={/[a-z]/.test(newPassword) ? "#10b981" : "#6b7280"} 
                />
                <Text style={[
                  styles.requirementText,
                  { color: /[a-z]/.test(newPassword) ? "#10b981" : "#6b7280" }
                ]}>
                  One lowercase letter
                </Text>
              </View>
              <View style={styles.requirement}>
                <Icon 
                  name={/[0-9]/.test(newPassword) ? "check" : "error"} 
                  size={16} 
                  color={/[0-9]/.test(newPassword) ? "#10b981" : "#6b7280"} 
                />
                <Text style={[
                  styles.requirementText,
                  { color: /[0-9]/.test(newPassword) ? "#10b981" : "#6b7280" }
                ]}>
                  One number
                </Text>
              </View>
            </View>

            {/* Reset Password Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.resetButton,
                  isLoading && styles.resetButtonDisabled,
                  (newPassword && confirmPassword && passwordStrength >= 3 && newPassword === confirmPassword) && styles.resetButtonActive,
                ]}
                onPress={handleResetPassword}
                disabled={isLoading || !newPassword || !confirmPassword || passwordStrength < 3 || newPassword !== confirmPassword}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Icon name="check" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.resetButtonText}>Reset Password</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
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

  // Header
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

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center',
  },

  iconContainer: {
    marginBottom: 30,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Form
  formContainer: {
    width: '100%',
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  errorIcon: {
    marginRight: 12,
  },

  errorText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },

  fieldContainer: {
    marginBottom: 24,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  inputContainerError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },

  inputIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '400',
  },

  eyeButton: {
    padding: 8,
    marginLeft: 8,
  },

  // Password Strength
  strengthContainer: {
    marginTop: 12,
  },

  strengthBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },

  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },

  strengthText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },

  // Password Match
  matchContainer: {
    marginTop: 12,
  },

  matchSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  matchSuccessText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },

  matchError: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  matchErrorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },

  // Requirements
  requirementsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },

  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },

  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  requirementText: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
  },

  // Reset Button
  resetButton: {
    backgroundColor: '#9ca3af',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  resetButtonActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    elevation: 6,
  },

  resetButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0.05,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonIcon: {
    marginRight: 8,
  },

  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;
