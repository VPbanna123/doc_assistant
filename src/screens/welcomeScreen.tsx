
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Platform } from "react-native";

const WelcomeScreen = ({ navigation }: { navigation: any }) => {
  // Create animated values
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleScale = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const navbarLogoRotate = useRef(new Animated.Value(0)).current; // Separate rotation for navbar logo
  
  // For word-by-word animation
  const welcomeWords = "Welcome to DocuAI!".split(" ");
  const wordAnimations = useRef(
    welcomeWords.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Page fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Logo rotation animation (for the body logo)
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    ).start();

    // Navbar logo rotation animation
    Animated.loop(
      Animated.timing(navbarLogoRotate, {
        toValue: 1,
        duration: 4000, // Different speed for navbar logo
        useNativeDriver: true,
      })
    ).start();
    
    // Word-by-word animation
    const animateWords = () => {
      // Reset all animations to 0
      wordAnimations.forEach(anim => anim.setValue(0));
      
      // Create a sequence of animations with staggered delays
      const animations = wordAnimations.map((anim, index) => {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 180,
          useNativeDriver: true,
        });
      });
      
      // Run the sequence and then loop
      Animated.sequence([
        ...animations,
        // Pause at the end before restarting
        Animated.delay(1000)
      ]).start(() => animateWords()); // Recursive call creates the loop
    };
    
    // Start the word animation
    animateWords();
    
    // Subtitle animation
    Animated.parallel([
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(subtitleScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    return () => {
      // Clean up animations if component unmounts
      wordAnimations.forEach(anim => anim.stopAnimation());
    };
  }, []);

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const navbarLogoRotateInterpolate = navbarLogoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        {/* Header with same styling as other pages */}
        <View style={styles.header}>
          <View style={styles.headerGradient} />
          
          <View style={styles.logoContainer}>
            <Animated.Image 
              source={require('../assets/logo_health.jpg')} 
              style={[
                styles.logo,
                { transform: [{ rotate: navbarLogoRotateInterpolate }] }
              ]} 
            />
          </View>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.signupButton]}
              onPress={() => navigation.navigate("Signup")}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content with Animated Text */}
        <View style={styles.mainContent}>
          {/* Word-by-word animated welcome text */}
          <View style={styles.welcomeTextWrapper}>
            {welcomeWords.map((word, index) => (
              <Animated.Text
                key={index}
                style={[
                  styles.welcomeText,
                  {
                    opacity: wordAnimations[index],
                    transform: [
                      { 
                        translateY: wordAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0] 
                        })
                      },
                      {
                        scale: wordAnimations[index].interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.8, 1.2, 1] 
                        })
                      }
                    ],
                  }
                ]}
              >
                {word}{' '}
              </Animated.Text>
            ))}
          </View>
        </View>

        {/* Spacer between text and logo */}
        <View style={styles.spacer} />

        {/* React Native Logo Animation - Proper positioning in flow */}
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.reactLogoContainer,
              { transform: [{ rotate: logoRotateInterpolate }] }
            ]}
          >
            <Image
              source={require('../assets/logo_health.jpg')}
              style={styles.reactLogo}
            />
          </Animated.View>
        </View>

        {/* Spacer between logo and footer */}
        <View style={styles.spacer} />

      </Animated.View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Text style={styles.footerText}>© 2025 DocuAI</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Same as other pages
  },

  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Header with same styling as other pages
  header: {
    width: "100%",
    height: 80,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === 'ios' ? 30 : 0,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },

  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3b82f6', // Same medical blue
    opacity: 0.95,
  },

  logoContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
    zIndex: 1,
  },

  logo: {
    width: 50,
    height: 50,
    resizeMode: "cover",
    borderRadius: 25,
  },

  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },

  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 25,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },

  loginButton: {
   backgroundColor: "#b310b9ff", 
    // borderWidth: 1,
    // borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  signupButton: {
    backgroundColor: "#10b981", // Same green as other pages
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600", // Changed from bold to 600
  },

  mainContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  welcomeTextWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },

  welcomeText: {
    fontSize: 36,
    fontWeight: "800", // Changed from bold to 800
    color: "#1f2937", // Dark gray color matching other pages
    textAlign: "center",
    marginRight: 8,
    marginBottom: 4,
  },

  // Spacer for vertical spacing
  spacer: {
    height: 60, // Adjust this value to control spacing
  },

  // Logo section - positioned in document flow
  logoSection: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },

  reactLogoContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },

  reactLogo: {
    width: 80,
    height: 80,
    resizeMode: "cover",
    borderRadius: 40,
  },

  // Footer - Fixed centering
  footer: {
    width: "100%",
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Same as other pages
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb', // Same as other pages
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center', // Center the footer content
    alignItems: 'center', // Center the footer content
  },

  footerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Take full width
  },

  footerText: {
    color: '#6b7280', // Same gray as other pages
    fontSize: 14,
    fontWeight: '500', // Same weight as other pages
    textAlign: 'center', // Center the text
  },
});

export default WelcomeScreen;
