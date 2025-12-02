import express from "express";
import Alert from "../models/Alert.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Get alerts for logged-in user
router.get("/", requireAuth, async (req, res) => {
  const alerts = await Alert.find({ userId: req.userId }).sort({ time: -1 });
  res.json(alerts);
});

// Save new alert
router.post("/", requireAuth, async (req, res) => {
  const { title, body, image } = req.body;
  const alert = await Alert.create({
    userId: req.userId,
    title,
    body,
    image,
  });
  res.json(alert);
});

// Mark one alert read
router.patch("/:id/read", requireAuth, async (req, res) => {
  const updated = await Alert.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { read: true },
    { new: true }
  );
  res.json(updated);
});

// Mark all read
router.patch("/read/all", requireAuth, async (req, res) => {
  await Alert.updateMany({ userId: req.userId }, { read: true });
  res.json({ message: "All alerts marked read" });
});

export default router;
