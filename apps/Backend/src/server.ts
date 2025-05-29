import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI environment variable");
  process.exit(1);
}

const startServer = async (): Promise<void> => {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log("MongoDB connected successfully");
    console.log(`Connected to database: ${mongoose.connection.name}`);

    app.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup error:", err);
    if (err instanceof Error) {
      if (err.message.includes("ECONNREFUSED")) {
        console.error("\nConnection refused. Please check if:");
        console.error("1. Your MongoDB URI is correct");
        console.error("2. Your IP address is whitelisted in MongoDB Atlas");
        console.error("3. Your MongoDB Atlas cluster is running");
      } else if (err.message.includes("Invalid scheme")) {
        console.error(
          "\nInvalid MongoDB URI format. The URI should start with 'mongodb://' or 'mongodb+srv://'"
        );
      } else if (err.message.includes("Authentication failed")) {
        console.error(
          "\nAuthentication failed. Please check your username and password in the connection string"
        );
      } else if (err.message.includes("getaddrinfo ENOTFOUND")) {
        console.error("\nCould not resolve the MongoDB host. Please check:");
        console.error("1. Your internet connection");
        console.error("2. The hostname in your MongoDB URI is correct");
      }
    }
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle MongoDB connection errors
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

startServer();


