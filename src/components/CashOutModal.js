import axios from "axios";
import React, { useState } from "react";
import CashOutSuccessModal from "./CashOutSuccessModal";

function CashOutModal({ onClose }) {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const parsedAmount = parseFloat(amount);
    const isPhoneValid = /^09\d{8}$/.test(phoneNumber);
    const telegram_id = localStorage.getItem("telegram_id");

    if (!telegram_id) {
      alert("User is not logged in properly. Please refresh the page.");
      return;
    }
    if (!(parsedAmount >= 100 && parsedAmount <= 2000)) {
      alert("Amount must be between 100 and 2000 ETB.");
      return;
    }
    if (!isPhoneValid) {
      alert("Please enter a valid 10-digit Ethiopian phone number starting with 09.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "https://bingo-server-rw7p.onrender.com/api/user/cashout",
        {
          telegram_id,
          amount: parsedAmount,
          phone_number: phoneNumber,
        }
      );

      if (response.data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 3000);
      } else {
        alert("Cashout failed: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Cashout error:", error);
      alert(error.response?.data?.message || "Cashout failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!showSuccess && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <button onClick={onClose} style={closeBtnStyle}>✖️</button>

            <img
              src="/telebirr-logo.png"
              alt="Telebirr"
              style={{ width: 80, display: "block", margin: "20px auto" }}
            />

            <div style={rowStyle}>
              <label style={labelStyle}>Amount:</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                style={inputBoxStyle}
              />
            </div>

            <div style={{ fontSize: 12, marginBottom: 10, color: "#666", marginLeft: 95 }}>
              (Min 100 ETB / Max 2000 ETB)
            </div>

            <div style={rowStyle}>
              <label style={labelStyle}>Your Telebirr Number:</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09xxxxxxxx"
                style={inputBoxStyle}
              />
            </div>

            <button onClick={handleConfirm} style={submitButtonStyle} disabled={loading}>
              {loading ? "Submitting..." : "CONFIRM"}
            </button>
          </div>
        </div>
      )}

      {showSuccess && <CashOutSuccessModal />}
    </>
  );
}

export default CashOutModal;

// Styles
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle = {
  background: "#fff",
  padding: 30,
  borderRadius: 12,
  width: "90%",
  maxWidth: 400,
  color: "#333",
  position: "relative",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
};

const closeBtnStyle = {
  position: "absolute",
  right: 15,
  top: 10,
  fontSize: 22,
  fontWeight: "bold",
  cursor: "pointer",
  color: "#999",
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 15,
};

const labelStyle = {
  width: "50%",
  fontWeight: "bold",
  fontSize: 14,
};
const inputBoxStyle = {
  width: "45%",
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14,
};

const submitButtonStyle = {
  marginTop: 20,
  width: "100%",
  background: "#4CAF50",
  color: "white",
  border: "none",
  padding: 12,
  borderRadius: 6,
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer",
};