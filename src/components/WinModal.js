import React from "react";
import "./WinModal.css";

function WinModal({ username, amount, cartela, onPlayAgain, cartelaNumber }) {
  return (
    <div className="win-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="win-title">
      <div className="win-modal">
        <h1 id="win-title" className="win-title">🎉 BINGO!</h1>
        <p className="win-subtitle">{username ?? "Player"} has won the game!</p>
        <p className="win-amount">Prize: {amount != null ? `${amount} Br` : "?"}</p>
        <p className="win-cartela-number">Cartela: #{cartelaNumber ?? "?"}</p>

        {/* BINGO Header Row */}
        <div className="bingo-header-row-modal" aria-hidden="true">
          <div className="bingo-letter-modal bingo-b-modal">B</div>
          <div className="bingo-letter-modal bingo-i-modal">I</div>
          <div className="bingo-letter-modal bingo-n-modal">N</div>
          <div className="bingo-letter-modal bingo-g-modal">G</div>
          <div className="bingo-letter-modal bingo-o-modal">O</div>
        </div>

        {/* Cartela Grid */}
        {cartela && cartela.length > 0 ? (
          <div className="win-cartela-grid">
            {cartela.map((row, rowIndex) =>
              row.map(({ num, marked, isCenter }, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`cartela-number ${marked ? "marked" : ""} ${
                    isCenter ? "center" : ""
                  }`}
                >
                  {isCenter ? "*" : num}
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="no-card-text">Card not available</p>
        )}

        {/* Play Again Button */}
        <button
          className="play-again-button"
          onClick={onPlayAgain}
          aria-label="Play again"
        >
          🔁 Play Again
        </button>
      </div>
    </div>
  );
}

export default WinModal;