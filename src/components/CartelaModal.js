import React from "react";
import "./CartelaModal.css";

const CartelaModal = ({ isOpen, onClose, cartelaData, title }) => {
  if (!isOpen) return null; // Only render when modal is open

  return (
    <div className="cartela-overlay" onClick={onClose}>
      <div className="cartela-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="cartela-modal">
          {/* Cartela title bar */}
          {title && (
            <div className="cartela-title">
              <span>{title}</span>
              <button className="cartela-close-btn" onClick={onClose}>
                ×
              </button>
            </div>
          )}

          {/* Bingo card grid */}
          <div className="cartela-grid">
            {cartelaData.map((row, rowIdx) =>
              row.map((number, colIdx) => (
                <div key={`${rowIdx}-${colIdx}`} className="cartela-cell">
                  {number}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartelaModal;