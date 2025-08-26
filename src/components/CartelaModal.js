import React from "react";
import "./SampleCartelaModal.css";

const SampleCartelaModal = ({ isOpen, onClose, cartelaData }) => {
  if (!isOpen) return null;

  const columnHeaders = ["B", "I", "N", "G", "O"];

  return (
    <div className="sample-overlay" onClick={onClose}>
      <div className="sample-modal" onClick={(e) => e.stopPropagation()}>
        {/* Column header */}
        <div className="sample-column-header">
          {columnHeaders.map((col, idx) => (
            <div key={idx} className="sample-column-cell">{col}</div>
          ))}
        </div>

        {/* Cartela numbers */}
        <div className="sample-grid">
          {cartelaData.map((number, idx) => (
            <div key={idx} className="sample-cell">
              {number !== 0 ? number : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SampleCartelaModal;