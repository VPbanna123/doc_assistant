import React from "react";
import { ImageBackground, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import HomeScreen from "./screens/HomeScreen";
import WelcomeScreen from "./screens/welcomeScreen";  // Import WelcomeScreen
import UploadPage from "./video/uploadPage";
// import UpdateProfileScreen from "./screens/updateProfileScreen";
import UpdateProfileScreen from "./screens/UpdateProfileScreen";
import ChatbotScreen from "./video/chatbot";
// import RecordingPage from "./video/useRecording";
const Stack = createStackNavigator();

// const AppNavigator = () => {
//   const { user } = React.useContext(AuthContext) || {};

//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       {/* Show the Welcome Screen first */}
//       <Stack.Screen name="Welcome" component={WelcomeScreen} />
//       {user ? (
//         <>
//         <Stack.Screen name="Home" component={HomeScreen} />
//         <Stack.Screen name="Upload" component={UploadPage} />
//         </>
//       ) : (
//         <>
//           <Stack.Screen name="Login" component={LoginScreen} />
//           <Stack.Screen name="Signup" component={SignupScreen} />
         
//         </>
//       )}
//     </Stack.Navigator>
//   );
// const AppNavigator = () => {
//   const { user } = React.useContext(AuthContext) || {};

//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen 
//         name="Welcome" 
//         component={WelcomeScreen} 
//         options={{ 
//           // This prevents going back to welcome after login
//           headerLeft: () => null
//         }}
//       />
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="Signup" component={SignupScreen} />
//       <Stack.Screen name="Home" component={HomeScreen} />
//       <Stack.Screen name="Upload" component={UploadPage} />
//     </Stack.Navigator>
//   );
// };
const AppNavigator = () => {
  const { user } = React.useContext(AuthContext) || {};

  return (
    // <Stack.Navigator screenOptions={{ headerShown: false }}>
    //   {user ? (
    //     // If user is logged in, show HomeScreen and UploadPage only
    //     <>
    //       <Stack.Screen name="Home" component={HomeScreen} />
    //       <Stack.Screen name="Upload" component={UploadPage} />
    //     </>
    //   ) : (
    //     // If user is not logged in, show Welcome, Login, and Signup screens
    //     <>
    //       <Stack.Screen name="Welcome" component={WelcomeScreen} />
    //       <Stack.Screen name="Login" component={LoginScreen} />
    //       <Stack.Screen name="Signup" component={SignupScreen} />
    //     </>
    //   )}
    // </Stack.Navigator>
    <Stack.Navigator 
    initialRouteName={user ? "Home" : "Welcome"}
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Upload" component={UploadPage} />
    <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
    <Stack.Screen name="Chatbot" component={ChatbotScreen} />
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
