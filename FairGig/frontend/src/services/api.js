import axios from "axios";
import toast from "react-hot-toast";

const createClient = (baseURL) => {
  const client = axios.create({ baseURL, timeout: 15000, withCredentials: true });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem("fairgig_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        localStorage.removeItem("fairgig_token");
        localStorage.removeItem("fairgig_auth");
        window.location.href = "/login";
      } else if (err?.response?.status >= 500) {
        toast.error("Something went wrong. Try again.");
      } else if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err?.response?.data?.error) {
        toast.error(err.response.data.error);
      }
      return Promise.reject(err);
    }
  );

  return client;
};

export const authApi = createClient(import.meta.env.VITE_AUTH_API || "/proxy/auth");
export const earningsApi = createClient(import.meta.env.VITE_EARNINGS_API || "/proxy/earnings");
export const grievanceApi = createClient(import.meta.env.VITE_GRIEVANCE_API || "/proxy/grievance");
export const certificateApi = createClient(import.meta.env.VITE_CERTIFICATE_API || "/proxy/certificate");
