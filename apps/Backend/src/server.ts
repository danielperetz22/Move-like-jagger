import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Missing MONGO_URI environment variable');
  process.exit(1);
}

const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('MongoDB connected');

    if (process.env.NODE_ENV !== 'production') {
      mongoose.set('debug', true);
    }

    app.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}`);
    });
  } catch (err) {
    console.error(' Server startup error:', err);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();