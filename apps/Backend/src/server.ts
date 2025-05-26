import mongoose from 'mongoose';
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/JaMoveo';

const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on PORT ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
};

startServer();
