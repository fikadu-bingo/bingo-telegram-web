import React from "react";
import "./CartelaModal.css";

function CartelaModal({ show, onClose, cartelaId, card }) {
  if (!show) return null;

  return (
    <div className="cartela-overlay" onClick={onClose}>
      <div
        className="cartela-modal"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="cartela-header">
          <span>Cartela #{cartelaId}</span>
          <button className="delete-btn" onClick={onClose}>✖️</button>
        </div>

        <div className="cartela-grid">
          {card.flat().map((num, index) => (
            <div key={index} className="cartela-cell">
              {num === "★" ? <span className="free-star">★</span> : num}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CartelaModal;
