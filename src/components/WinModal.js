import React from "react";
import "./WinModal.css";

function WinModal({ username, amount, cartela, markedNumbers = [], onPlayAgain, cartelaNumber }) {
  return (
    <div className="win-modal-overlay">
      <div className="win-modal">
        <h1 className="win-title">🎉 BINGO!</h1>
        <p className="win-subtitle">{username || "Player"} has won the game!</p>
        <p className="win-amount">Prize: {amount || "?"}</p>
        <p className="win-cartela-number">
          Cartela: #{cartelaNumber || "?"}
        </p>

        {/* BINGO Header Row */}
        <div className="bingo-header-row-modal">
          <div className="bingo-letter-modal bingo-b-modal">B </div>
          <div className="bingo-letter-modal bingo-i-modal">I </div>
          <div className="bingo-letter-modal bingo-n-modal">N </div>
          <div className="bingo-letter-modal bingo-g-modal">G </div>
          <div className="bingo-letter-modal bingo-o-modal">O </div>
        </div>

        {/* Cartela Grid */}
        {cartela && cartela.length > 0 ? (
          <div className="win-cartela-grid">
            {cartela.map((row, rowIndex) =>
              row.map((num, colIndex) => {
                const isCenter = rowIndex === 2 && colIndex === 2;
                const isMarked = isCenter || markedNumbers.includes(num);
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`cartela-number ${isMarked ? "marked" : "unmarked"}`}
                  >
                    {isCenter ? "*" : num}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <p className="no-card-text">Card not available</p>
        )}

        {/* Play Again Button */}
        <button className="play-again-button" onClick={onPlayAgain}>
          🔁 Play Again
        </button>
      </div>
    </div>
  );
}

export default WinModal;