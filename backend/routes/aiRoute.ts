import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  transcribeAudio,
  getChatbotResponse,
  extractText,
  summarizeText,
  fullWorkflow,
} from '../controllers/aiController';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const router = express.Router();

router.post('/transcribe', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const transcript = await transcribeAudio(req.file.path);
    res.json({ transcript });
  } catch (error) {
    next(error);
  }
});

router.post('/chatbot', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const response = await getChatbotResponse(req.body);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/extract-text', upload.single('image'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image uploaded' });
      return;
    }
    const extractedText = await extractText(req.file.path);
    res.json({ text: extractedText });
  } catch (error) {
    next(error);
  }
});

router.post('/summarize', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.body.text) {
      res.status(400).json({ error: 'No text provided' });
      return;
    }
    const summary = await summarizeText(req.body.text);
    res.json({ summary });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/full-workflow',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await fullWorkflow(req.files);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
