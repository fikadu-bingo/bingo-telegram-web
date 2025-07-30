import React, { useState, useEffect } from "react";
import axios from "axios";

const backendUrl = "https://bingo-server-rw7p.onrender.com/api";

function AgentDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [depositRequests, setDepositRequests] = useState([]);
  const [cashoutRequests, setCashoutRequests] = useState([]);

  // Dummy login for now
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      setIsLoggedIn(true);
      fetchRequests();
    } else {
      alert("Invalid credentials");
    }
  };

  const fetchRequests = async () => {
    try {
      const depositRes = await axios.get(`${backendUrl}/agent/deposit-requests`);
      setDepositRequests(depositRes.data);

      const cashoutRes = await axios.get(`${backendUrl}/agent/cashout-requests`);
      setCashoutRequests(cashoutRes.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleApproveDeposit = async (id) => {
    try {
      await axios.post(`${backendUrl}/agent/deposit-requests/${id}/approve`);
      fetchRequests();
    } catch (error) {
      console.error("Error approving deposit:", error);
    }
  };

  const handleRejectDeposit = async (id) => {
    try {
      await axios.post(`${backendUrl}/agent/deposit-requests/${id}/reject`);
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting deposit:", error);
    }
  };

  const handleApproveCashout = async (id) => {
    try {
      await axios.post(`${backendUrl}/agent/cashout-requests/${id}/approve`);
      fetchRequests();
    } catch (error) {
      console.error("Error approving cashout:", error);
    }
  };

  const handleRejectCashout = async (id) => {
    try {
      await axios.post(`${backendUrl}/agent/cashout-requests/${id}/reject`);
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting cashout:", error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div>
        <h2>Agent Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h2>Agent Dashboard</h2>

      <h3>Deposit Requests</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Username</th>
            <th>Amount</th>
            <th>Phone</th>
            <th>Receipt</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {depositRequests.map((request) => (
            <tr key={request.id}>
              <td>{request.username}</td>
              <td>{request.amount} Br</td>
              <td>{request.phone_number}</td>
              <td>
                {request.receipt_url ? (
                  <a
                    href={`https://bingo-server-rw7p.onrender.com/${request.receipt_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                ) : (
                  "No file"
                )}
              </td>
              <td>{request.status}</td>
              <td>
                {request.status === "pending" && (
                  <>
                    <button onClick={() => handleApproveDeposit(request.id)}>Approve</button>
                    <button onClick={() => handleRejectDeposit(request.id)}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Cashout Requests</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Username</th>
            <th>Amount</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cashoutRequests.map((request) => (
            <tr key={request.id}>
              <td>{request.username}</td>
              <td>{request.amount} Br</td>
              <td>{request.phone_number}</td>
              <td>{request.status}</td>
              <td>
                {request.status === "pending" && (
                  <>
                    <button onClick={() => handleApproveCashout(request.id)}>Approve</button>
                    <button onClick={() => handleRejectCashout(request.id)}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AgentDashboard;