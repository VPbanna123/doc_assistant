// // src/services/authService.tsx
// import auth from '@react-native-firebase/auth';

// export const signUp = async (email: string, password: string) => {
//   try {
//     const userCredential = await auth().createUserWithEmailAndPassword(email, password);
//     return userCredential.user;
//   } catch (error) {
//     throw error;
//   }
// };

// export const logIn = async (email: string, password: string) => {
//   try {
//     const userCredential = await auth().signInWithEmailAndPassword(email, password);
//     return userCredential.user;
//   } catch (error) {
//     throw error;
//   }
// };

// export const logOut = async () => {
//   try {
//     await auth().signOut();
//   } catch (error) {
//     throw error;
//   }
// };

// export const getCurrentUser = () => {
//   return auth().currentUser;
// };
