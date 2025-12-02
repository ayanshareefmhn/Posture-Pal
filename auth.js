import { verifyToken } from "@clerk/clerk-sdk-node";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Missing token" });

    const token = header.replace("Bearer ", "").trim();
    const payload = await verifyToken(token);

    req.userId = payload.sub; // Clerk’s user ID
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token", detail: err.message });
  }
}
