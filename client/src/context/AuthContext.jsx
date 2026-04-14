import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  clearStoredDoctor,
  clearStoredToken,
  getStoredDoctor,
  getStoredToken,
  loginDoctor,
  setStoredDoctor,
  setStoredToken,
} from "../services/patientApi";

const AuthContext = createContext(undefined);

const getPermissionsForRole = (role) => {
  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedRole === "admin") {
    return {
      view_all_patients: true,
      edit_patient: true,
      delete_patient: true,
      generate_prescription: true,
      create_appointment: true,
    };
  }

  if (normalizedRole === "doctor") {
    return {
      view_all_patients: false,
      edit_patient: true,
      delete_patient: false,
      generate_prescription: true,
      create_appointment: true,
    };
  }

  return {
    view_all_patients: false,
    edit_patient: false,
    delete_patient: false,
    generate_prescription: false,
    create_appointment: false,
  };
};

const normalizeDoctor = (doctor) => {
  if (!doctor) {
    return null;
  }

  return {
    ...doctor,
    permissions:
      doctor.permissions && typeof doctor.permissions === "object"
        ? {
            ...getPermissionsForRole(doctor.role),
            ...doctor.permissions,
          }
        : getPermissionsForRole(doctor.role),
  };
};

const getInitialSession = () => {
  const storedDoctor = getStoredDoctor();
  const storedToken = getStoredToken();

  if (storedDoctor?.id && storedToken) {
    return {
      doctor: normalizeDoctor(storedDoctor),
      token: storedToken,
    };
  }

  clearStoredDoctor();
  clearStoredToken();

  return {
    doctor: null,
    token: "",
  };
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(getInitialSession);
  const { doctor, token } = session;
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const login = useCallback(async (credentials) => {
    try {
      setAuthLoading(true);
      setAuthError("");
      const { token: nextToken, doctor: loggedInDoctor } =
        await loginDoctor(credentials);
      const normalizedDoctor = normalizeDoctor(loggedInDoctor);

      setStoredToken(nextToken);
      setStoredDoctor(normalizedDoctor);
      setSession({
        doctor: normalizedDoctor,
        token: nextToken,
      });

      return normalizedDoctor;
    } catch (error) {
      setAuthError(error.message || "Failed to log in.");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredDoctor();
    clearStoredToken();
    setSession({ doctor: null, token: "" });
    setAuthError("");
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError("");
  }, []);

  const value = useMemo(
    () => ({
      doctor,
      token,
      permissions: doctor?.permissions || getPermissionsForRole(doctor?.role),
      isAuthenticated: Boolean(doctor?.id && token),
      authLoading,
      authError,
      login,
      logout,
      clearAuthError,
      hasPermission: (permission) => {
        if (!doctor) {
          return false;
        }

        if (String(doctor.role || "").toLowerCase() === "admin") {
          return true;
        }

        const permissions =
          doctor.permissions && typeof doctor.permissions === "object"
            ? doctor.permissions
            : getPermissionsForRole(doctor.role);

        return Boolean(permissions[permission]);
      },
    }),
    [doctor, token, authLoading, authError, login, logout, clearAuthError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
};
