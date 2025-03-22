// // src/context/AuthContext.tsx
// import React, { createContext, useState, useEffect } from 'react';
// import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// interface AuthContextProps {
//   user: FirebaseAuthTypes.User | null;
//   setUser: React.Dispatch<React.SetStateAction<FirebaseAuthTypes.User | null>>;
//   logOut: () => Promise<void>;
// }

// export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

//   useEffect(() => {
//     const unsubscribe = auth().onAuthStateChanged(setUser);
//     return () => unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, setUser, logOut: async () => await auth().signOut() }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
