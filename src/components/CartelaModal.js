import React from "react";
import "./CartelaModal.css";

const CartelaModal = ({ isOpen, onClose, cartelaData }) => {
  if (!isOpen) return null;

  const columnHeaders = ["B", "I", "N", "G", "O"];

  return (
    <div className="cartela-overlay" onClick={onClose}>
      <div className="cartela-modal" onClick={(e) => e.stopPropagation()}>
        {/* Column header */}
        <div className="cartela-column-header">
          {columnHeaders.map((col, idx) => (
            <div key={idx} className="cartela-column-cell">{col}</div>
          ))}
        </div>

        {/* Cartela numbers */}
        <div className="cartela-grid">
          {cartelaData.map((number, idx) => (
            <div key={idx} className="cartela-cell">
              {number !== 0 ? number : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CartelaModal;