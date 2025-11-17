import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'auth_token';
const JWT_EXPIRES_IN = '1d';

export interface JwtPayload {
    userId : string;
    email : string;
    role : string;
}

export const generateToken = (payload : JwtPayload) : string => {
    try{
        const token = jwt.sign(payload,JWT_SECRET,{expiresIn : JWT_EXPIRES_IN});
        
        return token;

    }catch(error){
        throw new Error('Failed to generate token');
    }
}

export const verifyToken = (token : string): JwtPayload => {
    try{
        const decoded = jwt.verify(token,JWT_SECRET) as JwtPayload;
        return decoded;

    }catch(error){
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
         
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
      throw new Error('Token verification failed');
    }
}

export const decodeToken = (token : string): JwtPayload =>{
    try{
        const decode = jwt.decode(token) as JwtPayload;
        return decode;
        
    }catch(error){
        throw null
    }
}