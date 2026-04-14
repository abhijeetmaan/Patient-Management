const { randomUUID } = require("crypto");
const {
  addPatient,
  deleteAppointmentsByPatientIdAndDoctorId,
  deletePatientByIdAndDoctorId,
  getPatientsByDoctorId,
  updatePatientByIdAndDoctorId,
} = require("../data/patientsStore");
const {
  validateCreatePatientPayload,
  validateVisitPayload,
  validateUpdatePatientPayload,
} = require("../utils/validatePatient");

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
    createdAt: admissionDate,
  };

  const createdPatient = addPatient(patient);
  return res.status(201).json(createdPatient);
};

const listPatients = (_req, res) => {
  return res.status(200).json(getPatientsByDoctorId(_req.doctorId));
};

const addPatientVisit = (req, res) => {
  const validationError = validateVisitPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const newVisit = createVisitObject(req.body);
  const updatedPatient = updatePatientByIdAndDoctorId(
    req.params.id,
    req.doctorId,
    (currentPatient) => ({
      ...currentPatient,
      visits: [
        newVisit,
        ...(Array.isArray(currentPatient.visits) ? currentPatient.visits : []),
      ],
    }),
  );

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

  const updatedPatient = updatePatientByIdAndDoctorId(
    req.params.id,
    req.doctorId,
    (currentPatient) => ({
      ...currentPatient,
      name: String(req.body.name).trim(),
      age: Number(req.body.age),
      gender: String(req.body.gender).trim(),
    }),
  );

  if (!updatedPatient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  return res.status(200).json(updatedPatient);
};

const removePatient = (req, res) => {
  const wasDeleted = deletePatientByIdAndDoctorId(req.params.id, req.doctorId);

  if (!wasDeleted) {
    return res.status(404).json({ message: "Patient not found" });
  }

  deleteAppointmentsByPatientIdAndDoctorId(req.params.id, req.doctorId);

  return res.status(200).json({ message: "Patient deleted successfully" });
};

module.exports = {
  createPatient,
  listPatients,
  addPatientVisit,
  updatePatientProfile,
  removePatient,
};
