import axios from "axios";

const API = axios.create({
  // Use the IP address to be 100% sure
  baseURL: "http://127.0.0.1:8000/api",
});

// This interceptor is CRITICAL for the "profile" route to work
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
