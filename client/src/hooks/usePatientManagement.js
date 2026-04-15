import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ApiAuthError,
  addPatientVisit,
  createAppointment,
  createPatient,
  deletePatient,
  fetchAppointments,
  fetchPatients,
  updateAppointmentStatus,
  updatePatient,
} from "../services/patientApi";

const usePatientManagement = () => {
  const { doctor, logout } = useAuth();
  const isAuthenticated = Boolean(doctor?.id);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [savingPatient, setSavingPatient] = useState(false);
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState("");
  const [deletingPatientId, setDeletingPatientId] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [editingPatientId, setEditingPatientId] = useState("");
  const [addingVisit, setAddingVisit] = useState(false);
  const [updatingPatient, setUpdatingPatient] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleUnauthorized = (error) => {
    if (!(error instanceof ApiAuthError)) {
      return false;
    }

    logout();
    return true;
  };

  const formatAuditUser = (rawName) => {
    const normalized = String(rawName || "").trim();

    if (!normalized) {
      return "Dr. John";
    }

    if (/^dr\.?\s+/i.test(normalized)) {
      return normalized.replace(/^dr\.?\s+/i, "Dr. ");
    }

    return `Dr. ${normalized}`;
  };

  const recordActivity = (action, message, user = doctor?.name || "Doctor") => {
    const timestamp = new Date().toISOString();
    const resolvedUser = formatAuditUser(user);

    setActivityLog((previous) =>
      [
        {
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          action,
          user: resolvedUser,
          message,
          timestamp,
        },
        ...previous,
      ].slice(0, 30),
    );
  };

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      setErrorMessage("");
      const patientList = await fetchPatients();
      setPatients(patientList);
    } catch (error) {
      if (handleUnauthorized(error)) {
        return;
      }
      setErrorMessage(error.message || "Failed to load patients.");
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setPatients([]);
      setLoadingPatients(false);
      setErrorMessage("");
      setSuccessMessage("");
      setSelectedPatientId("");
      setEditingPatientId("");
      setActivityLog([]);
      return;
    }

    setPatients([]);
    setLoadingPatients(true);
    loadPatients();
  }, [isAuthenticated, doctor?.id]);

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);
      setErrorMessage("");
      const appointmentList = await fetchAppointments();
      setAppointments(appointmentList);
    } catch (error) {
      if (handleUnauthorized(error)) {
        return;
      }
      setErrorMessage(error.message || "Failed to load appointments.");
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setAppointments([]);
      setLoadingAppointments(false);
      return;
    }

    setAppointments([]);
    setLoadingAppointments(true);
    loadAppointments();
  }, [isAuthenticated, doctor?.id]);

  const handleAddPatient = async (formData) => {
    try {
      setSavingPatient(true);
      setErrorMessage("");
      setSuccessMessage("");
      const createdPatient = await createPatient(formData);
      setPatients((previousPatients) => {
        const exists = previousPatients.some(
          (patient) => String(patient.id) === String(createdPatient.id),
        );

        return exists
          ? previousPatients.map((patient) =>
              String(patient.id) === String(createdPatient.id)
                ? createdPatient
                : patient,
            )
          : [createdPatient, ...previousPatients];
      });
      recordActivity(
        "patient_added",
        `${formatAuditUser(doctor?.name)} added patient ${createdPatient.name}`,
        doctor?.name,
      );
      return createdPatient;
    } catch (error) {
      if (handleUnauthorized(error)) {
        return null;
      }
      setErrorMessage(error.message || "Failed to add patient.");
      throw error;
    } finally {
      setSavingPatient(false);
    }
  };

  const handleDeletePatient = async (patientId) => {
    try {
      setDeletingPatientId(patientId);
      setErrorMessage("");
      setSuccessMessage("");
      await deletePatient(patientId);
      setPatients((previousPatients) =>
        previousPatients.filter((patient) => patient.id !== patientId),
      );

      if (selectedPatientId === patientId) {
        setSelectedPatientId("");
      }

      if (editingPatientId === patientId) {
        setEditingPatientId("");
      }
    } catch (error) {
      if (handleUnauthorized(error)) {
        return;
      }
      setErrorMessage(error.message || "Failed to delete patient.");
    } finally {
      setDeletingPatientId("");
    }
  };

  const handleOpenPatientDetails = (patientId) => {
    setSuccessMessage("");
    setSelectedPatientId(patientId);
  };

  const handleClosePatientDetails = () => {
    setSelectedPatientId("");
  };

  const handleAddVisit = async (patientId, visitData) => {
    try {
      setAddingVisit(true);
      setErrorMessage("");
      setSuccessMessage("");
      const updatedPatient = await addPatientVisit(patientId, visitData);
      setPatients((previousPatients) =>
        previousPatients.map((patient) =>
          patient.id === patientId ? updatedPatient : patient,
        ),
      );
    } catch (error) {
      if (handleUnauthorized(error)) {
        return null;
      }
      setErrorMessage(error.message || "Failed to add visit.");
      throw error;
    } finally {
      setAddingVisit(false);
    }
  };

  const handleOpenEditPatient = (patientId) => {
    setSuccessMessage("");
    setEditingPatientId(patientId);
  };

  const handleCloseEditPatient = () => {
    setEditingPatientId("");
  };

  const handleUpdatePatient = async (patientId, updatedFields) => {
    try {
      setUpdatingPatient(true);
      setErrorMessage("");
      setSuccessMessage("");

      const updatedPatient = await updatePatient(patientId, updatedFields);

      setPatients((previousPatients) =>
        previousPatients.map((patient) =>
          patient.id === patientId ? updatedPatient : patient,
        ),
      );

      setSuccessMessage("Patient updated successfully.");
      setEditingPatientId("");
      recordActivity(
        "patient_updated",
        `${formatAuditUser(doctor?.name)} updated patient ${updatedPatient.name}`,
        doctor?.name,
      );
    } catch (error) {
      if (handleUnauthorized(error)) {
        return null;
      }
      setErrorMessage(error.message || "Failed to update patient.");
      throw error;
    } finally {
      setUpdatingPatient(false);
    }
  };

  const mergeRealtimePatient = useCallback((incomingPatient) => {
    if (!incomingPatient?.id) {
      return;
    }

    const {
      actorDoctorId: _actorDoctorId,
      actorDoctorName: _actorDoctorName,
      ...patientRecord
    } = incomingPatient;

    setPatients((previousPatients) => {
      const nextPatients = previousPatients.some(
        (patient) => String(patient.id) === String(patientRecord.id),
      )
        ? previousPatients.map((patient) =>
            String(patient.id) === String(patientRecord.id)
              ? patientRecord
              : patient,
          )
        : [patientRecord, ...previousPatients];

      return nextPatients;
    });
  }, []);

  const mergeRealtimeAppointment = useCallback((incomingAppointment) => {
    if (!incomingAppointment?.id) {
      return;
    }

    const {
      actorDoctorId: _actorDoctorId,
      actorDoctorName: _actorDoctorName,
      ...appointmentRecord
    } = incomingAppointment;

    setAppointments((previousAppointments) => {
      const nextAppointments = previousAppointments.some(
        (appointment) =>
          String(appointment.id) === String(appointmentRecord.id),
      )
        ? previousAppointments.map((appointment) =>
            String(appointment.id) === String(appointmentRecord.id)
              ? appointmentRecord
              : appointment,
          )
        : [appointmentRecord, ...previousAppointments];

      return nextAppointments.sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime(),
      );
    });
  }, []);

  const clearPatientModals = () => {
    setSelectedPatientId("");
    setEditingPatientId("");
  };

  const handlePrescriptionSaved = (patientId, prescription) => {
    if (!patientId || !prescription) {
      return;
    }

    setPatients((previousPatients) =>
      previousPatients.map((patient) => {
        if (patient.id !== patientId) {
          return patient;
        }

        const existingPrescriptions = Array.isArray(patient.prescriptions)
          ? patient.prescriptions
          : [];

        const prescriptionDate = String(
          prescription.prescriptionDate || "",
        ).trim();

        const mergedPrescriptions = prescriptionDate
          ? [
              prescription,
              ...existingPrescriptions.filter(
                (item) => item.prescriptionDate !== prescriptionDate,
              ),
            ]
          : [prescription, ...existingPrescriptions];

        return {
          ...patient,
          prescriptions: mergedPrescriptions,
        };
      }),
    );
  };

  const handleAddAppointment = async (appointmentData) => {
    try {
      setSavingAppointment(true);
      setErrorMessage("");
      setSuccessMessage("");

      const createdAppointment = await createAppointment(appointmentData);
      setAppointments((previous) => {
        const merged = previous.some(
          (appointment) =>
            String(appointment.id) === String(createdAppointment.id),
        )
          ? previous.map((appointment) =>
              String(appointment.id) === String(createdAppointment.id)
                ? createdAppointment
                : appointment,
            )
          : [createdAppointment, ...previous];

        return merged.sort(
          (a, b) =>
            new Date(`${a.date}T${a.time}`).getTime() -
            new Date(`${b.date}T${b.time}`).getTime(),
        );
      });
      recordActivity(
        "appointment_scheduled",
        `${formatAuditUser(doctor?.name)} scheduled appointment for ${createdAppointment.patientName}`,
        doctor?.name,
      );
      setSuccessMessage("Appointment scheduled successfully.");
      return createdAppointment;
    } catch (error) {
      if (handleUnauthorized(error)) {
        return null;
      }
      setErrorMessage(error.message || "Failed to add appointment.");
      throw error;
    } finally {
      setSavingAppointment(false);
    }
  };

  const handleMarkAppointmentCompleted = async (appointmentId) => {
    try {
      setUpdatingAppointmentId(appointmentId);
      setErrorMessage("");
      setSuccessMessage("");

      const updatedAppointment = await updateAppointmentStatus(
        appointmentId,
        "completed",
      );

      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === appointmentId ? updatedAppointment : appointment,
        ),
      );
      recordActivity(
        "appointment_completed",
        `${formatAuditUser(doctor?.name)} marked appointment completed for ${updatedAppointment.patientName}`,
        doctor?.name,
      );
      setSuccessMessage("Appointment marked as completed.");
      return updatedAppointment;
    } catch (error) {
      if (handleUnauthorized(error)) {
        return null;
      }
      if ((error.message || "").toLowerCase().includes("not found")) {
        await loadAppointments();
        setErrorMessage(
          "Appointment no longer exists on the server. The list has been refreshed.",
        );
        return null;
      }

      setErrorMessage(error.message || "Failed to update appointment.");
      throw error;
    } finally {
      setUpdatingAppointmentId("");
    }
  };

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId],
  );

  const editingPatient = useMemo(
    () => patients.find((patient) => patient.id === editingPatientId) || null,
    [patients, editingPatientId],
  );

  return {
    patients,
    appointments,
    loadingPatients,
    loadingAppointments,
    savingPatient,
    savingAppointment,
    updatingAppointmentId,
    deletingPatientId,
    addingVisit,
    updatingPatient,
    activityLog,
    errorMessage,
    successMessage,
    selectedPatient,
    editingPatient,
    handleAddPatient,
    handleDeletePatient,
    handleOpenPatientDetails,
    handleClosePatientDetails,
    handleAddVisit,
    handleOpenEditPatient,
    handleCloseEditPatient,
    handleUpdatePatient,
    handleAddAppointment,
    handleMarkAppointmentCompleted,
    handlePrescriptionSaved,
    mergeRealtimePatient,
    mergeRealtimeAppointment,
    recordActivity,
    clearPatientModals,
  };
};

export default usePatientManagement;
