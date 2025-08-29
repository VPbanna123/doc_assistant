
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
  TextStyle, // Add this import
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import RNFS from 'react-native-fs'; 
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Markdown from 'react-native-markdown-display'; // Add this import

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
      text: "Hello! I'm your **AI assistant**. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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
      
      const formData = new FormData();
      formData.append('audio', {
        uri: `data:audio/wav;base64,${audioData}`,
        type: 'audio/wav',
        name: 'recording.wav'
      } as any);
      
      const response = await axios.post(
        'http://127.0.0.1:5002/transcribe',
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

  // Custom markdown styles for dark theme - Fixed TypeScript types
  const markdownStyles: { [key: string]: TextStyle } = {
    body: {
      color: '#e5e7eb',
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400',
    },
    heading1: {
      color: '#f9fafb',
      fontSize: 18,
      fontWeight: '700',
      marginTop: 8,
      marginBottom: 4,
    },
    heading2: {
      color: '#f3f4f6',
      fontSize: 16,
      fontWeight: '600',
      marginTop: 6,
      marginBottom: 3,
    },
    heading3: {
      color: '#f3f4f6',
      fontSize: 15,
      fontWeight: '600',
      marginTop: 4,
      marginBottom: 2,
    },
    strong: {
      color: '#ffffff',
      fontWeight: '700',
    },
    em: {
      color: '#d1d5db',
      fontStyle: 'italic',
    },
    code_inline: {
      color: '#20B2AA',
      backgroundColor: '#374151',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    code_block: {
      color: '#e5e7eb',
      backgroundColor: '#1f2937',
      padding: 8,
      borderRadius: 6,
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      marginVertical: 4,
    },
    blockquote: {
      backgroundColor: '#374151',
      borderLeftWidth: 4,
      borderLeftColor: '#20B2AA',
      paddingLeft: 8,
      paddingVertical: 4,
      marginVertical: 4,
    },
    list_item: {
      color: '#e5e7eb',
      marginBottom: 2,
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    link: {
      color: '#60a5fa',
      textDecorationLine: 'underline',
    },
    paragraph: {
      marginBottom: 4,
      flexWrap: 'wrap',
    },
  } as const;

  const renderMessage = ({ item }: { item: Message }) => (
    <Animated.View style={[
      styles.messageContainer, 
      item.isUser ? styles.userMessageContainer : styles.botMessageContainer
    ]}>
      {!item.isUser && (
        <View style={styles.botAvatar}>
          <View style={styles.botAvatarInner}>
            <Text style={styles.botAvatarText}>AI</Text>
          </View>
        </View>
      )}
      
      <View style={[
        styles.messageBubble, 
        item.isUser ? styles.userMessageBubble : styles.botMessageBubble
      ]}>
        {item.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#20B2AA" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        ) : (
          <>
            {/* Render markdown for bot messages, plain text for user messages */}
            {item.isUser ? (
              <Text style={[
                styles.messageText,
                styles.userMessageText
              ]}>
                {item.text}
              </Text>
            ) : (
              <Markdown style={markdownStyles}>
                {item.text}
              </Markdown>
            )}
            <Text style={styles.timestampText}>{formatTime(item.timestamp)}</Text>
          </>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>◐</Text>
          </View>
          <Text style={styles.headerTitle}>AI Assistant</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <Animated.View style={{ transform: [{ scale: isRecording ? 1.05 : 1 }] }}>
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPress={isRecording ? stopVoiceRecognition : startVoiceRecognition}
              activeOpacity={0.8}
            >
              <MaterialIcons 
                name={isRecording ? "stop" : "mic"} 
                size={18} 
                color={isRecording ? "#ff6b6b" : "#20B2AA"} 
              />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.textInputContainer, { opacity: inputOpacity }]}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything..."
              placeholderTextColor="#6b7280"
              onFocus={handleInputFocus}
              multiline
              maxLength={1000}
            />
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleButtonPress}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.8}
            >
              <MaterialIcons 
                name="arrow-upward" 
                size={18} 
                color={!inputText.trim() ? "#6b7280" : "#1f2937"} 
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// Keep all your existing styles unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419', // Perplexity's dark background
  },
  header: {
    backgroundColor: '#1a1f2e',
    paddingTop: Platform.OS === 'ios' ? 45 : 20,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#20B2AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#f7fafc',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.85,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginLeft: 8,
  },
  userMessageBubble: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  userMessageText: {
    color: '#ffffff',
  },
  botMessageText: {
    color: '#e5e7eb',
  },
  timestampText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  botAvatarInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#20B2AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1f2e',
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginHorizontal: 8,
    minHeight: 40,
    maxHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  input: {
    fontSize: 15,
    color: '#f3f4f6',
    fontWeight: '400',
    textAlignVertical: 'center',
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#20B2AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  voiceButtonActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#ff6b6b',
  },
});

export default ChatbotScreen;
