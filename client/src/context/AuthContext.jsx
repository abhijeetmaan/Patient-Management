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

const getInitialSession = () => {
  const storedDoctor = getStoredDoctor();
  const storedToken = getStoredToken();

  if (storedDoctor?.id && storedToken) {
    return {
      doctor: storedDoctor,
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

      setStoredToken(nextToken);
      setStoredDoctor(loggedInDoctor);
      setSession({
        doctor: loggedInDoctor,
        token: nextToken,
      });

      return loggedInDoctor;
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
      isAuthenticated: Boolean(doctor?.id && token),
      authLoading,
      authError,
      login,
      logout,
      clearAuthError,
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
