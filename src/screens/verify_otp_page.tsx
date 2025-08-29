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
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { verifyOtp } from '../services/authService';
import { RootStackParamList } from '../App';
// Safe MaterialIcons import with fallback
let MaterialIcons: any;
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
    'security': '🔐',
    'refresh': '🔄',
    'check': '✅',
    'error': '❌'
  };
  
  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {iconMap[name] || '•'}
    </Text>
  );
};

// Define navigation type
// type RootStackParamList = {
//   VerifyOtp: { email: string; phoneNumber?: string };
//   ResetPassword: { email: string; otpToken: string };
//   Login: undefined;
// };

type Props = StackScreenProps<RootStackParamList, 'VerifyOtp'>;

const VerifyOtpScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email, phoneNumber } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Refs for OTP inputs
  const otpRefs = useRef<TextInput[]>([]);

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
      if (otpRefs.current[0]) {
        otpRefs.current[0].focus();
      }
    }, 100);
  }, []);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && !canResend) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, canResend]);

  // Handle OTP input change
  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Clear error when user starts typing
    if (error) setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
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

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      shakeError();
      return;
    }

    animateButton();
    setIsLoading(true);
    setError(null);

    try {
      const data = await verifyOtp(email, otpCode);

      if (!data.success) {
        setError(data.message || "OTP verification failed");
        shakeError();
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        return;
      }

      navigation.navigate('ResetPassword', {
        email,
        otpToken: otpCode,
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Network error. Please check your connection.');
      shakeError();
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with your API call
      const response = await fetch('YOUR_API_ENDPOINT/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setCountdown(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        Alert.alert('Success', 'OTP has been resent to your email');
        otpRefs.current[0]?.focus();
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format time for countdown
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <Text style={styles.headerTitle}>Verify OTP</Text>
          <Text style={styles.headerSubtitle}>Enter verification code</Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

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
            <Icon name="security" size={40} color="#3b82f6" />
          </View>
        </View>

        {/* Instructions */}
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to{'\n'}
          <Text style={styles.highlightText}>{email}</Text>
        </Text>

        {/* OTP Input Fields */}
        <Animated.View style={[
          styles.otpContainer,
          { transform: [{ translateX: shakeAnim }] }
        ]}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) otpRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : {},
                error ? styles.otpInputError : {},
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              textContentType="oneTimeCode"
              editable={!isLoading}
            />
          ))}
        </Animated.View>

        {/* Error Message */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Resend OTP */}
        <View style={styles.resendContainer}>
          {!canResend ? (
            <Text style={styles.countdownText}>
              Resend code in {formatTime(countdown)}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
              <Text style={styles.resendText}>
                <Icon name="refresh" size={16} color="#3b82f6" />
                {' '}Resend Code
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              isLoading && styles.verifyButtonDisabled,
              otp.join('').length === 6 && styles.verifyButtonActive,
            ]}
            onPress={handleVerifyOtp}
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Icon name="check" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.verifyButtonText}>Verify Code</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
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

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
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
  },

  highlightText: {
    color: '#3b82f6',
    fontWeight: '600',
  },

  // OTP Input
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },

  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    backgroundColor: '#fff',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  otpInputFilled: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },

  otpInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },

  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },

  // Resend
  resendContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },

  countdownText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },

  resendText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Verify Button
  verifyButton: {
    backgroundColor: '#9ca3af',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  verifyButtonActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    elevation: 6,
  },

  verifyButtonDisabled: {
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

  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VerifyOtpScreen;
