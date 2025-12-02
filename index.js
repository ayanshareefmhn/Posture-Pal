import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import postureRoutes from "./routes/posture.routes.js";
import alertRoutes from "./routes/alerts.routes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" })); // allow screenshots

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err));

app.use("/api/posture", postureRoutes);
app.use("/api/alerts", alertRoutes);

app.listen(5000, () => console.log("Backend running on 5000"));
