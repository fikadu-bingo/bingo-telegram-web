// src/components/CashOutSuccessModal.js
import React, { useEffect } from "react";

function CashOutSuccessModal() {
  useEffect(() => {
    const timer = setTimeout(() => {}, 3000); // Reserved for future use
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="modal">
      <div className="modal-content" style={{ textAlign: "center", paddingTop: "30px" }}>
        <img
          src="/telebirr-logo.png"
          alt="Telebirr"
          style={{ width: "80px", marginBottom: "20px" }}
        />
        <h3 style={{ color: "#4CAF50" }}>Request Created Successfully</h3>
      </div>
    </div>
  );
}

export default CashOutSuccessModal;