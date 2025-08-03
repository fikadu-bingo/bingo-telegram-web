import React, { useState, useEffect } from "react";
import axios from "axios";

function AgentDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
const backendUrl = "https://bingo-server-rw7p.onrender.com";
  // Dummy login for now
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "agent" && password === "1234") {
      setIsLoggedIn(true);
    } else {
      alert("Invalid username or password");
    }
   
  };

  const [depositRequests, setDepositRequests] = useState([]);

const [cashoutRequests, setCashoutRequests] = useState([]);
  useEffect(() => {
  if (isLoggedIn) {
    // Fetch deposit requests
    axios
      .get("https://bingo-server-rw7p.onrender.com/api/agent/deposit-requests")
      .then((res) => setDepositRequests(res.data.deposits))//backend returns { deposits: [...]}
      .catch((err) => console.error("Failed to fetch deposit requests", err));

    // Fetch cashout requests and add receiptFile field
    axios
      .get("https://bingo-server-rw7p.onrender.com/api/agent/cashout-requests")
      .then((res) => {
        const updatedRequests = res.data.cashouts.map((req) => ({ //Backend returns { cashouts: []}
          ...req,
          receiptFile: null, // Add this field for file input tracking
        }));
        setCashoutRequests(updatedRequests);
      })
      .catch((err) => console.error("Failed to fetch cashout requests", err));
  }
}, [isLoggedIn]);

  const handleFileUpload = (id, file) => {
    const updated = cashoutRequests.map((req) =>
      req.id === id ? { ...req, receiptFile: file } : req
    );
    setCashoutRequests(updated);
  };

 const handleApproveCashout = async (request) => {
  if (!request.receiptFile) {
    alert("Please upload a receipt first.");
    return;
  }

  const formData = new FormData();
  formData.append("receipt", request.receiptFile);

  try {
    await axios.post(`https://bingo-server-rw7p.onrender.com/api/agent/cashouts/${request.id}/approve`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Refresh cashout list
    const res = await axios.get("https://bingo-server-rw7p.onrender.com/api/agent/cashout-requests");
    setCashoutRequests(res.data.cashouts);
  } catch (error) {
    console.error("Approval failed", error);
    alert("Approval failed");
  }
};
// Approve Deposit Handler (POST request to backend)
const handleApproveDeposit = async (requestId) => {
  try {
    await axios.post(`https://bingo-server-rw7p.onrender.com/api/agent/deposit-requests/${requestId}/approve`);
    
    // Refresh deposit requests
    const res = await axios.get("https://bingo-server-rw7p.onrender.com/api/agent/deposit-requests");
    setDepositRequests(res.data.deposits);
  } catch (error) {
    console.error("Deposit approval failed", error);
    alert("Deposit approval failed");
  }
};
  // 👇 Show login form if not logged in
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

  // 👇 Show dashboard if logged in
  return (
    <div style={{ padding: "20px" }}>
      <h2>Agent Dashboard</h2>{/* Deposit Requests */}
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
  ) : (
    <span>No receipt</span>
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
      </div>{/* Cashout Requests */}
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
                  <td>{request.user}</td>
                  <td>{request.amount} ETB</td>
                  <td>{request.phone_number}</td>
                  <td>{request.date}</td>
                  <td style={{ color: request.status === "pending" ? "orange" : "green" }}>
                    {request.status}
                  </td>
                  <td>
                    {request.status === "pending" ? (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(request.id, e.target.files[0])}
                      />
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>
                    {request.status === "Pending" ? (
                      <>
                        <button
                          onClick={() => {
                            if (!request.receiptFile) {
                              alert("Please upload receipt before approving.");
                              return;
                            }
                            handleApproveCashout(request);
                          }}
                          style={{
                            marginRight: "10px",
                            background: "green",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "5px",
                          }}
                        >
                          Approve</button>
                        <button
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
    </div>
  );
}

export default AgentDashboard;

