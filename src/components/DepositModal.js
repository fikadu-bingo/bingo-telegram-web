import React, { useState } from "react";
import DepositSuccessModal from "./DepositSuccessModal";

function DepositModal({ onClose, onDeposit }) {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const telebirrNumber = "0934461362";

  const handleSubmit = (e) => {
    e.preventDefault();
    const depositAmount = parseFloat(amount);
    if (depositAmount < 10 || depositAmount > 1000) {
      alert("Amount must be between 10 and 1000 ETB.");
      return;
    }

    onDeposit(depositAmount);
    setShowSuccess(true); // Show success modal
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(telebirrNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000); // disappear after 1 sec
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Telebirr Logo */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src="/telebirr-logo.png"
            alt="Telebirr Logo"
            style={{ width: "80px", height: "80px", borderRadius: "12px" }}
          />
        </div>

        {/* Static Telebirr Number + Copy */}
        <div style={{ ...formRow, marginTop: "5px", position: "relative" }}>
          <label style={labelStyle}>Telebirr Number</label>
          <div style={copyContainerStyle}>
            <span style={{ color: "#007BFF", fontWeight: "bold" }}>{telebirrNumber}</span>
            <button type="button" onClick={handleCopy} style={copyButtonStyle}>
              📄
            </button>
            {copied && <span style={copiedTextStyle}>Copied</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount */}
          <div style={formRow}>
            <label style={labelStyle}>
              Amount<br /><small>(Min 10 ETB / Max 1000 ETB)</small>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100"
              required
              style={inputStyle}
            />
          </div>

          {/* Phone number */}
          <div style={formRow}>
            <label style={labelStyle}>Your Telebirr Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxx"
              required
              style={inputStyle}
            />
          </div>

          {/* Upload receipt */}
          <div style={formRow}>
            <label style={labelStyle}>
              Submit Your Receipt<br />
              <small>(.jpg, .png, .pdf — Max 10MB)</small>
            </label>
            <label htmlFor="file-upload" style={uploadBox}>
              +
              <input
                id="file-upload"
                type="file"
                accept=".jpg,.png,.pdf"
                onChange={(e) => setReceipt(e.target.files[0])}
                required
                style={{ display: "none" }}
              />
            </label>
          </div>

          <button type="submit" style={submitButtonStyle}>
            Confirm Deposit
          </button>
        </form>

        <button onClick={onClose} style={closeBtnStyle}>✖️</button>
      </div>

      {/* ✅ Deposit Success Modal */}
      {showSuccess && (
        <DepositSuccessModal
          onClose={() => {
            setShowSuccess(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}

export default DepositModal;

//
// === Styles ===
//
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};
const modalStyle = {
  background: "#fff",
  padding: "30px 20px",
  borderRadius: "15px",
  width: "90%",
  maxWidth: "420px",
  position: "relative",
  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
  fontFamily: "Arial, sans-serif",
};

const formRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "18px",
  gap: "10px",
};

const labelStyle = {
  flex: 1.2,
  fontWeight: "bold",
  fontSize: "14px",
  color: "#333",
};

const inputStyle = {
  flex: 1.8,
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const uploadBox = {
  flex: 1.8,
  height: "42px",
  background: "#eee",
  border: "2px dashed #aaa",
  color: "#333",
  borderRadius: "6px",
  textAlign: "center",
  fontSize: "24px",
  fontWeight: "bold",
  lineHeight: "40px",
  cursor: "pointer",
};

const submitButtonStyle = {
  marginTop: "25px",
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

const closeBtnStyle = {
  position: "absolute",
  top: "10px",
  right: "15px",
  background: "transparent",
  border: "none",
  fontSize: "20px",
  color: "#888",
  cursor: "pointer",
};

const copyContainerStyle = {
  flex: 1.8,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "#f5f5f5",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  position: "relative",
};

const copyButtonStyle = {
  background: "transparent",
  border: "none",
  fontSize: "18px",
  cursor: "pointer",
  color: "#007BFF",
};

const copiedTextStyle = {
  position: "absolute",
  top: "50%",
  right: "-50px",
  transform: "translateY(-50%)",
  fontSize: "12px",
  color: "#4CAF50",
  fontWeight: "bold",
};