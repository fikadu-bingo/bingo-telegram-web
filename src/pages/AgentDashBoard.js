import React, { useState, useEffect } from "react";
import axios from "axios";

function AgentDashboard() {
  const backendUrl = "https://bingo-server-rw7p.onrender.com";

  // ✅ Use token to persist login
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("agentToken"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [depositRequests, setDepositRequests] = useState([]);
  const [cashoutRequests, setCashoutRequests] = useState([]);

  // ✅ Login with backend
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${backendUrl}/api/agent/login`, { username, password });
      localStorage.setItem("agentToken", res.data.token); // store token
      setIsLoggedIn(true);
    } catch (err) {
      alert("Invalid username or password");
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("agentToken");
    setIsLoggedIn(false);
  };

  // ✅ Fetch requests with token
  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem("agentToken");

      axios
        .get(`${backendUrl}/api/agent/deposit-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setDepositRequests(res.data.deposits))
        .catch((err) => console.error("Failed to fetch deposit requests", err));

      axios
        .get(`${backendUrl}/api/agent/cashout-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const updatedRequests = res.data.cashouts.map((req) => ({
            ...req,
            receiptFile: null,
          }));
          setCashoutRequests(updatedRequests);
        })
        .catch((err) => console.error("Failed to fetch cashout requests", err));
    }
  }, [isLoggedIn]);

  // ✅ Add token to all action requests
  const handleApproveCashout = async (request) => {
    if (!request.receiptFile) {
      alert("Please upload a receipt first.");
      return;
    }
    const token = localStorage.getItem("agentToken");
    const formData = new FormData();
    formData.append("receipt", request.receiptFile);

    try {
      await axios.post(
        `${backendUrl}/api/agent/cashout-requests/${request.id}/approve`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const res = await axios.get(`${backendUrl}/api/agent/cashout-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCashoutRequests(res.data.cashouts);
    } catch (error) {
      console.error("Approval failed", error);
      alert("Approval failed");
    }
  };

  const handleRejectCashout = async (requestId) => {
    const token = localStorage.getItem("agentToken");
    try {
      await axios.post(
        `${backendUrl}/api/agent/cashouts/${requestId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const res = await axios.get(`${backendUrl}/api/agent/cashout-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCashoutRequests(res.data.cashouts.map((req) => ({ ...req, receiptFile: null })));
    } catch (error) {
      console.error("Cashout rejection failed", error);
      alert("Rejection failed");
    }
  };

  const handleApproveDeposit = async (requestId) => {
    const token = localStorage.getItem("agentToken");
    try {
      await axios.post(
        `${backendUrl}/api/agent/deposit-requests/${requestId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const res = await axios.get(`${backendUrl}/api/agent/deposit-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepositRequests(res.data.deposits);
    } catch (error) {
      console.error("Deposit approval failed", error);
      alert("Deposit approval failed");
    }
  };
  const handleRejectDeposit = async (requestId) => {
    const token = localStorage.getItem("agentToken");
    try {
      await axios.post(
        $`{backendUrl}/api/agent/deposit-requests/${requestId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const res = await axios.get(`${backendUrl}/api/agent/deposit-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepositRequests(res.data.deposits);
    } catch (error) {
      console.error("Deposit rejection failed", error);
      alert("Rejection failed");
    }
  };

  // ✅ Login form
  if (!isLoggedIn) {
    return (
      <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
        <h2>Agent Login</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "10px" }}>
            <label>Username:</label><br />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
              required
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Password:</label><br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "blue",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  // ✅ Add logout button
  return (
    <div style={{ padding: "20px" }}>
      <h2>Agent Dashboard</h2>
      <button onClick={handleLogout} style={{ marginBottom: "20px" }}>
        Logout
      </button>
      {/* existing tables unchanged */}
    </div>
  );
}

export default AgentDashboard;