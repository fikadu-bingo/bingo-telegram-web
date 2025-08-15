import React, { useState } from "react";
import axios from "axios";
import DepositSuccessModal from "./DepositSuccessModal";
import "./DepositModal.css";

const telegram_id = localStorage.getItem("telegram_id");

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
    if (!telegram_id) {
      alert("User not logged in. Please refresh.");
      return;
    }

    const depositAmount = parseFloat(amount);
    if (!(depositAmount >= 10 && depositAmount <= 1000)) {
      alert("Amount must be between 10 and 1000 ETB.");
      return;
    }
    if (!receipt) {
      alert("Please upload your receipt.");
      return;
    }

    setLoading(true);
    try {
      // 1) Upload receipt to Cloudinary
      const formData = new FormData();
      formData.append("receipt", receipt);
      formData.append("type", "deposit");

      const uploadRes = await axios.post(
        "https://bingo-server-rw7p.onrender.com/api/user/upload-receipt",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const receiptUrl = uploadRes.data.url;

      // 2) Send deposit request with Cloudinary URL
      await axios.post(
        "https://bingo-server-rw7p.onrender.com/api/user/deposit",
        { amount: depositAmount, phone, receiptUrl },
        { headers: { telegram_id } } // backend expects telegram_id in header
      );

      setShowSuccess(true);
    } catch (err) {
      console.error("Deposit error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Deposit failed. Please try again.");
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
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <img
              src="/telebirr-logo.png"
              alt="Telebirr Logo"
              style={{ width: 80, height: 80, borderRadius: 12 }}
            />
          </div>

          {/* Telebirr Number */}
          <div style={{ marginBottom: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label><strong>Telebirr Number</strong></label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#007BFF", fontWeight: "bold" }}>{telebirrNumber}</span>
              <button type="button" onClick={handleCopy} style={{ cursor: "pointer", background: "none", border: "none", fontSize: 18 }}>
                📄
              </button>
              {copied && <span style={{ fontSize: 12, color: "green" }}>Copied</span>}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Amount */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <label>Amount (Min 10 ETB / Max 1000 ETB)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
                required
                style={{ width: 150, padding: 6 }}
              />
            </div>

            {/* Phone */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <label>Your Telebirr Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                required
                style={{ width: 150, padding: 6 }}
              />
            </div>

            {/* Receipt */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <label>Upload Your Receipt</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setReceipt(e.target.files[0])}
                required
                style={{ width: 150 }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: 10, backgroundColor: "#007BFF", color: "white",
                border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer",
              }}
            >
              {loading ? "Submitting..." : "Confirm Deposit"}
            </button>
          </form>

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