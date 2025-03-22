// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import { mediaDevices } from 'react-native-webrtc';
// // import {createFFmpeg} from '@ffmpeg/ffmpeg';
// import createFFmpeg from '@ffmpeg/ffmpeg';

// const ffmpeg = createFFmpeg({ log: true });

// const RecordingPage = () => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

//   const startRecording = async () => {
//     if (!ffmpeg.isLoaded()) {
//       await ffmpeg.load();
//     }

//     try {
//       const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
//       setVideoStream(stream);
//       setIsRecording(true);
//       Alert.alert('Recording Started');
//     } catch (error) {
//       Alert.alert('Error', 'Failed to start recording.');
//       console.error(error);
//       setIsRecording(false);
//     }
//   };

//   const stopRecording = async () => {
//     if (!videoStream) return;

//     // Handle video saving logic here

//     setIsRecording(false);
//     Alert.alert('Recording Stopped');
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Meeting Recording</Text>
//       <View style={styles.buttonsContainer}>
//         <TouchableOpacity
//           style={[styles.button, isRecording && styles.buttonDisabled]}
//           onPress={isRecording ? stopRecording : startRecording}
//           disabled={isRecording}
//         >
//           <Text style={styles.buttonText}>
//             {isRecording ? 'Stop Recording' : 'Start Recording'}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#1a1a1a',
//     padding: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 40,
//   },
//   buttonsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   button: {
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 10,
//     backgroundColor: '#32CD32',
//     marginHorizontal: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   buttonDisabled: {
//     backgroundColor: '#d3d3d3',
//   },
// });

// export default RecordingPage;
