import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI('GEMINI_API_KEY');


export async function getChatbotResponse(message: string): Promise<string> {
  try {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in chatbot service:', error);
    throw new Error('Failed to get chatbot response');
  }
}
