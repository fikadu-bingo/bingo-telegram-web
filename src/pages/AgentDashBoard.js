import React, { useState, useEffect } from "react";
import axios from "axios";

function AgentDashboard() {
  const backendUrl = "https://bingo-server-rw7p.onrender.com";

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("agentToken"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [depositRequests, setDepositRequests] = useState([]);
  const [cashoutRequests, setCashoutRequests] = useState([]);

  // ✅ Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${backendUrl}/api/agent/login`, { username, password });
      if (res.data.token) {
        localStorage.setItem("agentToken", res.data.token);
        setIsLoggedIn(true);
      } else {
        alert("Login failed: No token returned");
      }
    } catch (err) {
      alert("Invalid username or password");
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("agentToken");
    setIsLoggedIn(false);
  };

  // ✅ Fetch requests when logged in
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

  // ✅ Handle File Upload (Cashout)
  const handleFileUpload = (id, file) => {
    const updated = cashoutRequests.map((req) =>
      req.id === id ? { ...req, receiptFile: file } : req
    );
    setCashoutRequests(updated);
  };

  // ✅ Approve Cashout
  const handleApproveCashout = async (request) => {
    if (!request.receiptFile) {
      alert("Please upload a receipt first.");
      return;
    }

    const formData = new FormData();
    formData.append("receipt", request.receiptFile);

    try {
      const token = localStorage.getItem("agentToken");
      await axios.post(`${backendUrl}/api/agent/cashout-requests/${request.id}/approve`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const res = await axios.get(`${backendUrl}/api/agent/cashout-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCashoutRequests(res.data.cashouts);
    } catch (error) {
      console.error("Approval failed", error);
      alert("Approval failed");
    }
  };

  // ✅ Reject Cashout
  const handleRejectCashout = async (requestId) => {
    try {
      const token = localStorage.getItem("agentToken");
      await axios.post(`${backendUrl}/api/agent/cashouts/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await axios.get(`${backendUrl}/api/agent/cashout-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedRequests = res.data.cashouts.map((req) => ({
        ...req,
        receiptFile: null,
      }));
      setCashoutRequests(updatedRequests);
    } catch (error) {
      console.error("Cashout rejection failed", error);
      alert("Rejection failed");
    }
  };

  // ✅ Approve Deposit
  const handleApproveDeposit = async (requestId) => {
    try {
      const token = localStorage.getItem("agentToken");
      await axios.post(`${backendUrl}/api/agent/deposit-requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await axios.get(`${backendUrl}/api/agent/deposit-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepositRequests(res.data.deposits);
    } catch (error) {
      console.error("Deposit approval failed", error);
      alert("Deposit approval failed");
    }
  };

  // ✅ Reject Deposit
  const handleRejectDeposit = async (requestId) => {
    try {
      const token = localStorage.getItem("agentToken");
      await axios.post(`${backendUrl}/api/agent/deposit-requests/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await axios.get(`${backendUrl}/api/agent/deposit-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepositRequests(res.data.deposits);
    } catch (error) {
      console.error("Deposit rejection failed", error);
      alert("Rejection failed");
    }
  };

  // ✅ Login Form
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

  // ✅ Dashboard
  return (
    <div style={{ padding: "20px" }}>
      <h2>Agent Dashboard</h2>
      <button
        onClick={handleLogout}
        style={{
          background: "gray",
          color: "white",
          padding: "5px 10px",
          borderRadius: "5px",
          marginBottom: "20px",
        }}
      >
        Logout
      </button>

      {/* Deposit Requests Table */}
      <div style={{ marginTop: "30px" }}>
        <h3>Deposit Requests</h3>
        <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th>User</th>
                <th>Amount</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Receipt</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {depositRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.username}</td>
                  <td>{request.amount} ETB</td>
                  <td>{request.phone_number}</td>
                  <td>{request.date}</td>
                  <td>
                    {request.receipt_url ? (
                      <a
                        href={`${backendUrl}/${request.receipt_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    ) : (<span>No receipt</span>
                    )}
                  </td>
                  <td style={{ color: request.status === "pending" ? "orange" : "green" }}>
                    {request.status}
                  </td>
                  <td>
                    {request.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleApproveDeposit(request.id)}
                          style={{
                            marginRight: "10px",
                            background: "green",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "5px",
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectDeposit(request.id)}
                          style={{
                            background: "red",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "5px",
                          }}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashout Requests Table */}
      <div style={{ marginTop: "30px" }}>
        <h3>Cashout Requests</h3>
        <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th>User</th>
                <th>Amount</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Status</th>
                <th>Upload Receipt</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cashoutRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.username}</td>
                  <td>{request.amount} ETB</td>
                  <td>{request.phone_number}</td>
                  <td>{request.date}</td>
                  <td style={{ color: request.status === "pending" ? "orange" : "green" }}>
                    {request.status}
                  </td>
                  <td>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(request.id, e.target.files[0])}
                    />
                  </td>
                  <td>
                    {request.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleApproveCashout(request)}
                          style={{
                            marginRight: "10px",
                            background: "green",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "5px",
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectCashout(request.id)}
                          style={{
                            background: "red",color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "5px",
                          }}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AgentDashboard;