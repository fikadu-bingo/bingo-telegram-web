import React, { useState } from "react";
import axios from "axios";
import DepositSuccessModal from "./DepositSuccessModal";

function DepositModal({ onClose }) {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const telebirrNumber = "0934461362";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const depositAmount = parseFloat(amount);
    if (depositAmount < 10 || depositAmount > 1000) {
      alert("Amount must be between 10 and 1000 ETB.");
      return;
    }

    if (!receipt) {
      alert("Please upload your receipt.");
      return;
    }

    const formData = new FormData();
    formData.append("amount", depositAmount);
    formData.append("phone", phone);
    formData.append("receipt", receipt);

    try {
      setLoading(true);
      await axios.post("https://bingo-server-rw7p.onrender.com/api/deposit", formData);
      setShowSuccess(true);
    } catch (err) {
      alert("Failed to submit deposit. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(telebirrNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src="/telebirr-logo.png"
            alt="Telebirr Logo"
            style={{ width: "80px", height: "80px", borderRadius: "12px" }}
          />
        </div>

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

          <button type="submit" style={submitButtonStyle} disabled={loading}>
            {loading ? "Submitting..." : "Confirm Deposit"}
          </button>
        </form>

        <button onClick={onClose} style={closeBtnStyle}>✖️</button>
      </div>

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

// Styles (same as your original code)...
const overlayStyle = { /* same */ };
const modalStyle = { /* same */ };
const formRow = { /* same */ };
const labelStyle = { /* same */ };
const inputStyle = { /* same */ };
const uploadBox = { /* same */ };
const submitButtonStyle = { /* same */ };
const closeBtnStyle = { /* same */ };
const copyContainerStyle = { /* same */ };
const copyButtonStyle = { /* same */ };
const copiedTextStyle = { /* same */ };