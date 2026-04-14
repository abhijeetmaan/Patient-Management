const validateCreatePatientPayload = (payload) => {
  const requiredFields = [
    "name",
    "age",
    "gender",
    "admissionDate",
    "symptoms",
    "diagnosis",
  ];

  for (const field of requiredFields) {
    if (
      payload[field] === undefined ||
      payload[field] === null ||
      String(payload[field]).trim() === ""
    ) {
      return `${field} is required`;
    }
  }

  const age = Number(payload.age);
  if (Number.isNaN(age) || age <= 0) {
    return "age must be a valid positive number";
  }

  return null;
};

const validateVisitPayload = (payload) => {
  const requiredFields = ["symptoms", "diagnosis"];

  for (const field of requiredFields) {
    if (
      payload[field] === undefined ||
      payload[field] === null ||
      String(payload[field]).trim() === ""
    ) {
      return `${field} is required`;
    }
  }

  return null;
};

const validateUpdatePatientPayload = (payload) => {
  const requiredFields = ["name", "age", "gender"];

  for (const field of requiredFields) {
    if (
      payload[field] === undefined ||
      payload[field] === null ||
      String(payload[field]).trim() === ""
    ) {
      return `${field} is required`;
    }
  }

  const age = Number(payload.age);
  if (Number.isNaN(age) || age <= 0) {
    return "age must be a valid positive number";
  }

  return null;
};

const validatePrescriptionPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return "Invalid prescription payload";
  }

  const diagnosis = String(payload.diagnosis || "").trim();
  if (!diagnosis) {
    return "diagnosis is required";
  }

  const prescriptionDate = String(payload.prescriptionDate || "").trim();
  if (!prescriptionDate) {
    return "prescriptionDate is required";
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(prescriptionDate)) {
    return "prescriptionDate must be in YYYY-MM-DD format";
  }

  const medicines = Array.isArray(payload.medicines)
    ? payload.medicines
    : String(payload.medicines || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  if (medicines.length === 0) {
    return "at least one medicine is required";
  }

  return null;
};

module.exports = {
  validateCreatePatientPayload,
  validateVisitPayload,
  validateUpdatePatientPayload,
  validatePrescriptionPayload,
};
