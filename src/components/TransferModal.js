import React, { useState } from "react";
import "./TransferModal.css"; // Optional: if you want to add more styles

function TransferModal({ onClose, availableBalance = 200 }) {
  const [receiverPhone, setReceiverPhone] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  return (
    <div className="modal">
      <div className="modal-content">
        <h2 style={{ textAlign: "left", marginBottom: "20px" }}>Transfer</h2>

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

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#1a1a40",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              width: "48%"
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            style={{
              padding: "10px 20px",
              backgroundColor: "#00CFFF",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              width: "48%"
            }}
          >
            Verify Receiver
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransferModal;