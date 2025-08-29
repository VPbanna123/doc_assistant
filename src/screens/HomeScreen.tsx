
import React, { useEffect, useRef, useState, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, ScrollView, Platform } from "react-native";
import { AuthContext } from "../context/AuthContext";

// Try different MaterialIcons import - if this doesn't work, we'll use text icons
let MaterialIcons;
try {
  MaterialIcons = require('react-native-vector-icons/MaterialIcons').default;
} catch (e) {
  console.log('MaterialIcons not available, using fallback');
  MaterialIcons = null;
}

const HomeScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  // Get user data from route params or context
  const authContext = useContext(AuthContext);
  const logout = useContext(AuthContext);
  
  if (!authContext) {
    throw new Error("HomeScreen must be used within an AuthProvider");
  }
  
  const { user } = authContext;
  
  // State for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Create animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(50)).current;

  // Function to extract user name from email
  const extractNameFromEmail = (email: String) => {
    if (!email) return "User";
    
    // Remove domain part
    const namePart = email.split('@')[0];
    
    // Replace dots/underscores with spaces and capitalize each word
    return namePart
      .replace(/[.\_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get display name
  const displayName = user?.name || user?.email?.split('@')[0] || "User";
  
  // Function to toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Function to navigate and close dropdown
  const navigateTo = (screenName: String) => {
    setIsDropdownOpen(false);
    navigation.navigate(screenName);
  };

  // Calculate font size based on name length
  const getFontSize = () => {
    if (displayName.length > 15) return 12;
    if (displayName.length > 10) return 14;
    return 16;
  };

  const handleLogout = async () => {
    try {
      await authContext.logout(); // Logs out user and resets state
      console.log("User logged out successfully.");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    // Animations matching Upload page
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation matching Upload page
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Icon component - fallback to text if MaterialIcons not available
  const Icon = ({ name, size, color, style }: { name: string, size: number, color: string, style?: any }) => {
    if (MaterialIcons) {
      return <MaterialIcons name={name} size={size} color={color} style={style} />;
    }
    
    // Fallback text icons
    const iconMap: { [key: string]: string } = {
      'person': '👤',
      'history': '📋',
      'logout': '🚪',
      'cloud-upload': '📤',
      'video-call': '📹',
      'smart-toy': '🤖',
      'arrow-forward': '→'
    };
    
    return (
      <Text style={[{ fontSize: size, color }, style]}>
        {iconMap[name] || '•'}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header with same styling as Upload page */}
        <View style={styles.header}>
          <View style={styles.headerGradient} />
          
          {/* Keep Your App Logo Rotating */}
          <View style={styles.headerLogoContainer}>
            <Animated.Image 
              source={require('../assets/logo_health.jpg')} 
              style={[
                styles.rotatingLogo,
                { transform: [{ rotate: logoRotateInterpolate }] }
              ]} 
            />
          </View>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>HealthCare AI Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome back, {displayName}</Text>
          </View>
          
          {/* User dropdown */}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleDropdown} style={styles.userButton}>
              <Icon name="person" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dropdown Menu - Fixed positioning outside header */}
        {isDropdownOpen && (
          <View style={styles.dropdownOverlay}>
            <TouchableOpacity 
              style={styles.dropdownBackdrop} 
              onPress={() => setIsDropdownOpen(false)}
              activeOpacity={1}
            />
            <View style={styles.dropdownMenu}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => navigateTo("UpdateProfile")}
              >
                <Icon name="person" size={16} color="#374151" style={styles.dropdownItemIcon} />
                <Text style={styles.dropdownItemText}>Update Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => navigateTo("History")}
              >
                <Icon name="history" size={16} color="#374151" style={styles.dropdownItemIcon} />
                <Text style={styles.dropdownItemText}>History</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dropdownItem, styles.logoutItem]}
                onPress={handleLogout}
              >
                <Icon name="logout" size={16} color="#ef4444" style={styles.dropdownItemIcon} />
                <Text style={[styles.dropdownItemText, styles.logoutItemText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Main Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={[
            styles.mainContent,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            
            {/* Options Container with Upload page styling */}
            <View style={styles.optionsContainer}>
              
              {/* Upload Media Card */}
              <Animated.View style={[
                styles.optionCard,
                { transform: [{ translateY: cardSlideAnim }] }
              ]}>
                <TouchableOpacity 
                  style={styles.cardContent}
                  onPress={() => navigation.navigate("Upload")}
                >
                  <View style={styles.cardIconContainer}>
                    <Icon name="cloud-upload" size={32} color="#6b7280" />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>Upload Media</Text>
                    <Text style={styles.cardDescription}>
                      Upload audio/video files for AI medical analysis
                    </Text>
                  </View>
                  <View style={styles.cardArrow}>
                    <Icon name="arrow-forward" size={18} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
              
              {/* Meeting Card */}
              <Animated.View style={[
                styles.optionCard,
                { transform: [{ translateY: cardSlideAnim }] }
              ]}>
                <TouchableOpacity 
                  style={styles.cardContent}
                  onPress={() => navigation.navigate("MeetingPage")}
                >
                  <View style={styles.cardIconContainer}>
                    <Icon name="video-call" size={32} color="#6b7280" />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>Start Meeting</Text>
                    <Text style={styles.cardDescription}>
                      Begin recording medical consultations
                    </Text>
                  </View>
                  <View style={styles.cardArrow}>
                    <Icon name="arrow-forward" size={18} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
              
              {/* Chat with AI Card */}
              <Animated.View style={[
                styles.optionCard,
                { transform: [{ translateY: cardSlideAnim }] }
              ]}>
                <TouchableOpacity 
                  style={styles.cardContent}
                  onPress={() => navigation.navigate("Chatbot")}
                >
                  <View style={styles.cardIconContainer}>
                    <Icon name="smart-toy" size={32} color="#6b7280" />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>Chat with AI</Text>
                    <Text style={styles.cardDescription}>
                      Get health insights from medical AI assistant
                    </Text>
                  </View>
                  <View style={styles.cardArrow}>
                    <Icon name="arrow-forward" size={18} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
              
            </View>
          </Animated.View>
        </ScrollView>

        {/* Footer matching Upload page style */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 DocuAI Healthcare Assistant</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Same as Upload page
  },

  // Header with same styling as Upload page
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
    position: 'relative',
    overflow: 'visible', // Changed from 'hidden' to 'visible'
    zIndex: 10, // Added zIndex to header
  },

  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3b82f6', // Same medical blue as Upload page
    opacity: 0.95,
  },

  // Rotating Logo Container (same as Upload page)
  headerLogoContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1,
    overflow: 'hidden',
  },

  rotatingLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
    zIndex: 1,
  },

  headerTitle: {
    fontSize: 18,
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

  headerActions: {
    zIndex: 1,
  },

  userButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Fixed Dropdown Overlay
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // Very high zIndex
  },

  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },

  dropdownMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 85 : 70, // Adjusted for header height
    right: 15, // 15px from right edge instead of 0
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },

  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 8,
    paddingTop: 12,
  },

  dropdownItemIcon: {
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },

  dropdownItemText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  logoutItemText: {
    color: '#ef4444',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  mainContent: {
    flex: 1,
  },

  optionsContainer: {
    marginTop: 10,
  },

  // Option cards with Upload page styling
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },

  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  cardTextContainer: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },

  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },

  cardArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Footer matching Upload page
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },

  footerText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default HomeScreen;
