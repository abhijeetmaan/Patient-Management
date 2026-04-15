const { randomUUID } = require("crypto");
const {
  addPatient,
  deletePatient,
  deletePatientByIdAndDoctorId,
  getPatients,
  getPatientsByDoctorId,
  updatePatientById,
  updatePatientByIdAndDoctorId,
} = require("../data/patientsStore");
const {
  deleteAppointmentsByPatientId,
  deleteAppointmentsByPatientIdAndDoctorId,
} = require("../data/appointmentsStore");
const { getDoctorById } = require("../data/doctorsStore");
const { hasPermission } = require("../utils/permissions");
const {
  validateCreatePatientPayload,
  validatePrescriptionPayload,
  validateVisitPayload,
  validateUpdatePatientPayload,
} = require("../utils/validatePatient");

const getDoctorRoom = (doctorId) => `doctor:${String(doctorId || "")}`;

const emitToRoomExcludingDoctor = (
  io,
  room,
  eventName,
  payload,
  doctorSocketIds,
  doctorId,
) => {
  if (!room) {
    return;
  }

  const socketIds = doctorSocketIds?.get(String(doctorId || "").trim());
  const exclusionList = socketIds ? Array.from(socketIds) : [];

  if (exclusionList.length > 0) {
    io.to(room).except(exclusionList).emit(eventName, payload);
    return;
  }

  io.to(room).emit(eventName, payload);
};

const getPatientSnapshot = (patient) => {
  if (!patient) {
    return null;
  }

  const assignedDoctor = getDoctorById(patient.doctorId);

  return {
    ...patient,
    assignedDoctorName: assignedDoctor?.name || "Unknown Doctor",
  };
};

const emitPatientEvent = (req, patient, eventName) => {
  const io = req.app.get("io");
  const doctorSocketIds = req.app.get("doctorSocketIds");
  if (!io || !patient) {
    return;
  }

  const snapshot = getPatientSnapshot(patient);
  const payload = {
    ...snapshot,
    actorDoctorId: String(req.doctorId),
    actorDoctorName: req.user?.name || "Doctor",
  };

  emitToRoomExcludingDoctor(
    io,
    getDoctorRoom(patient.doctorId),
    eventName,
    payload,
    doctorSocketIds,
    req.doctorId,
  );
  io.to("admins").emit(eventName, payload);
};

const toMedicinesArray = (medicines) => {
  if (Array.isArray(medicines)) {
    return medicines;
  }

  return String(medicines || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const createVisitObject = ({
  symptoms,
  diagnosis,
  medicines,
  notes,
  date,
}) => ({
  date: date || new Date(),
  symptoms: String(symptoms).trim(),
  diagnosis: String(diagnosis).trim(),
  medicines: toMedicinesArray(medicines),
  notes: String(notes || "").trim(),
});

const createPrescriptionObject = ({
  diagnosis,
  medicines,
  notes,
  doctorName,
  generatedAt,
  prescriptionDate,
}) => ({
  id: randomUUID(),
  diagnosis: String(diagnosis || "").trim(),
  medicines: toMedicinesArray(medicines),
  notes: String(notes || "").trim(),
  doctorName: String(doctorName || "").trim(),
  prescriptionDate: String(prescriptionDate || "").trim(),
  generatedAt: generatedAt || new Date().toISOString(),
  savedAt: new Date().toISOString(),
});

const createPatient = (req, res) => {
  const validationError = validateCreatePatientPayload(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const admissionDate = String(req.body.admissionDate).trim();

  const firstVisit = createVisitObject({
    ...req.body,
    date: admissionDate,
  });

  const patient = {
    id: randomUUID(),
    doctorId: req.doctorId,
    name: String(req.body.name).trim(),
    age: Number(req.body.age),
    gender: String(req.body.gender).trim(),
    visits: [firstVisit],
    prescriptions: [],
    createdAt: admissionDate,
  };

  const createdPatient = addPatient(patient);
  const createdSnapshot = getPatientSnapshot(createdPatient);
  emitPatientEvent(req, createdPatient, "patient_added");
  return res.status(201).json(createdSnapshot);
};

const listPatients = (_req, res) => {
  const canViewAllPatients =
    _req.user?.role === "admin" ||
    hasPermission(_req.user, "view_all_patients");

  const patients = canViewAllPatients
    ? getPatients()
    : getPatientsByDoctorId(_req.doctorId);

  const enrichedPatients = patients.map((patient) => {
    const assignedDoctor = getDoctorById(patient.doctorId);
    return {
      ...patient,
      assignedDoctorName: assignedDoctor?.name || "Unknown Doctor",
    };
  });

  return res.status(200).json(enrichedPatients);
};

const addPatientVisit = (req, res) => {
  const validationError = validateVisitPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const newVisit = createVisitObject(req.body);
  const updater = (currentPatient) => ({
    ...currentPatient,
    visits: [
      newVisit,
      ...(Array.isArray(currentPatient.visits) ? currentPatient.visits : []),
    ],
  });

  const updatedPatient =
    req.user?.role === "admin"
      ? updatePatientById(req.params.id, updater)
      : updatePatientByIdAndDoctorId(req.params.id, req.doctorId, updater);

  if (!updatedPatient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  return res.status(201).json(updatedPatient);
};

const updatePatientProfile = (req, res) => {
  const validationError = validateUpdatePatientPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const updater = (currentPatient) => ({
    ...currentPatient,
    name: String(req.body.name).trim(),
    age: Number(req.body.age),
    gender: String(req.body.gender).trim(),
  });

  const updatedPatient =
    req.user?.role === "admin"
      ? updatePatientById(req.params.id, updater)
      : updatePatientByIdAndDoctorId(req.params.id, req.doctorId, updater);

  if (!updatedPatient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  emitPatientEvent(req, updatedPatient, "patient_updated");
  return res.status(200).json(getPatientSnapshot(updatedPatient));
};

const removePatient = (req, res) => {
  const wasDeleted =
    req.user?.role === "admin"
      ? deletePatient(req.params.id)
      : deletePatientByIdAndDoctorId(req.params.id, req.doctorId);

  if (!wasDeleted) {
    return res.status(404).json({ message: "Patient not found" });
  }

  if (req.user?.role === "admin") {
    deleteAppointmentsByPatientId(req.params.id);
  } else {
    deleteAppointmentsByPatientIdAndDoctorId(req.params.id, req.doctorId);
  }

  return res.status(200).json({ message: "Patient deleted successfully" });
};

const savePrescription = (req, res) => {
  const validationError = validatePrescriptionPayload(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const prescription = createPrescriptionObject(req.body);

  const updater = (currentPatient) => {
    const existingPrescriptions = Array.isArray(currentPatient.prescriptions)
      ? currentPatient.prescriptions
      : [];

    const nextPrescriptions = [
      prescription,
      ...existingPrescriptions.filter(
        (item) => item.prescriptionDate !== prescription.prescriptionDate,
      ),
    ];

    return {
      ...currentPatient,
      prescriptions: nextPrescriptions,
    };
  };

  const updatedPatient =
    req.user?.role === "admin"
      ? updatePatientById(req.params.id, updater)
      : updatePatientByIdAndDoctorId(req.params.id, req.doctorId, updater);

  if (!updatedPatient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  emitPatientEvent(req, updatedPatient, "patient_updated");
  return res.status(201).json({
    message: "Prescription saved successfully",
    prescription,
    patient: getPatientSnapshot(updatedPatient),
  });
};

module.exports = {
  createPatient,
  listPatients,
  addPatientVisit,
  updatePatientProfile,
  removePatient,
  savePrescription,
};
