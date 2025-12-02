import express from "express";
import axios from "axios";

const router = express.Router();
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8001/predict";

router.post("/predict", async (req, res) => {
  try {
    const features = req.body;
    if (!features || typeof features !== "object") {
      return res.status(400).json({ error: "Invalid feature payload" });
    }

    // Forward to Python (bigger timeout in case inference takes longer)
    const response = await axios.post(PYTHON_API_URL, features, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000, // 10s
    });

    return res.json(response.data);
  } catch (err) {
    console.error("ML API error:", err.message || err);
    if (err.response) {
      console.error("Python status:", err.response.status, "body:", err.response.data);
      return res.status(502).json({ error: "Python API error", detail: err.response.data });
    }
    return res.status(500).json({ error: "Server error", detail: err.message || String(err) });
  }
});

export default router;
