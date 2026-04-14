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

module.exports = {
  validateCreatePatientPayload,
  validateVisitPayload,
  validateUpdatePatientPayload,
};
