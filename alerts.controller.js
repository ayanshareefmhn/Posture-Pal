import Alert from "../models/Alert.js";

export const createAlert = async (req, res) => {
  try {
    const { userId, title, body, time, image } = req.body;

    const alert = await Alert.create({
      userId,
      title,
      body,
      time,
      image,
      read: false
    });

    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markRead = async (req, res) => {
  try {
    await Alert.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Alert.updateMany({ userId: req.params.userId }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
