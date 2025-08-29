
import { FileSystem, Dirs } from 'react-native-file-access';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import axios from 'axios';
import { StackNavigationProp } from '@react-navigation/stack';
import RNFS from 'react-native-fs';
import { PermissionsAndroid } from 'react-native';
import Markdown from "react-native-markdown-display";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Define API endpoints
const API_BASE_URL = "http://127.0.0.1:5002";
const history_url = 'http://127.0.0.1:5000/save-history';
const FULL_WORKFLOW_URL = `${API_BASE_URL}/full-workflow`;

// Navigation Props
type RootStackParamList = {
  Home: undefined;
  UploadPage: undefined;
};

type UploadPageProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

// Define Document File Interface
interface DocumentFile {
  uri: string;
  type: string;
  name: string;
  size: number;
}

// Language options
const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

const UploadPage = ({ navigation }: UploadPageProps) => {
  const [audioFile, setAudioFile] = useState<DocumentFile | null>(null);
  const [imageFile, setImageFile] = useState<DocumentFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Language selection state
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous logo rotation
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: uploadProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [uploadProgress]);

  // Pick Audio/Video Document
  const pickAudioDocument = async () => {
    try {
      const result = await pick({
        type: [types.audio, types.video],
        allowMultiSelection: false,
      });

      if (result.length > 0) {
        const file = result[0];
        const selectedFile: DocumentFile = {
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name || 'unknown_file',
          size: file.size ?? 0,
        };
        setAudioFile(selectedFile);
        resetResults();
      }
    } catch (err) {
      handlePickerError(err);
    }
  };

  // Pick Image Document (for OCR)
  const pickImageDocument = async () => {
    try {
      const result = await pick({
        type: [types.images],
        allowMultiSelection: false,
      });

      if (result.length > 0) {
        const file = result[0];
        const selectedFile: DocumentFile = {
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name || 'unknown_file',
          size: file.size ?? 0,
        };
        setImageFile(selectedFile);
      }
    } catch (err) {
      handlePickerError(err);
    }
  };

  const handlePickerError = (err: any) => {
    if (isErrorWithCode(err)) {
      switch (err.code) {
        case errorCodes.OPERATION_CANCELED:
          console.log('User cancelled document picker');
          break;
        case errorCodes.UNABLE_TO_OPEN_FILE_TYPE:
          Alert.alert('Error', 'This file type is not supported');
          break;
        case errorCodes.IN_PROGRESS:
          console.warn('Document picker already in progress');
          break;
        default:
          Alert.alert('Error', 'Failed to select file');
      }
    } else {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const resetResults = () => {
    setTranscript('');
    setAnalysis('');
    setExtractedText('');
    setSummary('');
  };

  // Language selection functions
  const renderLanguageSelector = () => {
    const selectedLang = LANGUAGE_OPTIONS.find(lang => lang.code === selectedLanguage);
    
    return (
      <View style={styles.languageSection}>
        <Text style={styles.sectionLabel}>🌐 Analysis Language</Text>
        <TouchableOpacity 
          style={styles.languageSelector} 
          onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
        >
          <View style={styles.languageSelectorContent}>
            <Text style={styles.selectedLanguageText}>
              {selectedLang?.name || 'English'}
            </Text>
            <MaterialIcons 
              name={showLanguageDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={24} 
              color="#6b7280" 
            />
          </View>
        </TouchableOpacity>
        
        {showLanguageDropdown && (
          <View style={styles.languageDropdown}>
            <ScrollView style={styles.languageList} nestedScrollEnabled>
              {LANGUAGE_OPTIONS.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === language.code && styles.selectedLanguageOption
                  ]}
                  onPress={() => {
                    setSelectedLanguage(language.code);
                    setShowLanguageDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.languageOptionText,
                    selectedLanguage === language.code && styles.selectedLanguageOptionText
                  ]}>
                    {language.name}
                  </Text>
                  {selectedLanguage === language.code && (
                    <MaterialIcons name="check" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // Process Files through Full Workflow
  const processFiles = async () => {
    if (!audioFile) {
      Alert.alert('Missing File', 'Please select an audio or video file');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      // Add audio file
      formData.append('file', {
        uri: audioFile.uri,
        type: audioFile.type || 'application/octet-stream',
        name: audioFile.name || `recording${audioFile.type?.includes('video') ? '.mp4' : '.mp3'}`,
      } as any);
      
      // Add image file if available
      if (imageFile) {
        formData.append('image', {
          uri: imageFile.uri,
          type: imageFile.type || 'application/octet-stream',
          name: imageFile.name || 'image.png',
        } as any);
      }

      // Add selected language to the request
      formData.append('language', selectedLanguage);

      // Call full workflow endpoint
      const response = await axios.post(FULL_WORKFLOW_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(progressEvent.loaded / progressEvent.total);
          }
        },
      });

      // Process response
      setTranscript(response.data.transcription || '');
      setAnalysis(response.data.chatbot_reply || '');
      
      if (response.data.extracted_text) {
        setExtractedText(response.data.extracted_text);
      }
      
      if (response.data.summary) {
        setSummary(response.data.summary);
      }
   
    } catch (error: any) {
      console.error('Error processing files:', error);
      let errorMessage = 'Failed to process your files. Please try again.';
      
      if (error.response) {
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
        errorMessage = error.response.data.error || errorMessage;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'Server not responding. Check your connection.';
      }
      
      Alert.alert('Processing Error', errorMessage);
    } 
    finally {
      setIsProcessing(false);
      setUploadProgress(1);
    }
  };

  const saveReportToDownloads = async () => {
    const reportContent = `MEDICAL REPORT\n\n` +
      `AI ANALYSIS:\n${analysis}`;
    
    try {
      const fileName = `MedicalAnalysis_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
      const tempPath = `${Dirs.DocumentDir}/${fileName}`;
      
      await FileSystem.writeFile(tempPath, reportContent, 'utf8');
      await FileSystem.cpExternal(tempPath, fileName, 'downloads');
      
      Alert.alert(
        "Report Saved",
        `Your analysis has been saved to Downloads as "${fileName}"`,
        [{ text: "OK" }]
      );
      
      console.log('Report saved successfully');
    } catch (error) {
      console.error('Error saving report:', error);
      Alert.alert("Save Failed", "Could not save the analysis. Please try again.");
    }
  };

  // Modified dashboard to show only analysis
  const renderDashboard = () => {
    return (
      <Animated.View style={[styles.dashboardContainer, { opacity: fadeAnim }]}>
        <View style={styles.contentContainer}>
          <ContentCard title="AI Medical Analysis" content={analysis} />
        </View>
        
        <TouchableOpacity onPress={saveReportToDownloads} style={styles.saveButton}>
          <MaterialIcons name="download" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetResults} style={styles.newAnalysisButton}>
          <MaterialIcons name="refresh" size={20} color="#fff" />
          <Text style={styles.newAnalysisText}>New Analysis</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Enhanced Navbar with Gradient */}
        <View style={styles.header}>
          <View style={styles.headerGradient} />
          
          {/* MaterialIcon Back Button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {analysis ? 'Medical Analysis' : 'Medical AI Assistant'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {analysis ? 'Review your analysis' : 'Upload files for analysis'}
            </Text>
          </View>
          
          {/* Keep Your App Logo Rotating */}
          <View style={styles.headerLogoContainer}>
            <Animated.Image 
              source={require('../assets/logo_health.jpg')} 
              style={[
                styles.rotatingLogo,
                { transform: [{ rotate: logoRotateInterpolate }] }
              ]} 
            />
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {!analysis ? (
            <Animated.View style={[
              styles.uploadSection,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}>
              
              {/* Language Selection */}
              {renderLanguageSelector()}
              
              {/* Audio File Upload - Compact */}
              <View style={styles.fileSection}>
                <Text style={styles.sectionLabel}>🎵 Audio/Video File</Text>
                <TouchableOpacity 
                  style={[styles.uploadBox, audioFile && styles.uploadBoxSelected]} 
                  onPress={pickAudioDocument} 
                  disabled={isProcessing}
                >
                  <View style={styles.uploadContent}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="audiotrack" size={24} color="#6b7280" />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={[styles.uploadText, audioFile && styles.uploadTextSelected]}>
                        {audioFile ? audioFile.name : 'Select audio or video file'}
                      </Text>
                      {audioFile && (
                        <Text style={styles.fileSize}>
                          {audioFile.size ? `${(audioFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                        </Text>
                      )}
                    </View>
                    {audioFile && (
                      <View style={styles.checkmark}>
                        <MaterialIcons name="check" size={16} color="#fff" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Image File Upload - Compact */}
              <View style={styles.fileSection}>
                <Text style={styles.sectionLabel}>📄 Medical Document <Text style={styles.optional}>(Optional)</Text></Text>
                <TouchableOpacity 
                  style={[styles.uploadBox, imageFile && styles.uploadBoxSelected]} 
                  onPress={pickImageDocument} 
                  disabled={isProcessing}
                >
                  <View style={styles.uploadContent}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="description" size={24} color="#6b7280" />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={[styles.uploadText, imageFile && styles.uploadTextSelected]}>
                        {imageFile ? imageFile.name : 'Select medical document'}
                      </Text>
                      {imageFile && (
                        <Text style={styles.fileSize}>
                          {imageFile.size ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                        </Text>
                      )}
                    </View>
                    {imageFile && (
                      <View style={styles.checkmark}>
                        <MaterialIcons name="check" size={16} color="#fff" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Process Button */}
              {audioFile && (
                <View style={styles.processSection}>
                  <TouchableOpacity 
                    style={styles.processButton} 
                    onPress={processFiles} 
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <View style={styles.processingContainer}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.processButtonText}>Processing...</Text>
                      </View>
                    ) : (
                      <View style={styles.processingContainer}>
                        <MaterialIcons name="psychology" size={20} color="#fff" />
                        <Text style={styles.processButtonText}>Start AI Analysis</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  {isProcessing && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <Animated.View style={[
                          styles.progressFill,
                          { width: progressWidth }
                        ]} />
                      </View>
                      <Text style={styles.progressText}>Analyzing your files...</Text>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          ) : (
            renderDashboard()
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

// Simple Content Card Component
const ContentCard: React.FC<{
  title: string;
  content: string;
}> = ({ title, content }) => {
  return (
    <View style={styles.contentCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <ScrollView style={styles.cardContent} nestedScrollEnabled>
        <Text style={styles.contentText}>
          <Markdown>{content}</Markdown>
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Soft healthcare background
  },

  // Enhanced Header with Gradient
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
    position: 'relative',
    overflow: 'hidden',
  },

  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3b82f6', // Medical blue gradient
    opacity: 0.95,
  },

  // Custom Back Button
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1,
  },

  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
    zIndex: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },

  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },

  // Rotating Logo Container
  headerLogoContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1,
    overflow: 'hidden',
  },

  rotatingLogo: {
    width: 32, // Logo size inside the container
    height: 32,
    borderRadius: 16,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  uploadSection: {
    flex: 1,
  },

  // Language Selection Styles
  languageSection: {
    marginBottom: 25,
    zIndex: 1000, // Ensure dropdown appears above other elements
  },

  languageSelector: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  languageSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedLanguageText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },

  languageDropdown: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  languageList: {
    maxHeight: 200,
  },

  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  selectedLanguageOption: {
    backgroundColor: '#f0f9ff',
  },

  languageOptionText: {
    fontSize: 15,
    color: '#374151',
  },

  selectedLanguageOptionText: {
    color: '#3b82f6',
    fontWeight: '600',
  },

  // Compact File Sections
  fileSection: {
    marginBottom: 25,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },

  optional: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },

  // No Borders, Clean Design
  uploadBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18, // Compact size
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  uploadBoxSelected: {
    backgroundColor: '#f0fdf4',
    shadowColor: '#10b981',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  uploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  textContainer: {
    flex: 1,
  },

  uploadText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },

  uploadTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },

  fileSize: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },

  checkmark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Process Section
  processSection: {
    marginTop: 30,
  },

  processButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
  },

  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },

  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '500',
  },

  // Dashboard
  dashboardContainer: {
    flex: 1,
  },

  contentContainer: {
    flex: 1,
    marginBottom: 20,
  },

  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },

  cardContent: {
    flex: 1,
  },

  contentText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },

  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  newAnalysisButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },

  newAnalysisText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default UploadPage;
