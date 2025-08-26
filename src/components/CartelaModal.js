import React from "react";
import "./CartelaModal.css";

const CartelaModal = ({ isOpen, onClose, cartelaData }) => {
  if (!isOpen) return null; // Only render when modal is open

  const columnHeaders = ["B", "I", "N", "G", "O"];

  return (
    <div className="cartela-overlay" onClick={onClose}>
      <div className="cartela-modal" onClick={(e) => e.stopPropagation()}>
        {/* Column header row */}
        <div className="cartela-column-header">
          {columnHeaders.map((col, idx) => (
            <div key={idx} className="cartela-column-cell">
              {col}
            </div>
          ))}
        </div>

        {/* Bingo card grid (2D array) */}
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
  );
};

export default CartelaModal;