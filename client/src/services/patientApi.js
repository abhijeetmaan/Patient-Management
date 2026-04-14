// const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://patient-management-1-g1i8.onrender.com";
const DOCTOR_STORAGE_KEY = "pm-doctor";
const AUTH_TOKEN_STORAGE_KEY = "pm-auth-token";

const networkErrorMessage =
  //   "Cannot connect to backend API. Make sure server is running on http://localhost:5001";
  "Cannot connect to backend API. Make sure server is running on https://patient-management-1-g1i8.onrender.com";

export class ApiAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "ApiAuthError";
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || "Request failed";

    if (response.status === 401) {
      throw new ApiAuthError(errorMessage);
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
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};

export const fetchPatients = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      headers: buildAuthHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};

export const createPatient = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: "POST",
      headers: buildAuthHeaders(true),
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};

export const deletePatient = async (patientId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: "DELETE",
      headers: buildAuthHeaders(),
    });

    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};

export const addPatientVisit = async (patientId, payload) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/visit`,
      {
        method: "POST",
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      },
    );

    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};

export const updatePatient = async (patientId, payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: "PUT",
      headers: buildAuthHeaders(true),
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};

export const fetchAppointments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      headers: buildAuthHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};

export const createAppointment = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: "POST",
      headers: buildAuthHeaders(true),
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/appointments/${appointmentId}/status`,
      {
        method: "PATCH",
        headers: buildAuthHeaders(true),
        body: JSON.stringify({ status }),
      },
    );

    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};

export const fetchAdminDoctors = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/doctors`, {
      headers: buildAuthHeaders(),
    });

    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};

export const fetchAdminPatients = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/patients`, {
      headers: buildAuthHeaders(),
    });

    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};

export const fetchAdminStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: buildAuthHeaders(),
    });

    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkErrorMessage);
    }
    throw error;
  }
};
