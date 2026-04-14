const bcrypt = require("bcryptjs");
const {
  getPermissionsForRole,
  normalizePermissions,
} = require("../utils/permissions");

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("123456", 10);

const doctors = [
  {
    id: 1,
    email: "doctor1@test.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    name: "Dr. John",
    role: "admin",
    permissions: getPermissionsForRole("admin"),
  },
  {
    id: 2,
    email: "doctor2@test.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    name: "Dr. Emily",
    role: "doctor",
    permissions: getPermissionsForRole("doctor"),
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

const updateDoctorPermissions = (doctorId, nextPermissions) => {
  const doctorIndex = doctors.findIndex(
    (doctor) => String(doctor.id) === String(doctorId),
  );

  if (doctorIndex === -1) {
    return null;
  }

  const doctor = doctors[doctorIndex];
  const updatedDoctor = {
    ...doctor,
    permissions: normalizePermissions(nextPermissions, doctor.role),
  };

  doctors[doctorIndex] = updatedDoctor;
  return updatedDoctor;
};

const sanitizeDoctor = (doctor) => {
  if (!doctor) {
    return null;
  }

  const { passwordHash, ...safeDoctor } = doctor;
  safeDoctor.permissions = normalizePermissions(
    safeDoctor.permissions,
    safeDoctor.role,
  );
  return safeDoctor;
};

module.exports = {
  getDoctors,
  getDoctorById,
  getDoctorByEmail,
  findDoctorByCredentials,
  updateDoctorPermissions,
  sanitizeDoctor,
};
