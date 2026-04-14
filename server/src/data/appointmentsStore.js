const appointments = [];

const DEFAULT_DOCTOR_ID = 1;

const normalizeDoctorId = (doctorId) => String(doctorId ?? DEFAULT_DOCTOR_ID);

const isSameDoctor = (recordDoctorId, doctorId) =>
  normalizeDoctorId(recordDoctorId) === normalizeDoctorId(doctorId);

const getAppointments = () => {
  return appointments;
};

const getAppointmentsByDoctorId = (doctorId) =>
  appointments.filter((appointment) =>
    isSameDoctor(appointment.doctorId, doctorId),
  );

const getAppointmentByIdAndDoctorId = (appointmentId, doctorId) =>
  appointments.find(
    (appointment) =>
      appointment.id === appointmentId &&
      isSameDoctor(appointment.doctorId, doctorId),
  ) || null;

const addAppointment = (appointment) => {
  appointments.unshift(appointment);
  return appointment;
};

const updateAppointmentById = (appointmentId, updater) => {
  const index = appointments.findIndex(
    (appointment) => appointment.id === appointmentId,
  );

  if (index === -1) {
    return null;
  }

  const updatedAppointment = updater(appointments[index]);
  appointments[index] = updatedAppointment;
  return updatedAppointment;
};

const updateAppointmentByIdAndDoctorId = (appointmentId, doctorId, updater) => {
  const index = appointments.findIndex(
    (appointment) =>
      appointment.id === appointmentId &&
      isSameDoctor(appointment.doctorId, doctorId),
  );

  if (index === -1) {
    return null;
  }

  const updatedAppointment = updater(appointments[index]);
  appointments[index] = updatedAppointment;
  return updatedAppointment;
};

const deleteAppointmentsByPatientIdAndDoctorId = (patientId, doctorId) => {
  const remainingAppointments = appointments.filter(
    (appointment) =>
      !(
        appointment.patientId === patientId &&
        isSameDoctor(appointment.doctorId, doctorId)
      ),
  );

  const deletedCount = appointments.length - remainingAppointments.length;
  appointments.splice(0, appointments.length, ...remainingAppointments);
  return deletedCount > 0;
};

module.exports = {
  getAppointments,
  getAppointmentsByDoctorId,
  getAppointmentByIdAndDoctorId,
  addAppointment,
  updateAppointmentById,
  updateAppointmentByIdAndDoctorId,
  deleteAppointmentsByPatientIdAndDoctorId,
};
