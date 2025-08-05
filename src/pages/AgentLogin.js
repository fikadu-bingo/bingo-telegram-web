import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AgentLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post('https://bingo-server-rw7p.onrender.com/api/agent/login', {
        username,
        password
      });
      localStorage.setItem('agentToken', res.data.token);
      navigate('/agent-dashboard'); // ✅ Redirect to dashboard
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Agent Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      /><br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br />
      <button onClick={handleLogin}>Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AgentLogin;