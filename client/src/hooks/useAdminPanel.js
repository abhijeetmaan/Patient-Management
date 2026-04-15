import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ApiAuthError,
  fetchAdminDoctors,
  fetchAdminPatients,
  fetchAdminStats,
  updateAdminDoctorPermissions,
} from "../services/patientApi";

const initialStats = {
  totalDoctors: 0,
  totalPatients: 0,
  totalAppointments: 0,
};

const useAdminPanel = (enabled) => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState(initialStats);
  const [doctors, setDoctors] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [updatingDoctorId, setUpdatingDoctorId] = useState("");

  const mergeRealtimePatient = useCallback(
    (incomingPatient) => {
      if (!enabled || !incomingPatient?.id) {
        return;
      }

      const {
        actorDoctorId: _actorDoctorId,
        actorDoctorName: _actorDoctorName,
        ...patientRecord
      } = incomingPatient;

      let didAddNewPatient = false;

      setAllPatients((previousPatients) => {
        const exists = previousPatients.some(
          (patient) => String(patient.id) === String(patientRecord.id),
        );

        didAddNewPatient = !exists;

        return exists
          ? previousPatients.map((patient) =>
              String(patient.id) === String(patientRecord.id)
                ? patientRecord
                : patient,
            )
          : [patientRecord, ...previousPatients];
      });

      if (didAddNewPatient) {
        setStats((previousStats) => ({
          ...previousStats,
          totalPatients: previousStats.totalPatients + 1,
        }));
      }
    },
    [enabled],
  );

  const incrementAppointmentCount = useCallback(() => {
    if (!enabled) {
      return;
    }

    setStats((previousStats) => ({
      ...previousStats,
      totalAppointments: previousStats.totalAppointments + 1,
    }));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setErrorMessage("");
      setStats(initialStats);
      setDoctors([]);
      setAllPatients([]);
      setUpdatingDoctorId("");
      return;
    }

    let isMounted = true;

    const loadAdminPanel = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [statsResponse, doctorsResponse, patientsResponse] =
          await Promise.all([
            fetchAdminStats(),
            fetchAdminDoctors(),
            fetchAdminPatients(),
          ]);

        if (!isMounted) {
          return;
        }

        setStats({
          totalDoctors: Number(statsResponse.totalDoctors || 0),
          totalPatients: Number(statsResponse.totalPatients || 0),
          totalAppointments: Number(statsResponse.totalAppointments || 0),
        });
        setDoctors(Array.isArray(doctorsResponse) ? doctorsResponse : []);
        setAllPatients(Array.isArray(patientsResponse) ? patientsResponse : []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiAuthError) {
          logout();
          return;
        }

        setErrorMessage(error.message || "Failed to load admin dashboard.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAdminPanel();

    return () => {
      isMounted = false;
    };
  }, [enabled, logout]);

  return {
    loading,
    errorMessage,
    stats,
    doctors,
    allPatients,
    updatingDoctorId,
    mergeRealtimePatient,
    incrementAppointmentCount,
    updateDoctorPermissions: async (doctorId, permissions) => {
      try {
        setUpdatingDoctorId(String(doctorId));
        setErrorMessage("");
        const updatedDoctor = await updateAdminDoctorPermissions(
          doctorId,
          permissions,
        );

        setDoctors((previousDoctors) =>
          previousDoctors.map((doctor) =>
            String(doctor.id) === String(doctorId) ? updatedDoctor : doctor,
          ),
        );
      } catch (error) {
        if (error instanceof ApiAuthError) {
          logout();
          return;
        }

        setErrorMessage(error.message || "Failed to update permissions.");
        throw error;
      } finally {
        setUpdatingDoctorId("");
      }
    },
  };
};

export default useAdminPanel;
