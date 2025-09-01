import React, { useState } from "react";
import axios from "axios";
import "./TransferModal.css"; // keep your existing modal styles

const TransferModal = ({ isOpen, onClose, senderId }) => {
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  if (!isOpen) return null;

  const handleTransfer = async () => {
    try {
      const res = await axios.post("/api/user/transfer", {
        senderId,
        receiverId,
        amount: parseFloat(amount),
      });
      if (res.data.success) {
        setError("");
        setSuccessOpen(true);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Transfer failed");
    }
  };

  return (
    <>
      {/* =============== Transfer Modal =============== */}
      <div className="transfer-overlay">
        <div className="transfer-modal">
          <h2>Transfer Balance</h2>
          <input
            type="text"
            placeholder="Receiver Phone or Telegram ID"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <div className="btn-group">
            <button onClick={handleTransfer}>Confirm</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>

      {/* =============== Success Modal =============== */}
      {successOpen && (
        <div className="success-overlay">
          <div className="success-modal">
            <h2 className="success-title">✅ Success</h2>
            <p className="success-message">Transfer Completed Successfully</p>
            <button
              className="success-btn"
              onClick={() => {
                setSuccessOpen(false);
                onClose(); // close TransferModal too
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TransferModal;