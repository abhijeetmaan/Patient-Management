const { randomUUID } = require("crypto");
const {
  addAppointment,
  getAppointments,
  getAppointmentsByDoctorId,
  updateAppointmentById,
  updateAppointmentByIdAndDoctorId,
} = require("../data/appointmentsStore");
const { getDoctorById } = require("../data/doctorsStore");
const { getPatientByIdAndDoctorId } = require("../data/patientsStore");
const {
  validateCreateAppointmentPayload,
  validateUpdateAppointmentStatusPayload,
} = require("../utils/validateAppointment");

const createAppointment = (req, res) => {
  const validationError = validateCreateAppointmentPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const patientName = String(req.body.patientName).trim();
  const patientId = String(req.body.patientId).trim();
  const date = String(req.body.date).trim();
  const time = String(req.body.time).trim();

  const patient = getPatientByIdAndDoctorId(patientId, req.doctorId);

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  const appointment = {
    id: randomUUID(),
    doctorId: req.doctorId,
    patientId,
    patientName: patient.name || patientName,
    date,
    time,
    status: "pending",
    createdAt: new Date(),
  };

  return res.status(201).json(addAppointment(appointment));
};

const listAppointments = (req, res) => {
  const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";

  const sourceAppointments = isAdmin
    ? getAppointments()
    : getAppointmentsByDoctorId(req.doctorId);

  const sortedAppointments = [...sourceAppointments]
    .map((appointment) => {
      const assignedDoctor = getDoctorById(appointment.doctorId);
      return {
        ...appointment,
        doctorName: assignedDoctor?.name || "Unknown Doctor",
      };
    })
    .sort((a, b) => {
      const aDate = new Date(`${a.date}T${a.time}`).getTime();
      const bDate = new Date(`${b.date}T${b.time}`).getTime();
      return aDate - bDate;
    });

  return res.status(200).json(sortedAppointments);
};

const updateAppointmentStatus = (req, res) => {
  const validationError = validateUpdateAppointmentStatusPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const status = String(req.body.status).trim();
  const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";

  const updatedAppointment = isAdmin
    ? updateAppointmentById(req.params.id, (current) => ({
        ...current,
        status,
      }))
    : updateAppointmentByIdAndDoctorId(
        req.params.id,
        req.doctorId,
        (current) => ({
          ...current,
          status,
        }),
      );

  if (!updatedAppointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  return res.status(200).json(updatedAppointment);
};

module.exports = {
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
};
