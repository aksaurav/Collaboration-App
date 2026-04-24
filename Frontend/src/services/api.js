import axios from "axios";

const API = axios.create({
  baseURL: "https://collaboration-app-y7d5.onrender.com/api",
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
