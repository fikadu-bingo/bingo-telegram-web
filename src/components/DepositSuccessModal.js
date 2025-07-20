import React, { useEffect } from "react";

function DepositSuccessModal({ onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // Auto-close after 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          padding: "30px 20px",
          maxWidth: "90%",
          width: "350px",
          textAlign: "center",
        }}
      >
        <img
          src="/telebirr-logo.png"
          alt="Telebirr"
          style={{ width: "80px", marginBottom: "20px" }}
        />
        <h3 style={{ color: "#4CAF50" }}>Your Deposit Request Submitted Successfully</h3>
        <button
          onClick={onClose}
          style={{
            marginTop: "25px",
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default DepositSuccessModal;