const jwt = require("jsonwebtoken");
const { JWT_EXPIRES_IN, JWT_SECRET } = require("../config/authConfig");
const {
  findDoctorByCredentials,
  sanitizeDoctor,
} = require("../data/doctorsStore");

const loginDoctor = async (req, res) => {
  const email = String(req.body.email || "").trim();
  const password = String(req.body.password || "").trim();

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  const doctor = await findDoctorByCredentials(email, password);

  if (!doctor) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = jwt.sign(
    {
      doctorId: doctor.id,
      email: doctor.email,
      role: doctor.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  return res.status(200).json({
    token,
    doctor: sanitizeDoctor(doctor),
  });
};

module.exports = {
  loginDoctor,
};
