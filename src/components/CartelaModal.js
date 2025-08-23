import React from "react";
import "./CartelaModal.css";

function CartelaModal({ show, onClose, cartelaId, card }) {
  if (!show) return null;

  return (
    <div className="cartela-overlay">
      <div className="cartela-modal">
        <div className="cartela-header">
          <span>Cartela #{cartelaId}</span>
          <button className="delete-btn" onClick={onClose}>🗑</button>
        </div>

        <div className="cartela-grid">
          {card.map((row, rowIndex) => (
            <div key={rowIndex} className="cartela-row">
              {row.map((num, colIndex) => (
                <div key={colIndex} className="cartela-cell">
                  {num === "★" ? <span className="free-star">★</span> : num}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CartelaModal;