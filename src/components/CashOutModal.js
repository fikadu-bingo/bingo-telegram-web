import React, { useState } from "react";
import CashOutSuccessModal from "./CashOutSuccessModal";

function CashOutModal({ onClose }) {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = () => {
    const parsedAmount = parseFloat(amount);
    const isPhoneValid = /^09\d{8}$/.test(phoneNumber);

    if (!parsedAmount || parsedAmount < 100 || parsedAmount > 2000) {
      alert("Amount must be between 100 and 2000 ETB.");
      return;
    }

    if (!isPhoneValid) {
      alert("Please enter a valid 10-digit Ethiopian phone number starting with 09.");
      return;
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 3000);
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
              style={{ width: "80px", display: "block", margin: "20px auto" }}
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

            <div style={{ fontSize: "12px", marginBottom: "10px", color: "#666", marginLeft: "95px" }}>
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

            <button onClick={handleConfirm} style={submitButtonStyle}>
              CONFIRM
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
  padding: "30px",
  borderRadius: "12px",
  width: "90%",
  maxWidth: "400px",
  color: "#333",
  position: "relative",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
};

const closeBtnStyle = {
  position: "absolute",
  right: "15px",
  top: "10px",
  fontSize: "22px",
  fontWeight: "bold",
  cursor: "pointer",
  color: "#999",
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "15px",
};

const labelStyle = {
  width: "50%",
  fontWeight: "bold",
  fontSize: "14px",
};

const inputBoxStyle = {
  width: "45%",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const submitButtonStyle = {
  marginTop: "20px",
  width: "100%",
  background: "#4CAF50",
  color: "white",
  border: "none",
  padding: "12px",
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};