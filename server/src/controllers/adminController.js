const { getDoctors, sanitizeDoctor } = require("../data/doctorsStore");
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

module.exports = {
  listAllDoctors,
  listAllPatients,
  getAdminStats,
};
