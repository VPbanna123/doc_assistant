import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ImageBackground
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

// const useRecording = () => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordSecs, setRecordSecs] = useState(0);
//   const [recordTime, setRecordTime] = useState('00:00:00');
//   const [audioFilePath, setAudioFilePath] = useState('');

//   const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

//   useEffect(() => {
//     requestPermissions();
//   }, []);

//   const requestPermissions = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const audioPermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
//         const storagePermission = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);

//         if (audioPermission !== RESULTS.GRANTED || storagePermission !== RESULTS.GRANTED) {
//           Alert.alert('Permission Denied', 'Please enable permissions in settings.');
//           return;
//         }

//         console.log('Permissions granted.');
//       } catch (err) {
//         console.warn('Permission error:', err);
//       }
//     }
//   };

//   const startRecording = async () => {
//     if (isRecording) return;

//     const audioSet: AudioSet = {
//       AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
//       AudioSourceAndroid: AudioSourceAndroidType.MIC,
//       AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
//       AVNumberOfChannelsKeyIOS: 2,
//       AVFormatIDKeyIOS: AVEncodingOption.aac,
//     };

//     const path = Platform.select({
//       ios: `${RNFS.DocumentDirectoryPath}/recording.m4a`,
//       android: `${RNFS.ExternalDirectoryPath}/recording.aac`,
//     });

//     console.log('Audio File Path:', path);
//     setAudioFilePath(path || '');

//     try {
//       const result = await audioRecorderPlayer.startRecorder(path, audioSet);
//       audioRecorderPlayer.addRecordBackListener((e) => {
//         setRecordSecs(e.currentPosition);
//         setRecordTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
//         return;
//       });

//       console.log('Recording started:', result);
//       setIsRecording(true);
//     } catch (error) {
//       console.error('startRecording failed', error);
//       Alert.alert('Error', 'Failed to start recording. Please check permissions.');
//       setIsRecording(false);
//     }
//   };

//   const stopRecording = async () => {
//     if (!isRecording) return;

//     try {
//       const result = await audioRecorderPlayer.stopRecorder();
//       audioRecorderPlayer.removeRecordBackListener();
//       setRecordSecs(0);
//       console.log('Recording stopped:', result);
//       setIsRecording(false);
//       Alert.alert("Success", `Audio file saved successfully!\nPath: ${audioFilePath}`);
//     } catch (error) {
//       console.error('stopRecording failed', error);
//       Alert.alert('Error', 'Failed to stop recording.');
//     }
//   };

//   return {
//     isRecording,
//     recordTime,
//     startRecording,
//     stopRecording,
//   };
// };
const useRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0); // Seconds elapsed during recording
  const [recordTime, setRecordTime] = useState('00:00'); // MM:SS formatted time
  const [audioFilePath, setAudioFilePath] = useState('');

  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  useEffect(() => {
    requestPermissions();
  }, []);

  // Helper function to format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const audioPermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        const storagePermission = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);

        if (audioPermission !== RESULTS.GRANTED || storagePermission !== RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Please enable permissions in settings.');
          return;
        }

        console.log('Permissions granted.');
      } catch (err) {
        console.warn('Permission error:', err);
      }
    }
  };

  const startRecording = async () => {
    if (isRecording) return;

    const audioSet: AudioSet = {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVNumberOfChannelsKeyIOS: 2,
      AVFormatIDKeyIOS: AVEncodingOption.aac,
    };

    const path = Platform.select({
      ios: `${RNFS.DocumentDirectoryPath}/recording.m4a`,
      android: `${RNFS.ExternalDirectoryPath}/recording.aac`,
    });

    console.log('Audio File Path:', path);
    setAudioFilePath(path || '');

    try {
      const result = await audioRecorderPlayer.startRecorder(path, audioSet);
      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordSecs(Math.floor(e.currentPosition / 1000)); // Convert milliseconds to seconds
        setRecordTime(formatTime(Math.floor(e.currentPosition / 1000))); // Update MM:SS format
        return;
      });

      console.log('Recording started:', result);
      setIsRecording(true);
    } catch (error) {
      console.error('startRecording failed', error);
      Alert.alert('Error', 'Failed to start recording. Please check permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecordSecs(0); // Reset seconds
      setRecordTime('00:00'); // Reset MM:SS format
      console.log('Recording stopped:', result);
      setIsRecording(false);
      Alert.alert("Success", `Audio file saved successfully!\nPath: ${audioFilePath}`);
    } catch (error) {
      console.error('stopRecording failed', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  return {
    isRecording,
    recordTime,
    startRecording,
    stopRecording,
  };
};

interface AudioRecordPageProps {
  style?: any;
}

const AudioRecordPage: React.FC<AudioRecordPageProps> = ({ style }) => {
  const { isRecording, recordTime, startRecording, stopRecording } = useRecording();

  return (
     <ImageBackground 
          source={require('../assets/rec.png')} 
          style={styles.backgroundImage}
        >
    <View style={[styles.container, style]}>
      <Text style={styles.title}>AI Assistant</Text>
      <Text style={styles.recordTime}>Recording Time: {recordTime}</Text>
      <TouchableOpacity
        style={styles.recordButton}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.recordButtonText}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: "transparent", 
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
    position: 'absolute',
    top: 60, 
    textAlign: 'center',
  },
  recordTime: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  recordButton: {
    backgroundColor: '#ff4500', 
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 5,
    position: 'absolute',
    bottom: 80, 
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});


export default AudioRecordPage;
