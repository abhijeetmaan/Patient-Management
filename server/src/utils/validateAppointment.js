const validateCreateAppointmentPayload = (payload = {}) => {
  const { patientId, patientName, date, time } = payload;

  if (!String(patientId || "").trim()) {
    return "Patient is required.";
  }

  if (!String(patientName || "").trim()) {
    return "Patient name is required.";
  }

  if (!String(date || "").trim()) {
    return "Appointment date is required.";
  }

  if (!String(time || "").trim()) {
    return "Appointment time is required.";
  }

  const parsedDate = new Date(`${date}T${time}`);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Date and time are invalid.";
  }

  return "";
};

const validateUpdateAppointmentStatusPayload = (payload = {}) => {
  const status = String(payload.status || "").trim();
  if (
    !["pending", "in_cabin", "completed", "skipped", "requeued"].includes(
      status,
    )
  ) {
    return "Status must be pending, in_cabin, completed, skipped, or requeued.";
  }

  return "";
};

module.exports = {
  validateCreateAppointmentPayload,
  validateUpdateAppointmentStatusPayload,
};
