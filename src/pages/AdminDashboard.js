import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css'; // optional for styling

const AdminDashboard = () => {
  const BACKEND_URL='https://bingo-server-rw7p.onrender.com';
  // 🔧 State declarations
  const [promocode, setPromocode] = useState('');
  const [commission, setCommission] = useState(30);
  const [agentUsername, setAgentUsername] = useState('');
  const [agentPassword, setAgentPassword] = useState('');
  const [stats, setStats] = useState({});
  const [message, setMessage] = useState('');

  // 🔄 Fetch system stats on load
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('https://bingo-server-rw7p.onrender.com//api/admin/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePromoSubmit = async () => {
    try {
      await axios.post('https://bingo-server-rw7p.onrender.com//api/promocode', { code: promocode, commission });
      setMessage('Promo code created successfully');
      setPromocode('');
    } catch (error) {
      setMessage('Error creating promo code');
    }
  };

  const handleAgentSubmit = async () => {
    try {
      await axios.post('https://bingo-server-rw7p.onrender.com/api/agent', { username: agentUsername, password: agentPassword });
      setMessage('Agent created successfully');
      setAgentUsername('');
      setAgentPassword('');
    } catch (error) {
      setMessage('Error creating agent');
    }
  };

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