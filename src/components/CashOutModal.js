import React, { useState } from "react";
import CashOutSuccessModal from "./CashOutSuccessModal";

function CashOutModal({ onClose }) {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = () => {
    if (!amount || !phoneNumber) return;

    setShowSuccess(true);

    // Wait 3s, then close both modals
    setTimeout(() => {
      setShowSuccess(false);
      onClose(); // This closes CashOutModal
    }, 3000);
  };

  return (
    <>
      {!showSuccess && (
        <div className="modal">
          <div className="modal-content">
            <img
              src="/telebirr-logo.png"
              alt="Telebirr"
              style={{ width: "80px", display: "block", margin: "20px auto" }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
                alignItems: "center",
              }}
            >
              <label><strong>Amount (Min 100 ETB / Max 2000 ETB):</strong></label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                style={{ padding: "5px", width: "120px" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
                alignItems: "center",
              }}
            >
              <label><strong>Your Telebirr Number:</strong></label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09XXXXXXXX"
                style={{ padding: "5px", width: "150px" }}
              />
            </div>

            <button
              onClick={handleConfirm}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "green",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              CONFIRM
            </button>
          </div>
        </div>
      )}

      {showSuccess && <CashOutSuccessModal />}
    </>
  );
}

export default CashOutModal;