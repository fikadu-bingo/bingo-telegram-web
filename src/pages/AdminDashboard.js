import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const BACKEND_URL = 'https://bingo-server-rw7p.onrender.com';

  // 🔑 Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // 💾 Admin dashboard states
  const [promocode, setPromocode] = useState('');
  const [commission, setCommission] = useState(30);
  const [agentUsername, setAgentUsername] = useState('');
  const [agentPassword, setAgentPassword] = useState('');
  const [stats, setStats] = useState({});
  const [message, setMessage] = useState('');

  // 📌 Handle admin login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BACKEND_URL}/api/admin/login`, {
        username: adminUsername,
        password: adminPassword
      });
      if (res.data.success) {
        localStorage.setItem('adminToken', res.data.token); // store JWT
        setIsLoggedIn(true);
        fetchStats(); // load stats after login
      } else {
        alert(res.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check credentials.');
    }
  };

  // 🔄 Fetch system stats (after login)
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${BACKEND_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // ➕ Create promo code
  const handlePromoSubmit = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${BACKEND_URL}/api/promocode`,
        { code: promocode, commission },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Promo code created successfully');
      setPromocode('');
    } catch (error) {
      setMessage('Error creating promo code');
    }
  };

  // ➕ Create agent account
  const handleAgentSubmit = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${BACKEND_URL}/api/agent`,
        { username: agentUsername, password: agentPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Agent created successfully');
      setAgentUsername('');
      setAgentPassword('');
    } catch (error) {
      setMessage('Error creating agent');
    }
  };

  // 🚪 Show login form if not logged in
  if (!isLoggedIn) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '10px' }}>
            <label>Username:</label><br />
            <input
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Password:</label><br />
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'blue',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
            }}
          >
            Login
          </button>
        </form>
      </div>
    );
  }
  // 📊 Show dashboard if logged in
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* Promo Code Creation */}
      <div className="card">
        <h2>Create Promo Code</h2>
        <input
          type="text"
          value={promocode}
          placeholder="Enter promo code"
          onChange={(e) => setPromocode(e.target.value)}
        />
        <input
          type="number"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          placeholder="Commission %"
        />
        <button onClick={handlePromoSubmit}>Create Promo Code</button>
      </div>

      {/* Agent Account Creation */}
      <div className="card">
        <h2>Create Agent Account</h2>
        <input
          type="text"
          value={agentUsername}
          placeholder="Agent username"
          onChange={(e) => setAgentUsername(e.target.value)}
        />
        <input
          type="password"
          value={agentPassword}
          placeholder="Agent password"
          onChange={(e) => setAgentPassword(e.target.value)}
        />
        <button onClick={handleAgentSubmit}>Create Agent</button>
      </div>

      {/* System Stats */}
      <div className="card">
        <h2>System Overview</h2>
        <p><strong>Total Users:</strong> {stats.totalUsers}</p>
        <p><strong>Total Deposits:</strong> {stats.totalDeposits} ETB</p>
        <p><strong>Total Cashouts:</strong> {stats.totalCashouts} ETB</p>
        <p><strong>Active Promoters:</strong> {stats.promoters}</p>
      </div>

      {/* Message Display */}
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default AdminDashboard;