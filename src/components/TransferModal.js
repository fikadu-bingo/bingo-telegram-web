import React, { useState } from "react";
import "./TransferModal.css";

function TransferModal({ onClose, availableBalance = 200, onTransfer }) {
  const [receiverPhone, setReceiverPhone] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const handleTransfer = () => {
    if (!receiverPhone || !transferAmount) {
      alert("Please fill all fields.");
      return;
    }
    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      alert("Enter a valid amount.");
      return;
    }
    onTransfer(amount, receiverPhone);
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2 style={{ textAlign: "left", marginBottom: "20px" }}>Transfer</h2>

        {/* Receiver */}
        <div style={{ marginBottom: "15px" }}>
          <label><strong>Receiver Phone Number</strong></label>
          <input
            type="tel"
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
            placeholder="Enter phone number"
            required
          />
        </div>

        {/* Amount */}
        <div style={{ marginBottom: "10px" }}>
          <label><strong>Amount To Transfer</strong></label>
          <input
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />
          <p style={{ fontSize: "12px", color: "#ccc", marginTop: "5px" }}>
            Available: Br.{availableBalance}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={handleTransfer} className="confirm-btn">
            Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ Default export (so you can import TransferModal without braces)
export default TransferModal;