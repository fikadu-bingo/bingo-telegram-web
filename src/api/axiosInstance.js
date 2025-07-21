// src/api/axiosInstance.js
import axios from "axios";

const instance = axios.create({
  baseURL: "https://bingo-server-url.onrender.com/api", // ← update with your actual Render backend URL
  withCredentials: false,
});

export default instance;