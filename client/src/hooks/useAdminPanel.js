import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ApiAuthError,
  fetchAdminDoctors,
  fetchAdminPatients,
  fetchAdminStats,
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

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setErrorMessage("");
      setStats(initialStats);
      setDoctors([]);
      setAllPatients([]);
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
  };
};

export default useAdminPanel;
