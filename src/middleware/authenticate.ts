import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../helpers/jwt';
import { getUserById } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
      currentUser?: any;
    }
  }
}

// Middleware: Authenticate dengan JWT
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'UnAuthenticated' 
      });
    }
    
    const token = authHeader.substring(7); 
    
    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token);
    } catch (error: any) {
      return res.status(401).json({ 
        error: error.message || 'Invalid or expired token' 
      });
    }
    
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found. Token may be invalid.' 
      });
    }
    
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    req.currentUser = user; 
    
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware: Optional authentication (boleh login/tidak)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Kalau tidak ada token, lanjut aja (tidak error)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyToken(token);
      const user = await getUserById(decoded.userId);
      
      if (user) {
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userRole = decoded.role;
        req.currentUser = user;
      }
    } catch (error) {
      // Token invalid, tapi tidak error - lanjut tanpa auth
    }
    
    next();
    
  } catch (error) {
    next();
  }
};