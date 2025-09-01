import React, { useState } from "react";
import axios from "axios";
import "./TransferModal.css";
import SuccessModal from "./SuccessModal";

function TransferModal({ onClose, availableBalance = 0, onTransfer }) {
  const [receiverPhone, setReceiverPhone] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
const [successMessage, setSuccessMessage] = useState("");

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

      const senderTelegramId = localStorage.getItem("telegram_id");
      if (!senderTelegramId) {
        alert("User not logged in.");
        return;
      }

      // Full backend URL
      const res = await axios.post(
        "https://bingo-server-rw7p.onrender.com/api/user/transfer",
        {
          sender_telegram_id: senderTelegramId,
          receiver_phone_number: receiverPhone,
          amount,
        }
      );
setSuccessMessage(res.data.message);
setSuccessOpen(true);

      if (onTransfer) {
        onTransfer(res.data.newBalance); // update frontend balance
        localStorage.setItem("balance", res.data.newBalance);
      }

      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

return (
  <>
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

    {/* Success Modal */}
    <SuccessModal
      isOpen={successOpen}
      onClose={() => setSuccessOpen(false)}
      message={successMessage}
    />
  </>
);
}

export default TransferModal;