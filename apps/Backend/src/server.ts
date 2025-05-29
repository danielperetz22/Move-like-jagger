import dotenv from 'dotenv';
dotenv.config({
  path: process.env.NODE_ENV ? `./.env_${process.env.NODE_ENV}` : './.env',
});

import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Import your routes
import authRoutes from './routes/auth';
import songRoutes from './routes/song';
import lyricsRoutes from './routes/lyrics';
import chordsRoutes from './routes/chords';
import showRoutes from './routes/show';
import geminiRoutes from './routes/gemini';

const app = express();

// Security middleware
app.use(helmet());

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

// Apply CORS middleware
app.use(cors(corsOptions));


// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

app.use('/public', express.static('public'));

// Route setup
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/chords', chordsRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/gemini', geminiRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Not Found" });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error("Server error:", err);

  if (process.env.NODE_ENV !== "production") {
    res.status(500).json({
      error: err,
    });
  } else {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

const db = mongoose.connection;
db.on('error', (error) => console.error('MongoDB connection error:', error));
db.once('open', () => console.log('Connected to database'));
db.on('disconnected', () => console.log('MongoDB disconnected'));
db.on('reconnected', () => console.log('MongoDB reconnected'));

const initApp = (): Promise<Express> => {
  return new Promise<Express>((resolve, reject) => {
    const MONGO_URI = process.env.MONGO_URI || process.env.DB_CONNECT;
    
    if (!MONGO_URI) {
      reject('MONGO_URI/DB_CONNECT is not defined in environment variables');
    } else {
      console.log("Attempting to connect to MongoDB...");
      mongoose
        .connect(MONGO_URI, {
          serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
          socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        })
        .then(() => {
          console.log("MongoDB connected successfully");
          console.log(`Connected to database: ${mongoose.connection.name}`);
          resolve(app);
        })
        .catch((error) => {
          console.error("MongoDB connection error:", error);
          reject(error);
        });
    }
  });
};

export default initApp;


