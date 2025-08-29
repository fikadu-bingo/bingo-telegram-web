import React from "react";
import "./CartelaModal.css";

const CartelaModal = ({ isOpen, onClose, cartelaData, title }) => {
  if (!isOpen) return null;

  // Extract cartela number from title, e.g., "Cartela #7" -> 7
  const cartelaNumber = title ? parseInt(title.split("#")[1], 10) : null;

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
              row.map((number, colIdx) => {
                // Show the number itself if it's the cartela number
                // Otherwise, you can implement "*" for selected numbers if needed
                const displayValue = number === cartelaNumber ? number : number; // Replace with * if you have selection logic

                return (
                  <div key={`${rowIdx}-${colIdx}`} className="cartela-modal-cell">
                    {displayValue}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartelaModal;