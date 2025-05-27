import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutses from './routes/auth';
import songRoutes from './routes/song';
import lyricsRoutes from './routes/lyrics';
import chordsRoutes from './routes/chords';
import groupRoutes from './routes/group';
import showRoutes from './routes/show';

const app = express();

// Security headers
app.use(helmet());
// Enable CORS
app.use(cors());
// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// HTTP request logger
app.use(morgan('dev'));
// Cookie parser for handling cookies
app.use(cookieParser());
// API endpoints
app.use('/api/auth', authRoutses);
app.use('/api/songs', songRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/chords', chordsRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/shows', showRoutes);  

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Server error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

export default app;
