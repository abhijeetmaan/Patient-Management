import BASE_URL from "../config/api";

const DOCTOR_STORAGE_KEY = "pm-doctor";
const AUTH_TOKEN_STORAGE_KEY = "pm-auth-token";
const RETRY_DELAY_MS = 5000;
const MAX_ATTEMPTS = 2;
const SERVER_WAKING_MESSAGE =
  "Server is waking up, please wait a few seconds...";

export class ApiAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "ApiAuthError";
  }
}

class RetryableServerError extends Error {
  constructor(message) {
    super(message);
    this.name = "RetryableServerError";
  }
}

const wait = (durationMs) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || "Request failed";

    if (response.status === 401) {
      throw new ApiAuthError(errorMessage);
    }

    if (response.status >= 500) {
      throw new RetryableServerError(errorMessage);
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

const readStoredDoctor = () => {
  try {
    const storedValue = localStorage.getItem(DOCTOR_STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (_error) {
    return null;
  }
};

const readStoredToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
  } catch (_error) {
    return "";
  }
};

const buildAuthHeaders = (includeJson = false) => {
  const headers = {};
  const token = readStoredToken();

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const requestJson = async (path, options = {}) => {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, options);
      return await handleResponse(response);
    } catch (error) {
      if (error instanceof ApiAuthError) {
        throw error;
      }

      const canRetry =
        attempt < MAX_ATTEMPTS &&
        (error instanceof TypeError || error instanceof RetryableServerError);

      if (!canRetry) {
        if (
          error instanceof TypeError ||
          error instanceof RetryableServerError
        ) {
          throw new Error(SERVER_WAKING_MESSAGE);
        }

        throw error;
      }

      lastError = error;
      await wait(RETRY_DELAY_MS);
    }
  }

  if (lastError) {
    throw new Error(SERVER_WAKING_MESSAGE);
  }

  throw new Error("Request failed");
};

export const getStoredDoctor = () => readStoredDoctor();
export const getStoredToken = () => readStoredToken();

export const setStoredDoctor = (doctor) => {
  localStorage.setItem(DOCTOR_STORAGE_KEY, JSON.stringify(doctor));
};

export const setStoredToken = (token) => {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, String(token || ""));
};

export const clearStoredDoctor = () => {
  localStorage.removeItem(DOCTOR_STORAGE_KEY);
};

export const clearStoredToken = () => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const loginDoctor = async (payload) => {
  return requestJson("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

export const fetchPatients = async () => {
  return requestJson("/patients", {
    headers: buildAuthHeaders(),
  });
};

export const createPatient = async (payload) => {
  return requestJson("/patients", {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });
};

export const deletePatient = async (patientId) => {
  return requestJson(`/patients/${patientId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
};

export const addPatientVisit = async (patientId, payload) => {
  return requestJson(`/patients/${patientId}/visit`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });
};

export const updatePatient = async (patientId, payload) => {
  return requestJson(`/patients/${patientId}`, {
    method: "PUT",
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });
};

export const savePatientPrescription = async (patientId, payload) => {
  return requestJson(`/patients/${patientId}/prescriptions`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });
};

export const fetchAppointments = async () => {
  return requestJson("/appointments", {
    headers: buildAuthHeaders(),
  });
};

export const createAppointment = async (payload) => {
  return requestJson("/appointments", {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  return requestJson(`/appointments/${appointmentId}/status`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ status }),
  });
};

export const fetchAdminDoctors = async () => {
  return requestJson("/admin/doctors", {
    headers: buildAuthHeaders(),
  });
};

export const updateAdminDoctorPermissions = async (doctorId, permissions) => {
  return requestJson(`/admin/doctors/${doctorId}/permissions`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ permissions }),
  });
};

export const fetchAdminPatients = async () => {
  return requestJson("/admin/patients", {
    headers: buildAuthHeaders(),
  });
};

export const fetchAdminStats = async () => {
  return requestJson("/admin/stats", {
    headers: buildAuthHeaders(),
  });
};
