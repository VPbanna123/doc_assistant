import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, ImageBackground } from "react-native";

const WelcomeScreen = ({ navigation }: { navigation: any }) => {
  // Create animated values
  const rotation = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleScale = useRef(new Animated.Value(0.9)).current;
  
  // For word-by-word animation
  const welcomeWords = "Welcome to Our App!".split(" ");
  const wordAnimations = useRef(
    welcomeWords.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Logo rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      { iterations: -1 }
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/logo_health.jpg')} style={styles.logo} />
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
          <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center'}}>
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
                    marginRight: 8, 
                  }
                ]}
              >
                {word}
              </Animated.Text>
            ))}
          </View>
          
      
        </View>

        {/* React Native Logo Animation */}
        <View style={styles.reactLogoWrapper}>
          <Animated.View
            style={{
              width: 80,
              height: 80,
              transform: [{ rotate: rotateInterpolate }],
            }}
          >
            <Image
              source={require('../assets/logo_health.jpg')}
              style={styles.reactLogo}
            />
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
    height: 70, 
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 0, 
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
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 25,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  loginButton: {
    backgroundColor: "#FFB74D",
  },
  signupButton: {
    backgroundColor: "#4CAF89",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 25,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 8,
  },
  subText: {
    fontSize: 18,
    color: "#F5F5F5",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  reactLogoWrapper: {
    position: "absolute",
    bottom: 150,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  footerText: {
    color: "#E0E0E0",
    fontSize: 14,
  },
});

export default WelcomeScreen;
