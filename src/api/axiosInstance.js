// src/api/axiosInstance.js
import axios from "axios";

const instance = axios.create({
  baseURL: "https://bingo-server-rw7p.onrender.com/api", // ← update with your actual Render backend URL
  withCredentials: false,
});

export default instance;
