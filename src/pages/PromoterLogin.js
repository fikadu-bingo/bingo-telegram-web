import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PromoterLogin = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch("https://bingo-server-rw7p.onrender.com/api/promoter/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ promo_code: code }),
      });
      const data = await res.json();

      if (res.ok) {
       localStorage.setItem("promoterToken", data.token);
        navigate("/promoter-dashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Promoter Login</h2>
      <input
        placeholder="Enter your Promo Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ padding: 10, margin: 10 }}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};


export default PromoterLogin;
