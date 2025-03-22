// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';

// export interface AuthRequest extends Request {
//   user?: any;
// }

// export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
//   const token = req.header('Authorization');
//   if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface AuthRequest extends Request {
  user?: any;
}

// ✅ Ensure middleware always returns void or calls next()
export const authMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    res.status(401).json({ success: false, message: 'No token, authorization denied' });
    return; // ✅ Ensure function exits
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as AuthRequest).user = decoded;
    next(); // ✅ Calls next() without returning Response
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return; // ✅ Ensure function exits
  }
};
