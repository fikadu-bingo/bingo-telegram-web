import React, { useState } from "react";

function AgentDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Dummy login for now
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "agent" && password === "1234") {
      setIsLoggedIn(true);
    } else {
      alert("Invalid username or password");
    }
  };

  const depositRequests = [
    {
      id: 1,
      user: "user1",
      amount: 500,
      phone: "0911223344",
      date: "2025-07-20",
      receiptUrl: "/uploads/receipt1.png",
      status: "Pending",
    },
    {
      id: 2,
      user: "user2",
      amount: 1000,
      phone: "0922334455",
      date: "2025-07-19",
      receiptUrl: "/uploads/receipt2.jpg",
      status: "Approved",
    },
  ];

  const [cashoutRequests, setCashoutRequests] = useState([
    {
      id: 1,
      user: "user3",
      amount: 1000,
      phone: "0900332211",
      date: "2025-07-20",
      status: "Pending",
      receiptFile: null,
    },
  ]);

  const handleFileUpload = (id, file) => {
    const updated = cashoutRequests.map((req) =>
      req.id === id ? { ...req, receiptFile: file } : req
    );
    setCashoutRequests(updated);
  };

  const handleApproveCashout = (id) => {
    const updated = cashoutRequests.map((req) =>
      req.id === id ? { ...req, status: "Approved" } : req
    );
    setCashoutRequests(updated);
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
      <h2>Agent Dashboard</h2>

      {/* Deposit Requests */}
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
                  <td>{request.user}</td>
                  <td>{request.amount} ETB</td>
                  <td>{request.phone}</td>
                  <td>{request.date}</td>
                  <td>
                    <a href={request.receiptUrl} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                  </td>
                  <td style={{ color: request.status === "Pending" ? "orange" : "green" }}>
                    {request.status}
                  </td>
                  <td>
                    {request.status === "Pending" ? (
                      <>
                        <button
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
      </div>

      {/* Cashout Requests */}
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
                  <td>{request.phone}</td>
                  <td>{request.date}</td>
                  <td style={{ color: request.status === "Pending" ? "orange" : "green" }}>
                    {request.status}
                  </td>
                  <td>
                    {request.status === "Pending" ? (
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
                            handleApproveCashout(request.id);
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