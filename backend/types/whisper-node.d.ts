declare module 'whisper-node' {
    export interface WhisperOptions {
      modelName: string;
      modelPath?: string;
      whisperOptions?: {
        language?: string;
        word_timestamps?: boolean;
      };
    }
  
    function whisper(audioPath: string, options: WhisperOptions): Promise<{ text: string } | string | { speech: string }[]>;
  
    export default whisper;
  }
  