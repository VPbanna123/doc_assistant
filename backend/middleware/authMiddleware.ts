
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface AuthRequest extends Request {
  user?: any;
}


export const authMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    res.status(401).json({ success: false, message: 'No token, authorization denied' });
    return; 
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as AuthRequest).user = decoded;
    next(); 
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return; 
  }
};
