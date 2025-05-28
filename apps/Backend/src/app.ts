import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
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
import GeminiRoutes from './routes/gemini'; 

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
app.use('/api/gemini', GeminiRoutes);


// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

// Global error handler - use ErrorRequestHandler type
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('🔥 Server error:', err);
  
  // Return more detailed error information in development
  if (process.env.NODE_ENV !== 'production') {
    res.status(500).json({
      message: err.message || 'Internal Server Error',
      stack: err.stack,
      error: err
    });
    return;
  }
  
  // Send limited info in production
  res.status(500).json({ 
    message: err.message || 'Internal Server Error'
  });
});

export default app;
