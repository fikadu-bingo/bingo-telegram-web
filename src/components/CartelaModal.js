import React from "react";
import "./CartelaModal.css";

const CartelaModal = ({ isOpen, onClose, cartelaData, title }) => {
  if (!isOpen) return null;

  return (
    <div className="cartela-overlay" onClick={onClose}>
      <div className="cartela-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="cartela-modal">
          {title && (
            <div className="cartela-titles">
              <span>{title}</span>
              <button className="cartela-close-btn" onClick={onClose}>
                ×
              </button>
            </div>
          )}

          <div className="cartela-modal-grid">
            {cartelaData.map((row, rowIdx) =>
              row.map((number, colIdx) => (
                <div key={`${rowIdx}-${colIdx}`} className="cartela-modal-cell">
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