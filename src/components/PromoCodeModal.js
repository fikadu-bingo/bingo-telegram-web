import React, { useState } from "react";
import "./PromoCodeModal.css";

const PromoCodeModal = ({ onClose, onVerify }) => {
  const [promoCode, setPromoCode] = useState("");

  const handleVerify = () => {
    onVerify(promoCode);
  };

  return (
    <div className="promo-modal-overlay">
      <div className="promo-modal-content">
        <h3>Apply Promotion <span className="optional">(Optional)</span></h3>
        <div className="promo-form">
          <input
            type="text"
            placeholder="Enter Code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
          <button onClick={handleVerify}>Apply Code</button>
        </div>
        <button className="promo-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default PromoCodeModal;