const {
  getDoctors,
  sanitizeDoctor,
  updateDoctorPermissions,
} = require("../data/doctorsStore");
const { getPatients } = require("../data/patientsStore");
const { getAppointments } = require("../data/appointmentsStore");

const listAllDoctors = (_req, res) => {
  const doctors = getDoctors().map((doctor) => sanitizeDoctor(doctor));
  return res.status(200).json(doctors);
};

const listAllPatients = (_req, res) => {
  return res.status(200).json(getPatients());
};

const getAdminStats = (_req, res) => {
  return res.status(200).json({
    totalDoctors: getDoctors().length,
    totalPatients: getPatients().length,
    totalAppointments: getAppointments().length,
  });
};

const updateDoctorPermissionsById = (req, res) => {
  const updatedDoctor = updateDoctorPermissions(
    req.params.id,
    req.body.permissions,
  );

  if (!updatedDoctor) {
    return res.status(404).json({ message: "Doctor not found." });
  }

  return res.status(200).json(sanitizeDoctor(updatedDoctor));
};

module.exports = {
  listAllDoctors,
  listAllPatients,
  getAdminStats,
  updateDoctorPermissionsById,
};
