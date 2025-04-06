import React from "react";
import { ImageBackground, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import HomeScreen from "./screens/HomeScreen";
import WelcomeScreen from "./screens/welcomeScreen";  
import UploadPage from "./video/uploadPage";
// import UpdateProfileScreen from "./screens/updateProfileScreen";
import UpdateProfileScreen from "./screens/UpdateProfileScreen";
import ChatbotScreen from "./video/chatbot";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import AudioRecordPage from "./video/useRecording";


const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user } = React.useContext(AuthContext) || {};

  return (
    
  
  <Stack.Navigator screenOptions={{ headerShown: false }}>
  {!user ? (
    // Public screens (only accessible if not logged in)
    <>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="forgotPassword" component={ForgotPasswordScreen} />
    </>
  ) : (
    // Protected screens (only accessible after login)
    <>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Upload" component={UploadPage} />
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} />
      <Stack.Screen name="MeetingPage" component={AudioRecordPage} />
    </>
  )}
</Stack.Navigator>

  )
};


const App = () => {
  return (
    <AuthProvider>
           <ImageBackground
        source={require("./assets/bg_health.jpg")}
        style={styles.background}
        resizeMode="cover" 
      >
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      </ImageBackground>
    </AuthProvider>
  );
};
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    
  },
});

export default App;
