
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
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup error:", err);

    process.exit(1);
  }
};

export default startApp();


