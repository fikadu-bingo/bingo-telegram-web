import React, { useState } from "react";
import axios from "axios";
import "./TransferModal.css";

function TransferModal({ onClose, availableBalance = 200, onTransfer }) {
  const [receiverPhone, setReceiverPhone] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!receiverPhone || !transferAmount) {
      alert("Please fill all fields.");
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    if (amount > availableBalance) {
      alert("Insufficient balance");
      return;
    }

    try {
      setLoading(true);

      // Replace with actual logged-in user's telegram_id
      const senderTelegramId = localStorage.getItem("telegram_id");

      const res = await axios.post("/api/user/transfer", {
        sender_telegram_id: senderTelegramId,
        receiver_phone_number: receiverPhone,
        amount,
      });

      alert(res.data.message);

      // Update UI balance
      if (onTransfer) onTransfer(res.data.newBalance);

      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
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
          {transferAmount > availableBalance && (
            <p style={{ color: "red", fontSize: "12px" }}>Insufficient balance</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
          <button onClick={onClose} className="cancel-btn" disabled={loading}>
            Cancel
          </button>
          <button onClick={handleTransfer} className="confirm-btn" disabled={loading}>
            {loading ? "Processing..." : "Confirm Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransferModal;