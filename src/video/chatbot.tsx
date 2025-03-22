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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

const ChatbotScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      const response = await axios.post('http://127.0.0.1:5002/chatbot', {
        message: userMessage.text,
      },);
  
      console.log('API Response:', response.data); // Debugging log
  
      // Ensure response has valid data
      if (!response.data || !response.data.reply) {
        throw new Error('Invalid response from backend');
      }
  
      // Remove loading message and add bot response
      setMessages((prevMessages) => {
        const filtered = prevMessages.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: response.data.reply, // ✅ Using actual reply
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
  
  const pickAudio = async () => {
    try {
      const result = await pick({
        type: [types.audio],
        allowMultiSelection: false,
      });
  
      if (!result || result.length === 0) return;
  
      setIsLoading(true);
      const loadingMessage: Message = {
        id: Date.now().toString(),
        text: 'Transcribing audio...',
        isUser: false,
        timestamp: new Date(),
        isLoading: true,
      };
      setMessages((prevMessages) => [...prevMessages, loadingMessage]);
  
      const formData = new FormData();
      formData.append('file', {
        uri: result[0].uri,
        type: result[0].type,
        name: result[0].name,
      } as any);
  
      const response = await axios.post('http://your-api-url/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      setMessages((prevMessages) => {
        const filtered = prevMessages.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: `Transcription: ${response.data.transcript}`,
            isUser: false,
            timestamp: new Date(),
          },
        ];
      });
    } catch (error) {
        if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
            console.log('User canceled document picker');
            return;
          }
      console.error('Error picking audio:', error);
      setMessages((prevMessages) => {
        const filtered = prevMessages.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: 'Sorry, there was an error transcribing your audio.',
            isUser: false,
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  const pickImage = async () => {
    try {
      const result = await pick({
        type: [types.images],
        allowMultiSelection: false,
      });
  
      if (!result || result.length === 0) return;
  
      setIsLoading(true);
      const loadingMessage: Message = {
        id: Date.now().toString(),
        text: 'Extracting text from image...',
        isUser: false,
        timestamp: new Date(),
        isLoading: true,
      };
      setMessages((prevMessages) => [...prevMessages, loadingMessage]);
  
      const formData = new FormData();
      formData.append('image', {
        uri: result[0].uri,
        type: result[0].type,
        name: result[0].name,
      } as any);
  
      const response = await axios.post('http://your-api-url/api/extract-text', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      setMessages((prevMessages) => {
        const filtered = prevMessages.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: `Extracted Text: ${response.data.text}`,
            isUser: false,
            timestamp: new Date(),
          },
        ];
      });
    } catch (error) {
        if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
            console.log('User canceled document picker');
            return;
          }
      console.error('Error picking image:', error);
      setMessages((prevMessages) => {
        const filtered = prevMessages.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: 'Sorry, there was an error extracting text from your image.',
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
    Animated.timing(inputOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    handleSend();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isLoading) {
      return (
        <View style={[styles.messageContainer, styles.botMessageContainer]}>
          <View style={styles.botAvatar}>
          <Image 
  source={require('../assets/robo.jpg')} 
  style={{ width: 20, height: 20, zIndex: 1, position: 'relative' }} 
/>
          </View>
          <View style={[styles.messageBubble, styles.botMessageBubble]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          item.isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        {!item.isUser && (
          <View style={styles.botAvatar}>
            {/* <MaterialIcons name="smart-toy" size={20} color="#fff" />
             */}
              <Image 
  source={require('../assets/robo.jpg')} 
  style={{ width: 20, height: 20, zIndex: 1, position: 'relative' }} 
/>
          
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            item.isUser ? styles.userMessageBubble : styles.botMessageBubble,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestampText}>{formatTime(item.timestamp)}</Text>
        </View>
        {item.isUser && (
          <View style={styles.userAvatar}>
            {/* <MaterialIcons name="person" size={20} color="#fff" /> */}
            <Image 
  source={require('../assets/emoji.jpg')} 
  style={{ width: 20, height: 20, zIndex: 1, position: 'relative' }} 
/>
          
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* <MaterialIcons name="smart-toy" size={24} color="#fff" /> */}
          <Image 
  source={require('../assets/robo.jpg')} 
  style={{ width: 20, height: 20, zIndex: 1, position: 'relative' }} 
/>
          
          <Text style={styles.headerTitle}>AI Assistant</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={pickAudio}>
            {/* <MaterialIcons name="mic" size={24} color="#FF6347" />
             */}
              <Image 
                   source={require('../assets/video.jpg')} 
                   style={{ width: 20, height: 20, zIndex: 1 }} 
                 />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
            {/* <MaterialIcons name="image" size={24} color="#32CD32" /> */}
               <Image 
                  source={require('../assets/upload.jpeg')} 
                  style={{ width: 40, height: 40, zIndex: 1 }} 
                />
          </TouchableOpacity>
          <Animated.View
            style={[
              styles.textInputContainer,
              {
                opacity: inputOpacity,
              },
            ]}
          >
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
          <Animated.View
            style={{
              transform: [{ scale: buttonScale }],
            }}
          >
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleButtonPress}
              disabled={!inputText.trim() || isLoading}
            >
                 <Image 
      source={require('../assets/send.jpg')} 
      style={{ width: 45, height: 45, zIndex: 1 }} 
    />
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
    shadowRadius: 1,
  },
  userMessageBubble: {
    backgroundColor: '#4a6da7',
    borderBottomRightRadius: 5,
    marginRight: 5,
  },
  botMessageBubble: {
    backgroundColor: '#6c8cbf',
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
});

export default ChatbotScreen;
