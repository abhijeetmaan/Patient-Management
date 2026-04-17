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

const getDoctorRoom = (doctorId) => `doctor:${String(doctorId || "")}`;

const getAppointmentSortWeight = (status) => {
  const normalizedStatus = String(status || "pending").toLowerCase();

  if (normalizedStatus === "in_cabin") {
    return 0;
  }

  if (normalizedStatus === "pending") {
    return 1;
  }

  if (normalizedStatus === "requeued") {
    return 2;
  }

  if (normalizedStatus === "skipped") {
    return 3;
  }

  return 4;
};

const getAppointmentSortTimestamp = (appointment) => {
  const status = String(appointment?.status || "pending").toLowerCase();

  if (status === "in_cabin" && appointment?.cabinStartTime) {
    const timestamp = new Date(appointment.cabinStartTime).getTime();
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  if (status === "requeued" && appointment?.requeueTime) {
    const timestamp = new Date(appointment.requeueTime).getTime();
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  const fallbackTimestamp = new Date(
    `${appointment?.date}T${appointment?.time}`,
  ).getTime();
  return Number.isNaN(fallbackTimestamp) ? 0 : fallbackTimestamp;
};

const applyAppointmentLifecycleState = (current, status) => {
  const normalizedStatus = String(status || "pending").trim();
  const now = new Date().toISOString();

  return {
    ...current,
    status: normalizedStatus,
    cabinStartTime:
      normalizedStatus === "in_cabin"
        ? now
        : normalizedStatus === "pending" ||
            normalizedStatus === "skipped" ||
            normalizedStatus === "requeued"
          ? null
          : current.cabinStartTime || null,
    completedAt:
      normalizedStatus === "completed"
        ? now
        : normalizedStatus === "pending" ||
            normalizedStatus === "in_cabin" ||
            normalizedStatus === "skipped" ||
            normalizedStatus === "requeued"
          ? null
          : current.completedAt || null,
    isLate:
      normalizedStatus === "skipped" || normalizedStatus === "requeued"
        ? true
        : Boolean(current.isLate),
    skippedAt:
      normalizedStatus === "skipped"
        ? now
        : normalizedStatus === "pending" || normalizedStatus === "in_cabin"
          ? null
          : current.skippedAt || null,
    requeueTime:
      normalizedStatus === "requeued"
        ? now
        : normalizedStatus === "skipped"
          ? null
          : current.requeueTime || null,
  };
};

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

const getAppointmentSnapshot = (appointment) => {
  if (!appointment) {
    return null;
  }

  const assignedDoctor = getDoctorById(appointment.doctorId);

  return {
    ...appointment,
    doctorName: assignedDoctor?.name || "Unknown Doctor",
  };
};

const emitAppointmentEvent = (req, appointment, eventName) => {
  const io = req.app.get("io");
  const doctorSocketIds = req.app.get("doctorSocketIds");
  if (!io || !appointment) {
    return;
  }

  const payload = {
    ...getAppointmentSnapshot(appointment),
    actorDoctorId: String(req.doctorId),
    actorDoctorName: req.user?.name || "Doctor",
  };

  emitToRoomExcludingDoctor(
    io,
    getDoctorRoom(appointment.doctorId),
    eventName,
    payload,
    doctorSocketIds,
    req.doctorId,
  );
  io.to("admins").emit(eventName, payload);
};

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
    cabinStartTime: null,
    completedAt: null,
    isLate: false,
    skippedAt: null,
    requeueTime: null,
    createdAt: new Date(),
  };

  const createdAppointment = addAppointment(appointment);
  emitAppointmentEvent(req, createdAppointment, "appointment_created");
  return res.status(201).json(getAppointmentSnapshot(createdAppointment));
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
      const statusDelta =
        getAppointmentSortWeight(a.status) - getAppointmentSortWeight(b.status);

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return getAppointmentSortTimestamp(a) - getAppointmentSortTimestamp(b);
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
  const eventName =
    status === "skipped"
      ? "appointment_skipped"
      : status === "requeued"
        ? "appointment_requeued"
        : "appointment_updated";

  const updatedAppointment = isAdmin
    ? updateAppointmentById(req.params.id, (current) =>
        applyAppointmentLifecycleState(current, status),
      )
    : updateAppointmentByIdAndDoctorId(req.params.id, req.doctorId, (current) =>
        applyAppointmentLifecycleState(current, status),
      );

  if (!updatedAppointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  emitAppointmentEvent(req, updatedAppointment, eventName);
  return res.status(200).json(getAppointmentSnapshot(updatedAppointment));
};

module.exports = {
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
};
