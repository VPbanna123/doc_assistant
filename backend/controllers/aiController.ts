import { Request, Response } from 'express';
import { transcribeAudio as whisperTranscribe } from '../services/whisperService';
import { getChatbotResponse as chatbotService } from '../services/chatbotService';
import { extractText as ocrService } from '../services/ocrService';
import { summarizeText as summarizerService } from '../services/summarizerService';

// 1️⃣ Speech-to-text (Whisper)
export const transcribeAudio = async (filePath: string): Promise<string> => {
  try {
    return await whisperTranscribe(filePath);
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
};

// 2️⃣ Chatbot for Symptoms, Disease Prediction, and Test Suggestions
export const getChatbotResponse = async (data: any): Promise<string> => {
  try {
    const userMessage = data.message|| data.reply;
    
    if (!userMessage) {
      throw new Error('No message provided');
    }
    
    return await chatbotService(userMessage);
  } catch (error) {
    console.error('Chatbot error:', error);
    throw new Error('Failed to process message');
  }
};

// 3️⃣ OCR for Medical Report
export const extractText = async (imagePath: string): Promise<string> => {
  try {
    return await ocrService(imagePath);
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to extract text from image');
  }
};

// 4️⃣ Summarizer for Medical Report
export const summarizeText = async (text: string): Promise<string> => {
  try {
    if (!text) {
      throw new Error('No text provided');
    }
    
    return await summarizerService(text);
  } catch (error) {
    console.error('Summarization error:', error);
    throw new Error('Failed to summarize text');
  }
};

// 5️⃣ Full Workflow (Test End-to-End)
export const fullWorkflow = async (files: any): Promise<any> => {
  try {
    if (!files.file || files.file.length === 0) {
      throw new Error('No audio file provided');
    }
    
    // Step 1: Transcribe audio
    const audioFilePath = files.file[0].path;
    const transcript = await whisperTranscribe(audioFilePath);
    
    // Step 2: Get chatbot response
    const chatbotResult = await chatbotService(transcript);
    
    // Step 3 (Optional): Extract text from report
    if (files.image && files.image.length > 0) {
      const imageFilePath = files.image[0].path;
      const extractedText = await ocrService(imageFilePath);
      
      // Step 4: Summarize extracted text
      const summary = await summarizerService(extractedText);
      
      return {
        transcription: transcript,
        chatbot_reply: chatbotResult,
        extracted_text: extractedText,
        summary
      };
    }
    
    return {
      transcription: transcript,
      chatbot_reply: chatbotResult
    };
  } catch (error) {
    console.error('Full workflow error:', error);
    throw new Error(String(error));
  }
};
