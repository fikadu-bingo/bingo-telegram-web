import React, { useState, useEffect } from "react";
import axios from "axios";

function PromoterDashboard() {
  const BACKEND_URL = "https://bingo-server-rw7p.onrender.com";

  // State for login
  const [promoCode, setPromoCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState("");

  // State for promoter data
  const [stats, setStats] = useState({});
  const [cashouts, setCashouts] = useState([]);
  const [message, setMessage] = useState("");

  const [cashoutAmount, setCashoutAmount] = useState("");

  // ✅ Login handler
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${BACKEND_URL}/api/promoter/login`, {
        promo_code: promoCode,
      });

      const authToken = res.data.token;
      localStorage.setItem("promoterToken", authToken);
      setToken(authToken);
      setIsLoggedIn(true);
      setMessage("");

      // ✅ Fetch data immediately after login
      fetchDashboard(authToken);
    } catch (err) {
      setMessage("Invalid Promo Code");
    }
  };

  // ✅ Fetch dashboard data
  const fetchDashboard = async (authToken = token) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/promoter/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setStats(res.data.stats);
      setCashouts(res.data.cashouts);
    } catch (err) {
      console.error("Failed to fetch promoter data", err);
    }
  };

  // ✅ Auto-login if token is saved
  useEffect(() => {
    const savedToken = localStorage.getItem("promoterToken");
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
      fetchDashboard(savedToken); // ✅ Load dashboard
    }
  }, []);

  // ✅ Handle cashout request
  const handleCashout = async () => {
    if (!cashoutAmount || cashoutAmount <= 0) {
      setMessage("Please enter a valid amount");
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/api/promoter/request-cashout`,
        { amount: cashoutAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Cashout request submitted!");
      setCashoutAmount("");
      fetchDashboard();
    } catch (err) {
      setMessage("Cashout request failed");
    }
  };

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("promoterToken");
    setIsLoggedIn(false);
    setToken("");
    setStats({});
    setCashouts([]);
    setPromoCode("");
  };

  // ✅ Login screen
  if (!isLoggedIn) {
    return (
      <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
        <h2>Promoter Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter your promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            required
          />
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
        {message && <p style={{ color: "red" }}>{message}</p>}
      </div>
    );
  }

  // ✅ Dashboard screen
  return (
    <div style={{ padding: "20px" }}>
      {/* ✅ Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          float: "right",
          padding: "6px 12px",
          background: "red",
          color: "white",
          border: "none",
          borderRadius: "5px",
          marginBottom: "10px",
        }}
      >
        Logout
      </button>

      <h2>Welcome, {stats.promo_code}</h2>
      <h3>Your Commission Balance: {stats.balance} ETB</h3>
      <p>Total Referrals: {stats.total_referrals}</p>
      {/* ✅ Cashout Request */}
      <div
        style={{ marginTop: "20px", border: "1px solid #ccc", padding: "15px" }}
      >
        <h3>Request Cashout</h3>
        <input
          type="number"
          placeholder="Enter amount"
          value={cashoutAmount}
          onChange={(e) => setCashoutAmount(e.target.value)}
          style={{ padding: "8px", width: "200px", marginRight: "10px" }}
        />
        <button
          onClick={handleCashout}
          style={{
            padding: "8px 15px",
            background: "green",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Request
        </button>
      </div>

      {/* ✅ Cashout History */}
      <div style={{ marginTop: "30px" }}>
        <h3>Cashout History</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {cashouts.map((c) => (
              <tr key={c.id}>
                <td>{c.amount} ETB</td>
                <td>{c.status}</td>
                <td>{c.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Success/Error Message */}
      {message && (
        <p style={{ color: "green", marginTop: "10px" }}>{message}</p>
      )}
    </div>
  );
}

export default PromoterDashboard;