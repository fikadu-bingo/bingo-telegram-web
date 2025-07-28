import React, { useState } from "react";
import axios from "axios";
import DepositSuccessModal from "./DepositSuccessModal";
import "./DepositModal.css";
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
  setLoading(true);

  const depositAmount = parseFloat(amount);
  if (depositAmount < 10 || depositAmount > 1000) {
    alert("Amount must be between 10 and 1000 ETB.");
    setLoading(false);
    return;
  }

  if (!receipt) {
    alert("Please upload your receipt.");
    setLoading(false);
    return;
  }

  const formData = new FormData();
  formData.append("amount", amount);
  formData.append("phone", phone);
  formData.append("receipt", receipt); // ✅ FIXED HERE

  try {
    const response = await axios.post(
      "https://bingo-server-rw7p.onrender.com/api/user/deposit",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("Deposit success:", response.data);
    setShowSuccess(true); // Show success modal
  } catch (error) {
    console.error("Deposit error:", error.response?.data || error.message);
    alert("Deposit failed. Please try again.");
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
    <>
      <div className="modal">
        <div className="modal-content">
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <img
              src="/telebirr-logo.png"
              alt="Telebirr Logo"
              style={{ width: "80px", height: "80px", borderRadius: "12px" }}
            />
          </div>

          {/* Telebirr Number (copyable) */}
          <div
            style={{
              marginBottom: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label><strong>Telebirr Number</strong></label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#007BFF", fontWeight: "bold" }}>{telebirrNumber}</span>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                }}
              >
                📄
              </button>
              {copied && <span style={{ fontSize: "12px", color: "green" }}>Copied</span>}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Amount Input */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <label>Amount (Min 10 ETB / Max 1000 ETB)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
                required
                style={{ width: "150px", padding: "6px" }}
              />
            </div>

            {/* Phone Number Input */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}>
              <label>Your Telebirr Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                required
                style={{ width: "150px", padding: "6px" }}
              />
            </div>

            {/* Receipt Upload Input */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <label>Upload Your Receipt</label>
              <input
                type="file"
                accept=".jpg,.png,.pdf"
                onChange={(e) => setReceipt(e.target.files[0])}
                required
                style={{ width: "150px" }}
              />
            </div>

            {/* Confirm Button */}
            <button type="submit" disabled={loading} style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#007BFF",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}>
              {loading ? "Submitting..." : "Confirm Deposit"}
            </button>
          </form>

          {/* Close Button */}
          <button onClick={onClose} className="close">✖️</button>
        </div>
      </div>

      {showSuccess && (
        <DepositSuccessModal
          onClose={() => {
            setShowSuccess(false);
            onClose();
          }}
        />
      )}
    </>
  );
}

export default DepositModal;
