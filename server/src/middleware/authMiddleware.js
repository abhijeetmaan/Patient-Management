const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/authConfig");
const { getDoctorById, sanitizeDoctor } = require("../data/doctorsStore");
const { normalizePermissions } = require("../utils/permissions");

const authMiddleware = (req, res, next) => {
  const authorizationHeader = String(req.header("authorization") || "");

  if (!authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required." });
  }

  const token = authorizationHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ message: "Authorization token required." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const doctor = getDoctorById(decoded.doctorId);

    if (!doctor) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    req.doctorId = doctor.id;
    req.doctor = sanitizeDoctor(doctor);
    req.user = {
      doctorId: doctor.id,
      email: doctor.email,
      role: doctor.role,
      name: doctor.name,
      permissions: normalizePermissions(doctor.permissions, doctor.role),
    };
    return next();
  } catch (error) {
    if (error && error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired." });
    }

    return res.status(401).json({ message: "Invalid authentication token." });
  }
};

module.exports = authMiddleware;
