const bcrypt = require("bcryptjs");

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("123456", 10);

const doctors = [
  {
    id: 1,
    email: "doctor1@test.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    name: "Dr. John",
    role: "admin",
  },
  {
    id: 2,
    email: "doctor2@test.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    name: "Dr. Emily",
    role: "doctor",
  },
];

const getDoctors = () => doctors;

const getDoctorById = (doctorId) =>
  doctors.find((doctor) => String(doctor.id) === String(doctorId)) || null;

const getDoctorByEmail = (email) =>
  doctors.find(
    (doctor) =>
      doctor.email.toLowerCase() === String(email || "").toLowerCase(),
  ) || null;

const findDoctorByCredentials = async (email, password) => {
  const doctor = getDoctorByEmail(email);

  if (!doctor) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(
    String(password || ""),
    doctor.passwordHash,
  );

  return isValidPassword ? doctor : null;
};

const sanitizeDoctor = (doctor) => {
  if (!doctor) {
    return null;
  }

  const { passwordHash, ...safeDoctor } = doctor;
  return safeDoctor;
};

module.exports = {
  getDoctors,
  getDoctorById,
  getDoctorByEmail,
  findDoctorByCredentials,
  sanitizeDoctor,
};
