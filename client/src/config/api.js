const LOCAL_API_URL = "http://localhost:5001";
const DEPLOYED_API_URL = "https://patient-management-1-g1i8.onrender.com";

export const BASE_URL = import.meta.env.DEV
  ? LOCAL_API_URL
  : import.meta.env.VITE_API_URL || DEPLOYED_API_URL;

export const NETWORK_ERROR_MESSAGE = `Cannot connect to backend API. Make sure server is running on ${BASE_URL}`;
