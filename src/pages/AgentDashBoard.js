import React, { useState, useEffect } from "react";

const AgentDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [depositRequests, setDepositRequests] = useState([]);
  const [cashoutRequests, setCashoutRequests] = useState([]);

  const login = async () => {
    const res = await fetch("/api/agent/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data.success) {
      setIsLoggedIn(true);
      fetchRequests();
    } else {
      alert("Invalid credentials");
    }
  };

  const fetchRequests = async () => {
    try {
      const [depositRes, cashoutRes] = await Promise.all([
        fetch("/api/agent/deposit-requests"),
        fetch("/api/agent/cashout-requests"),
      ]);
      const depositData = await depositRes.json();
      const cashoutData = await cashoutRes.json();
      setDepositRequests(depositData);
      setCashoutRequests(cashoutData);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleApproveDeposit = async (id) => {
    await fetch(`/api/agent/deposit-requests/${id}/approve`, { method: "POST" });
    setDepositRequests((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "Approved" } : d))
    );
  };

  const handleRejectDeposit = async (id) => {
    await fetch(`/api/agent/deposit-requests/${id}/reject`, { method: "POST" });
    setDepositRequests((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "Rejected" } : d))
    );
  };

  const handleApproveCashout = async (id) => {
    const cashout = cashoutRequests.find((r) => r.id === id);
    if (!cashout.receiptFile) return alert("Please upload receipt before approving.");

    const formData = new FormData();
    formData.append("id", id);
    formData.append("receipt", cashout.receiptFile);

    await fetch(`/api/agent/cashout-requests/${id}/approve`, {
      method: "POST",
      body: formData,
    });

    setCashoutRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Approved" } : r))
    );
  };

  const handleRejectCashout = async (id) => {
    await fetch(`/api/agent/cashout-requests/${id}/reject`, { method: "POST" });
    setCashoutRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Rejected" } : r))
    );
  };

  const handleReceiptChange = (e, id) => {
    const file = e.target.files[0];
    setCashoutRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, receiptFile: file } : r))
    );
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Agent Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ margin: "5px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ margin: "5px" }}
        />
        <button onClick={login} style={{ margin: "5px" }}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <h2>Agent Dashboard</h2>

      {/* Deposit Requests */}
      <h3>Deposit Requests</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Phone</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Receipt</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {depositRequests.map((req) => (
            <tr key={req.id}><td>{req.id}</td>
              <td>{req.phone}</td>
              <td>{req.amount}</td>
              <td>{req.status}</td>
              <td>
                {req.receipt_url ? (
                  <a href={req.receipt_url} target="_blank" rel="noreferrer">View</a>
                ) : (
                  "No receipt"
                )}
              </td>
              <td>
                {req.status === "Pending" && (
                  <>
                    <button onClick={() => handleApproveDeposit(req.id)}>Approve</button>{" "}
                    <button onClick={() => handleRejectDeposit(req.id)}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Cashout Requests */}
      <h3 style={{ marginTop: "40px" }}>Cashout Requests</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Phone</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Receipt Upload</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cashoutRequests.map((req) => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.phone}</td>
              <td>{req.amount}</td>
              <td>{req.status}</td>
              <td>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleReceiptChange(e, req.id)}
                />
              </td>
              <td>
                {req.status === "Pending" && (
                  <>
                    <button onClick={() => handleApproveCashout(req.id)}>Approve</button>{" "}
                    <button onClick={() => handleRejectCashout(req.id)}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentDashboard;