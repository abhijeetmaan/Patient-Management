let patients = [];

const DEFAULT_DOCTOR_ID = 1;

const normalizeDoctorId = (doctorId) => String(doctorId ?? DEFAULT_DOCTOR_ID);

const isSameDoctor = (recordDoctorId, doctorId) =>
  normalizeDoctorId(recordDoctorId) === normalizeDoctorId(doctorId);

const getPatients = () => patients;

const getPatientsByDoctorId = (doctorId) =>
  patients.filter((patient) => isSameDoctor(patient.doctorId, doctorId));

const getPatientById = (id) =>
  patients.find((patient) => patient.id === id) || null;

const getPatientByIdAndDoctorId = (id, doctorId) =>
  patients.find(
    (patient) => patient.id === id && isSameDoctor(patient.doctorId, doctorId),
  ) || null;

const addPatient = (patient) => {
  patients.unshift(patient);
  return patient;
};

const updatePatientById = (id, updater) => {
  const patientIndex = patients.findIndex((patient) => patient.id === id);
  if (patientIndex === -1) {
    return null;
  }

  const nextPatient = updater(patients[patientIndex]);
  patients[patientIndex] = nextPatient;
  return nextPatient;
};

const updatePatientByIdAndDoctorId = (id, doctorId, updater) => {
  const patientIndex = patients.findIndex(
    (patient) => patient.id === id && isSameDoctor(patient.doctorId, doctorId),
  );

  if (patientIndex === -1) {
    return null;
  }

  const nextPatient = updater(patients[patientIndex]);
  patients[patientIndex] = nextPatient;
  return nextPatient;
};

const deletePatient = (id) => {
  const beforeCount = patients.length;
  patients = patients.filter((patient) => patient.id !== id);
  return patients.length < beforeCount;
};

const deletePatientByIdAndDoctorId = (id, doctorId) => {
  const beforeCount = patients.length;
  patients = patients.filter(
    (patient) =>
      !(patient.id === id && isSameDoctor(patient.doctorId, doctorId)),
  );
  return patients.length < beforeCount;
};

module.exports = {
  getPatients,
  getPatientsByDoctorId,
  getPatientById,
  getPatientByIdAndDoctorId,
  addPatient,
  updatePatientById,
  updatePatientByIdAndDoctorId,
  deletePatient,
  deletePatientByIdAndDoctorId,
};
