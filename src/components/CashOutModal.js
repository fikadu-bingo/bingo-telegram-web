import axios from "axios";
import React, { useState } from "react";
import CashOutSuccessModal from "./CashOutSuccessModal";

function CashOutModal({ onClose }) {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [receipt, setReceipt] = useState(null); // ✅ added receipt state
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ added loading state

  const handleConfirm = async () => {
    const parsedAmount = parseFloat(amount);
    const isPhoneValid = /^09\d{8}$/.test(phoneNumber);
    const telegram_id = localStorage.getItem("telegram_id");

    if (!telegram_id) {
      alert("User is not logged in properly. Please refresh the page.");
      return;
    }

    if (!parsedAmount || parsedAmount < 100 || parsedAmount > 2000) {
      alert("Amount must be between 100 and 2000 ETB.");
      return;
    }

    if (!isPhoneValid) {
      alert("Please enter a valid 10-digit Ethiopian phone number starting with 09.");
      return;
    }

    if (!receipt) {
      alert("Please upload your receipt.");
      return;
    }

    try {
      setLoading(true);

      // ------------------------------
      // ✅ Step 1: Upload receipt to Cloudinary
      // ------------------------------
      const formData = new FormData();
      formData.append("receipt", receipt);
      formData.append("type", "cashout"); // determines Cloudinary folder

      const uploadResponse = await axios.post(
        "https://bingo-server-rw7p.onrender.com/api/user/upload-receipt",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const receiptUrl = uploadResponse.data.url; // ✅ get Cloudinary URL

      // ------------------------------
      // ✅ Step 2: Send cashout data to backend
      // ------------------------------
      const response = await axios.post(
        "https://bingo-server-rw7p.onrender.com/api/user/cashout",
        {
          telegram_id,
          amount: parsedAmount,
          phone: phoneNumber,
          receiptUrl, // send the uploaded receipt URL
        }
      );

      if (response.data.success || response.data.message) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 3000);
      } else {
        alert("Cashout failed: " + response.data.message);
      }
    } catch (error) {
      console.error("Cashout error:", error);
      alert("Cashout failed. Please try again later.");
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
            {/* ------------------------------
                Receipt Upload Input
            ------------------------------ */}
            <div style={rowStyle}>
              <label style={labelStyle}>Upload Receipt:</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setReceipt(e.target.files[0])} // ✅ save file to state
                style={{ width: "45%" }}
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

// Styles (unchanged)
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