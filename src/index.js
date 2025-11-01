import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
  .then(() => {
    console.log("✅ MongoDB connected successfully!");
    console.log("🟢 Starting Express server...");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server is running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.error("❌ Mongodb connection failed.", error);
  });