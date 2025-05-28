import dotenv from 'dotenv';
dotenv.config();
import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';
import { BaseController } from './base';
import userModel, { IUser } from '../models/auth';
import cookieParser from 'cookie-parser';

declare global {
    namespace Express {
      interface Request {
        user?: IUser;
      }
    }
  }
  
const ACCESS_TOKEN_SECRET: Secret = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET: Secret = process.env.REFRESH_TOKEN_SECRET!;

type Tokens = { accessToken: string; refreshToken: string };

function generateTokens(userId: string): Tokens {
    const accessExpiration  = process.env.ACCESS_TOKEN_EXPIRY  ;
    const refreshExpiration = process.env.REFRESH_TOKEN_EXPIRY;
  
    const accessOpts: SignOptions  = { expiresIn: accessExpiration  as SignOptions['expiresIn'] };
    const refreshOpts: SignOptions = { expiresIn: refreshExpiration as SignOptions['expiresIn'] };
  
    const accessToken  = jwt.sign({ _id: userId }, ACCESS_TOKEN_SECRET,  accessOpts);
    const refreshToken = jwt.sign({ _id: userId }, REFRESH_TOKEN_SECRET, refreshOpts);
  
    return { accessToken, refreshToken };
  }
  function extractRefreshToken(req: Request): string | undefined {
      if (req.cookies?.refreshToken)   return req.cookies.refreshToken;
      if (req.header('x-refresh-token')) return req.header('x-refresh-token')!;
      return req.body?.refreshToken;
    }
async function validateRefreshToken(token?: string): Promise<IUser> {
    if (!token) throw new Error('No refresh token provided');
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
    if (!payload._id) throw new Error('Invalid token payload');
  
    const user = await userModel.findById(payload._id);
    if (!user) throw new Error('User not found');
  
    if (!user.refreshTokens.includes(token)) throw new Error('Refresh token not recognized');
  
    return user;
  }

export class UserController extends BaseController<IUser> {
  constructor() {
    super(userModel);
  }
async create(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username, instrument, admin } = req.body;
  
      if (!email || !password || !username || !instrument) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }
  
      const isAdmin =
        req.user?.admin === true && admin === true
          ? true
          : false;
  
      const salt   = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
  
      const newUser = new this.model({
        admin:        isAdmin,                       
        _id:          new this.model()._id.toString(),
        email,
        password:     hashed,
        username,
        instrument,
      });
      const saved   = await newUser.save();
  
      const tokens = generateTokens(saved._id.toString());
      saved.refreshTokens.push(tokens.refreshToken);
      await saved.save();
  
      res.status(201).json({
        user: {
          admin:         saved.admin,                 
          _id:           saved._id,
          email:         saved.email,
          username:      saved.username,
          instrument:    saved.instrument,
        },
        tokens,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error registering user' });
    }
  }
  

  // login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: 'Email and password required' });
        return;
      }

      const user = await this.model.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
      }

      const tokens = generateTokens(user._id.toString());
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      res.status(200).json({
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          instrument: user.instrument,
        },
        tokens,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error during login' });
    }
  }

  // refresh
  async refresh(req: Request, res: Response): Promise<void> {
    try {
        const token = extractRefreshToken(req)!;
        const user  = await validateRefreshToken(token);

      const tokens = generateTokens(user._id.toString());
      user.refreshTokens = user.refreshTokens.filter(t => t !== token);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      res.status(200).json({ tokens, _id: user._id });
    } catch (err: any) {
      console.error(err);
      res.status(401).json({ message: err.message });
    }
  }

  // logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
        const token = extractRefreshToken(req)!;
        const user  = await validateRefreshToken(token);

        user.refreshTokens = user.refreshTokens.filter(t => t !== token);
        await user.save();

        res.status(200).json({ message: 'Logged out successfully' });
    }   catch (err: any) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
  }

  // Get current user details
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.model.findById(req.user?._id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json({
        _id: user._id,
        email: user.email,
        username: user.username,
        instrument: user.instrument,
        admin: user.admin
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ message: 'Error fetching user details' });
    }
  }

}
  
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) {
       res.status(401).json({ message: 'Access denied: Missing token' });
         return;
    }
    if (!process.env.ACCESS_TOKEN_SECRET) {
       res.status(500).json({ message: 'Server error: Missing token secret' });
         return;
    }
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
         res.status(401).json({ message: 'Access denied: Invalid token' });
        return;
      }
      if (typeof decoded === 'object' && decoded !== null && '_id' in decoded) {
        req.user = { _id: decoded._id } as IUser; 
      } else {
        res.status(401).json({ message: 'Access denied: Invalid token payload' });
        return;
      }
      next();
    });
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query as { query: string };
  if (!query) {
    res.status(400).json({ message: 'Query is required' });
    return;
  }

  try {
    const users = await userModel.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
      admin: false, 
    });

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
};