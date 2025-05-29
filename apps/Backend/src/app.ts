import dotenv from "dotenv";
import initApp from "./server";


dotenv.config();

const PORT = process.env.PORT || 4000;

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const startApp = async (): Promise<void> => {
  try {
    const app = await initApp();
      
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

export default startApp();
