import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

import authRoutes from './routes/auth';
import userRoutes from './routes/auth';

dotenv.config();

const app = express();

app.use(helmet());                          
app.use(cors());                             
app.use(express.json());                     
app.use(express.urlencoded({ extended: true })); 
app.use(morgan('dev'));                      

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/JaMoveo';
mongoose
  .connect(mongoUri, {
    // @ts-ignore: useNewUrlParser & useUnifiedTopology are legacy flags; TS definitions may warn
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Server error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT ;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
