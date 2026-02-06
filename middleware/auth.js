import jwt from "jsonwebtoken";

// =========================
// Default Auth Middleware
// =========================
const auth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// =========================
// verifyToken Middleware
// =========================
export const verifyToken = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Access Denied. No token." });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;

    next();
  } catch (error) {
    console.log("VerifyToken Error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// =========================
// requireAdmin Middleware
// =========================
export const requireAdmin = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Access Denied. No token." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access Denied. Admins only." });
    }

    req.user = decoded;
    next();

  } catch (error) {
    console.log("requireAdmin Error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default auth;