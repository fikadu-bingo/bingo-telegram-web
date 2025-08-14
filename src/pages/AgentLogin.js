import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AgentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent page reload

    setError(""); // Clear previous errors

    try {
      const res = await axios.post(
        "https://bingo-server-rw7p.onrender.com/api/agent/login",
        { username, password },
        { withCredentials: true } // Optional if using cookies
      );

      if (res.data.success) {
        localStorage.setItem("agentToken", res.data.token);
        navigate("/agent-dashboard"); // Redirect to dashboard
      } else {
        setError(res.data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Invalid username or password"
      );
    }
  };

  return (
    <div className="agent-login-container">
      <h2>Agent Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Login</button>
      </form>
    </div>
  );
}