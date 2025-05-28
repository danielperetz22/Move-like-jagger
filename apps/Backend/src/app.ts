import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth";
import songRoutes from "./routes/song";
import lyricsRoutes from "./routes/lyrics";
import chordsRoutes from "./routes/chords";
import showRoutes from "./routes/show";
import geminiRoutes from "./routes/gemini";

const app = express();

// Security middleware
app.use(helmet());
const allowedOrigin = 'https://ja-moveo-enon.vercel.app';

const corsOptions = {
  origin: allowedOrigin,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));     // handles simple requests
app.options('*', cors(corsOptions)); // handles preflight OPTIONS



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

// Route setup
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/lyrics", lyricsRoutes);
app.use("/api/chords", chordsRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/gemini", geminiRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Not Found" });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error("🔥 Server error:", err);

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

export default app;
