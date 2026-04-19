import jwt from "jsonwebtoken";

export default function verifyToken(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ data: null, error: "Unauthorized", message: "Missing token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ data: null, error: "Unauthorized", message: "Invalid token" });
  }
}
