import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import Markdown from "react-native-markdown-display";
import RNFS from 'react-native-fs'; 
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
const { width } = Dimensions.get('window');
const audioRecorderPlayer = new AudioRecorderPlayer();
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}
async function requestMicrophonePermission() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'App needs access to your microphone for voice search',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }
  return true;
}

const ChatbotScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // State for voice recording
  const flatListRef = useRef<FlatList>(null);
  const inputOpacity = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);
  const recordAudio = async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        Alert.alert('Permission required', 'Microphone access is needed for voice search');
        return '';
      }

      const audioPath = Platform.OS === 'android' 
        ? RNFS.ExternalDirectoryPath + '/audio.wav'
        : RNFS.LibraryDirectoryPath + '/audio.wav';

      await audioRecorderPlayer.startRecorder(audioPath, {
        AudioEncoderAndroid: 3,
        AudioSourceAndroid: 1,
        OutputFormatAndroid: 2,
        AudioEncodingBitRateAndroid: 128000,
        AudioSamplingRateAndroid: 16000,
      });

      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();

      return await RNFS.readFile(result, 'base64');
    } catch (error) {
      console.error('Recording failed:', error);
      return '';
    }
  };
  

  const startVoiceRecognition = async () => {
    try {
      setIsRecording(true);
      const audioData = await recordAudio();

      if (!audioData) {
        throw new Error('Failed to record audio');
      }

      // Send the recorded audio to your backend for processing
      const formData = new FormData();
      formData.append('audio', {
        uri: `data:audio/wav;base64,${audioData}`,
        type: 'audio/wav',
        name: 'recording.wav'
      } as any);
      const response = await axios.post(
        'http://127.0.0.1:5002/api/voice/process',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.transcription) {
        setInputText(response.data.transcription);
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), text: response.data.transcription, isUser: true, timestamp: new Date() },
          { id: (Date.now() + 1).toString(), text: response.data.reply, isUser: false, timestamp: new Date() },
        ]);
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      Alert.alert('Error', 'Failed to process voice input');
    } finally {
      setIsRecording(false);
    }
  };

  
  const stopVoiceRecognition = async () => {
    try {
      setIsRecording(false);
      // Stop recording logic here
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: '',
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage, loadingMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:5002/chatbot', { message: userMessage.text });

      if (!response.data || !response.data.reply) {
        throw new Error('Invalid response from backend');
      }

      setMessages((prevMessages) => {
        const filtered = prevMessages.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: response.data.reply,
            isUser: false,
            timestamp: new Date(),
          },
        ];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) => {
        const filtered = prevMessages.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: 'Sorry, there was an error processing your request.',
            isUser: false,
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = () => {
    Animated.timing(inputOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    handleSend();
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessageContainer : styles.botMessageContainer]}>
      {!item.isUser && (
        <View style={styles.botAvatar}>
          <Image source={require('../assets/gemini.png')} style={{ width: 27, height: '80%',padding: 5,resizeMode: 'contain' }} />
        </View>
      )}
      <View style={[styles.messageBubble, item.isUser ? styles.userMessageBubble : styles.botMessageBubble]}>
        <Text style={styles.messageText}><Markdown>{item.text}</Markdown></Text>
        <Text style={styles.timestampText}>{formatTime(item.timestamp)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          {/* Voice Button */}
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={isRecording ? stopVoiceRecognition : startVoiceRecognition}
          >
           <Image 
                 source={require('../assets/mic.svg')} 
                 style={{ width: 25, height: 25 ,resizeMode: 'contain',}}
               />
          </TouchableOpacity>

          {/* Text Input */}
          <Animated.View style={[styles.textInputContainer, { opacity: inputOpacity }]}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              onFocus={handleInputFocus}
              multiline
            />
          </Animated.View>

          {/* Send Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleButtonPress}
              disabled={!inputText.trim() || isLoading}
            >
              <Image source={require('../assets/send.png')} style={{ width: 45, height: 45 ,resizeMode: 'contain'}} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4a6da7',
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  messagesContainer: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  messageContainer: {
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.7,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessageBubble: {
    backgroundColor: 'rgba(128, 185, 223, 0.7)',
    borderBottomRightRadius: 5,
    marginRight: 5,
  },
  botMessageBubble: {
    backgroundColor: 'rgba(128, 185, 223, 0.7)',
    borderBottomLeftRadius: 5,
    marginLeft: 5,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  timestampText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4a6da7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6c8cbf',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 10,
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 10,
    color: '#333',
  },
  attachButton: {
    padding: 8,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#4a6da7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  markdownText: {
    fontSize: 16,
    color: '#fff', 
  },
  voiceButton: { // Style for voice button
    padding: 10,
  },
});

export default ChatbotScreen;
