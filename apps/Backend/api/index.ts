import { Request, Response } from "express";
import initApp from "../src/server";

export default async function handler(req: Request, res: Response) {
  try {
    const app = await initApp();
    // Forward the request to the Express app
    return app(req, res);
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

