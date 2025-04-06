
import React, { useEffect, useRef, useState,useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, ImageBackground } from "react-native";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { AuthContext } from "../context/AuthContext";

const HomeScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  // Get user data from route params or context

  const authContext = useContext(AuthContext);
  const logout=useContext(AuthContext)
  if (!authContext) {
    throw new Error("HomeScreen must be used within an AuthProvider");
  }
  
  const { user } = authContext;
  
  // State for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Create animated values
  const rotation = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  // Function to extract user name from email
  const extractNameFromEmail = (email:String) => {
    if (!email) return "User";
    
    // Remove domain part
    const namePart = email.split('@')[0];
    
    // Replace dots/underscores with spaces and capitalize each word
    return namePart
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get display name
 
  const displayName = user ? extractNameFromEmail(user.email) : "User";
  
  // Function to toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Function to navigate and close dropdown
  const navigateTo = (screenName:String) => {
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
    // Logo rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();

    // Text and buttons fade-in animations
    Animated.stagger(300, [
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <ImageBackground 
      source={require('../assets/bg_health.jpg')} 
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        {/* Header with user info and logout */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/logo_health.jpg')} style={styles.logo} />
          </View>
          
          {/* User name with dropdown */}
          <View style={styles.userNameContainer}>
            <TouchableOpacity onPress={toggleDropdown} style={styles.userNameButton}>
              <Text style={[styles.userNameText, { fontSize: getFontSize() }]}>
                {displayName}
              </Text>
              <Text style={styles.dropdownIcon}>{isDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={() => navigateTo("UpdateProfile")}
                >
                  <MaterialIcons name="person" size={16} color="#fff" style={styles.dropdownIcon} />
                  <Text style={styles.dropdownItemText}>Update Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={() => navigateTo("History")}
                >
                  <MaterialIcons name="history" size={16} color="#fff" style={styles.dropdownIcon} />
                  <Text style={styles.dropdownItemText}>History</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.logoutButton}
            // onPress={() => navigation.navigate("Login")
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Animated.Text 
            style={[
              styles.welcomeText,
              { opacity: titleOpacity }
            ]}
          >
            Welcome back, {displayName}!
          </Animated.Text>
          
          <Animated.View 
            style={[
              styles.optionsContainer,
              { opacity: buttonsOpacity }
            ]}
          >
            {/* Upload option */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => navigation.navigate("Upload")}
            >
              <View style={styles.optionIconContainer}>
              <Image 
      source={require('../assets/home_upload.png')} 
      style={{ width: 40, height: 40, zIndex: 1 }} 
    />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Upload Media</Text>
                <Text style={styles.optionDescription}>
                  Upload video or audio files for AI analysis
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* Meeting option */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => navigation.navigate("MeetingPage")}
            >
              <View style={styles.optionIconContainer}>
                <Image 
      source={require('../assets/meeting.jpg')} 
      style={{ width: 45, height: 45, zIndex: 1 }} 
    />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Start Meeting</Text>
                <Text style={styles.optionDescription}>
                  Begin recording meeting conversation
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
  style={styles.optionCard}
  onPress={() => navigation.navigate("Chatbot")}
>
  <View style={styles.optionIconContainer}>
    <Image 
      source={require('../assets/chat_ai.png')} 
      style={{ width: 45, height: 45, zIndex: 1 }} 
    />
  </View>
  <View style={styles.optionTextContainer}>
    <Text style={styles.optionTitle}>Chat with AI</Text>
    <Text style={styles.optionDescription}>
      Get health-related insights from the chatbot
    </Text>
  </View>
</TouchableOpacity>
          </Animated.View>
        </View>

        

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 DocuAI </Text>
        </View>
      </View>
    </ImageBackground>
  );
};
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: "transparent", 
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    width: "100%",
    height: 80,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: "cover",
    borderRadius: 25,
  },
  userNameContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  userNameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  userNameText: {
    color: '#000',
    fontWeight: 'bold',
    marginRight: 5,
  },
  dropdownIcon: {
    color: '#000',
    fontSize: 10,
    marginRight: 5,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
    width: 160,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemText: {
    color: '#000',
    fontSize: 14,
  },
  logoutButton: {
    padding: 5, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: "rgba(0, 0, 0, 0.1)", 
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, 
    shadowRadius: 4.65,
    elevation: 6,
  },
  logoutText: {
    color: "#000", 
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase", 
    letterSpacing: 0.7, 
  },
  mainContent: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 25,
    paddingTop: 30,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
    textAlign: "center",
  },
  optionsContainer: {
    width: "100%",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(50, 67, 92, 0.96)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
 
  optionIconContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6, 
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: "#fff",
    fontSize: 20, 
    fontWeight: "bold",
    marginBottom: 5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  optionDescription: {
    color: "#ddd", 
    fontSize: 15,
    lineHeight: 20, 
  },
  reactLogoContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 120,
  },
  reactLogo: {
    width: 80,
    height: 80,
    resizeMode: "cover",
    borderRadius: 40,
  },
  footer: {
    width: "100%",
    padding: 15,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  footerText: {
    color: "#aaa",
    fontSize: 14,
  },
});

export default HomeScreen;
