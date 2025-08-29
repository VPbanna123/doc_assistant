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
import UpdateProfileScreen from "./screens/UpdateProfileScreen";
import ChatbotScreen from "./video/chatbot";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import AudioRecordPage from "./video/useRecording";
import VerifyOtpScreen from "./screens/verify_otp_page";
import ResetPasswordScreen from "./screens/reset-password"; // Add this import

// Define the root stack param list that matches all your screens
export type RootStackParamList = {
  // Public screens (authentication flow)
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  forgotPassword: undefined;
  VerifyOtp: { email: string; phoneNumber?: string };
  ResetPassword: { email: string; otpToken?: string };
  
  // Protected screens (after login)
  Home: undefined;
  Upload: undefined;
  UpdateProfile: undefined;
  Chatbot: undefined;
  MeetingPage: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

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
          <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
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
  );
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
