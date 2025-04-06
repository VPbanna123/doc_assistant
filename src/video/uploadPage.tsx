import { FileSystem, Dirs } from 'react-native-file-access';

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  ImageBackground
} from 'react-native';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { StackNavigationProp } from '@react-navigation/stack';
// import Arrow from '../assets/arrow.svg';
import RNFS from 'react-native-fs';
import {  PermissionsAndroid } from 'react-native';
import Markdown from "react-native-markdown-display";

// Define API endpoints
const API_BASE_URL = 'http://127.0.0.1:5002';
const history_url='http://127.0.0.1:5000/save-history'
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

const UploadPage = ({ navigation }: UploadPageProps) => {
  const [audioFile, setAudioFile] = useState<DocumentFile | null>(null);
  const [imageFile, setImageFile] = useState<DocumentFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('transcript');

  // Pick Audio/Video Document
  const pickAudioDocument = async () => {
    try {
      const result = await pick({
        type: [types.audio, types.video],
        allowMultiSelection: false,
      });

      if (result.length > 0) {
        const selectedFile: DocumentFile = {
          uri: result[0].uri,
          type: result[0].type || 'application/octet-stream',
          name: result[0].name || 'unknown_file',
          size: result[0].size ?? 0,
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
        const selectedFile: DocumentFile = {
          uri: result[0].uri,
          type: result[0].type || 'application/octet-stream',
          name: result[0].name || 'unknown_file',
          size: result[0].size ?? 0,
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
    setActiveTab('transcript');
  };
  // const saveProcessingHistory = async (audioFile: File|null, imageFile: File | null) => {
  //   try {
  //     const historyData = {
  //       audioFile,
  //       imageFile,
  //       processedAt: new Date().toISOString()
  //     };
  
  //     const response = await axios.post(history_url, historyData, {
  //       headers: { 'Content-Type': 'application/json' }
  //     });
  
  //     if (response.data.success) {
  //       console.log('Processing history saved successfully');
  //     } else {
  //       console.error('Failed to save processing history');
  //     }
  //   } catch (error) {
  //     console.error('Error saving processing history:', error);
  //     Alert.alert('History Save Error', 'Failed to save processing history. Please try again.');
  //   }
  // };
  
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

      // await saveProcessingHistory(audioFile, imageFile);

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
   
    } catch (error) {
      console.error('Error processing files:', error);
      let errorMessage = 'Failed to process your files. Please try again.';
      
      // Get more specific error information
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
        errorMessage = error.response.data.error || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
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

// Add this function to your component

const saveReportToDownloads = async () => {
  // Create report content
  const reportContent = `MEDICAL REPORT\n\n` +
    `TRANSCRIPT:\n${transcript}\n\n` +
    `ANALYSIS:\n${analysis}\n\n` +
    (extractedText ? `EXTRACTED TEXT:\n${extractedText}\n\n` : '') +
    (summary ? `SUMMARY:\n${summary}` : '');
  
  try {
    // First save to app's document directory
    const fileName = `MedicalReport_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    const tempPath = `${Dirs.DocumentDir}/${fileName}`;
    
    // Write the file to document directory
    await FileSystem.writeFile(tempPath, reportContent, 'utf8');
    
    // Then copy to external downloads folder
    await FileSystem.cpExternal(tempPath, fileName, 'downloads');
    
    // Show success message
    Alert.alert(
      "Report Saved",
      `Your report has been saved to Downloads as "${fileName}"`,
      [{ text: "OK" }]
    );
    
    console.log('Report saved successfully');
  } catch (error) {
    console.error('Error saving report:', error);
    Alert.alert("Save Failed", "Could not save the report. Please try again.");
  }
};


 
const renderDashboard = () => {
  return (
    <View style={[styles.dashboardContainer, { backgroundColor: 'white' }]}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'transcript' && styles.activeTab]} 
          onPress={() => setActiveTab('transcript')}
        >
          {/* <MaterialIcons name="record-voice-over" size={20} color={activeTab === 'transcript' ? '#fff' : '#aaa'} /> */}
          <Text style={[styles.tabText, activeTab === 'transcript' && styles.activeTabText]}>Transcript</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'analysis' && styles.activeTab]} 
          onPress={() => setActiveTab('analysis')}
        >
          {/* <MaterialIcons name="analytics" size={20} color={activeTab === 'analysis' ? '#fff' : '#aaa'} /> */}
          <Text style={[styles.tabText, activeTab === 'analysis' && styles.activeTabText]}>Analysis</Text>
        </TouchableOpacity>
        
        {extractedText && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'ocr' && styles.activeTab]} 
            onPress={() => setActiveTab('ocr')}
          >
            {/* <MaterialIcons name="document-scanner" size={20} color={activeTab === 'ocr' ? '#fff' : '#aaa'} /> */}
            <Text style={[styles.tabText, activeTab === 'ocr' && styles.activeTabText]}>OCR</Text>
          </TouchableOpacity>
        )}
        
        {summary && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'summary' && styles.activeTab]} 
            onPress={() => setActiveTab('summary')}
          >
            {/* <MaterialIcons name="summarize" size={20} color={activeTab === 'summary' ? '#fff' : '#aaa'} /> */}
            <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>Summary</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        {activeTab === 'transcript' && (
          <View style={[styles.contentCard, { backgroundColor: 'white' }]}>
            <View style={styles.cardHeader}>
              <Image 
                source={require('../assets/arrow.svg')} 
                style={{ width: 24, height: 24 }} 
              />
              <Text style={[styles.cardTitle, { color: 'white' }]}>Medical Transcript</Text>
            </View>
            <Text style={[styles.contentText]}><Markdown>{transcript}</Markdown></Text>
          </View>
        )}
        
        {activeTab === 'analysis' && (
          <View style={[styles.contentCard, { backgroundColor: 'white' }]}>
            <View style={styles.cardHeader}>
              <Image 
                source={require('../assets/arrow.svg')} 
                style={{ width: 24, height: 24 }} 
              />
              <Text style={[styles.cardTitle, { color: 'white' }]}>AI Analysis</Text>
            </View>
            <Text style={[styles.contentText]}><Markdown>{analysis}</Markdown></Text>
          </View>
        )}
        
        {activeTab === 'ocr' && extractedText && (
          <View style={[styles.contentCard, { backgroundColor: 'white' }]}>
            <View style={styles.cardHeader}>
              <Image 
                source={require('../assets/arrow.svg')} 
                style={{ width: 24, height: 24 }} 
              />
              <Text style={[styles.cardTitle, { color: 'white' }]}>Extracted Text</Text>
            </View>
            <Text style={[styles.contentText]}><Markdown>{extractedText}</Markdown></Text>
          </View>
        )}
        
        {activeTab === 'summary' && summary && (
          <View style={[styles.contentCard, { backgroundColor: 'white' }]}>
            <View style={styles.cardHeader}>
              <Image 
                source={require('../assets/arrow.svg')} 
                style={{ width: 24, height: 24 }} 
              />
              <Text style={[styles.cardTitle, { color: 'white' }]}>Medical Summary</Text>
            </View>
            <Text style={[styles.contentText]}><Markdown>{summary}</Markdown></Text>
          </View>
        )}
      </View>
      
      {/* <TouchableOpacity style={styles.shareButton}>
        <MaterialIcons name="share" size={20} color="#fff" />
        <Text style={styles.shareButtonText}>Share Report</Text>
      </TouchableOpacity>
       */}
       <TouchableOpacity style={styles.shareButton} onPress={saveReportToDownloads}>
  {/* <MaterialIcons name="save" size={20} color="#fff" /> */}
  <Text style={styles.shareButtonText}>Save Report</Text>
</TouchableOpacity>
      <TouchableOpacity style={styles.newAnalysisButton} onPress={resetResults}>
        {/* <MaterialIcons name="add" size={20} color="#fff" /> */}
        <Text style={styles.newAnalysisText}>New Analysis</Text>
      </TouchableOpacity>
    </View>
  );
};

  return (
     <ImageBackground 
          source={require('../assets/bg_health.jpg')} 
          style={styles.backgroundImage}
        >
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Image 
                source={require('../assets/arrow.png')} 
                style={{ width: 24, height: 24 ,zIndex: 1 ,position: 'relative',}} 
              />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {transcript ? 'Medical Analysis' : 'Upload Media'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!transcript ? (
          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Medical AI Assistant</Text>
            <Text style={styles.sectionSubtitle}>Upload audio/video of doctor-patient conversation for AI analysis</Text>

            <View style={styles.uploadContainer}>
              <View style={styles.uploadColumn}>
                <Text style={styles.uploadLabel}>Audio/Video File (Required)</Text>
                <TouchableOpacity 
                  style={[styles.uploadBox, audioFile && styles.uploadBoxSelected]} 
                  onPress={pickAudioDocument} 
                  disabled={isProcessing}
                >
                  {/* <MaterialIcons 
                    name={audioFile ? (audioFile.type?.includes('video') ? "videocam" : "audiotrack") : "cloud-upload"} 
                    size={40} 
                    color={audioFile ? "#32CD32" : "#FF6347"} 
                  /> */}
                  <Image 
      source={require('../assets/video.jpg')} 
      style={{ width: 40, height: 40, zIndex: 1 }} 
    />
                  <Text style={[styles.uploadText, audioFile && styles.uploadTextSelected]}>
                    {audioFile ? 'Change file' : 'Select audio/video'}
                  </Text>
                </TouchableOpacity>
                {audioFile && (
                  <View style={styles.fileInfoCard}>
                    <Text style={styles.fileName} numberOfLines={1}>{audioFile.name}</Text>
                    <Text style={styles.fileInfo}>
                      {audioFile.size ? `${(audioFile.size / 1024 / 1024).toFixed(2)} MB` : ''} • {audioFile.type.split('/')[0]}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.uploadColumn}>
                <Text style={styles.uploadLabel}>Medical Report Image (Optional)</Text>
                <TouchableOpacity 
                  style={[styles.uploadBox, imageFile && styles.uploadBoxSelected]} 
                  onPress={pickImageDocument} 
                  disabled={isProcessing}
                >
                    <Image 
      source={require('../assets/upload.jpeg')} 
      style={{ width: 40, height: 40, zIndex: 1 }} 
    />
                  <Text style={[styles.uploadText, imageFile && styles.uploadTextSelected]}>
                    {imageFile ? 'Change image' : 'Add medical report'}
                  </Text>
                </TouchableOpacity>
                {imageFile && (
                  <View style={styles.fileInfoCard}>
                    <Text style={styles.fileName} numberOfLines={1}>{imageFile.name}</Text>
                    <Text style={styles.fileInfo}>
                      {imageFile.size ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : ''} • Image
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {audioFile && (
              <TouchableOpacity 
                style={styles.processButton} 
                onPress={processFiles} 
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <View style={styles.progressContainer}>
                    <ActivityIndicator color="#fff" size="small" style={styles.progressIndicator} />
                    <Text style={styles.buttonText}>Processing...</Text>
                  </View>
                ) : (
                  <>
                    {/* <MaterialIcons name="medical-services" size={20} color="#fff" /> */}
                    <Text style={styles.buttonText}>Analyze Medical Conversation</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          renderDashboard()
        )}
      </ScrollView>
    </View>
    </ImageBackground>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'rgba(71, 255, 197, 0.3)',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(28, 123, 192, 0.75)',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  uploadSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 25,
  },
  uploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  uploadColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  uploadLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '500',
  },
  uploadBox: {
    height: 120,
    // borderWidth: 2,
    // borderColor: 'rgba(14, 15, 15, 0.93)',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 7, 7, 0.59)',
    marginBottom: 10,
  },
  uploadBoxSelected: {
    borderColor: 'rgba(50, 205, 50, 0.3)',
    backgroundColor: 'rgba(50, 205, 50, 0.05)',
  },
  uploadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  uploadTextSelected: {
    color: '#32CD32',
  },
  fileInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  fileName: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  fileInfo: {
    color: '#aaa',
    fontSize: 12,
  },
  processButton: {
    backgroundColor: '#4a6da7',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIndicator: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Dashboard styles
  dashboardContainer: {
    flex: 1,
    paddingVertical: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 10,
    marginBottom: 20,
    padding: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4a6da7',
  },
  tabText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    marginBottom: 20,
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  contentText: {
    color: '#000',
    fontSize: 15,
    lineHeight: 22,
  },
  shareButton: {
    backgroundColor: '#4a6da7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  newAnalysisButton: {
    backgroundColor: '#32CD32',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  newAnalysisText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  }
})

export default UploadPage;
