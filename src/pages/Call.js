import React, { useState, useEffect } from "react"; import { useLocation, useNavigate } from "react-router-dom"; import { io } from "socket.io-client"; import logo from "../assets/logo.png"; import "./Call.css";

function Call() { const location = useLocation(); const navigate = useNavigate(); const { card, stake, gameId, cartelaNumber } = location.state || {};

const [calledNumbers, setCalledNumbers] = useState([]); const [currentNumber, setCurrentNumber] = useState(null); const [playerCard, setPlayerCard] = useState(card || []); const [countdown, setCountdown] = useState(50); const [gameStarted, setGameStarted] = useState(false); const [winner, setWinner] = useState(false); const [showPopup, setShowPopup] = useState(false); const [players, setPlayers] = useState(1); const [winAmount, setWinAmount] = useState("Br0");

const socket = io("http://localhost:5000");

useEffect(() => { if (!card) { alert("No card data found. Returning..."); navigate("/"); } }, [card, navigate]);

useEffect(() => { if (gameId) { socket.emit("joinGame", gameId); } return () => { socket.disconnect(); }; }, [gameId]);

useEffect(() => { socket.on("numberCalled", (number) => { setCurrentNumber(number); setCalledNumbers((prev) => [...prev, number]); });

socket.on("playerJoined", () => {
  setPlayers((prev) => prev + 1);
});

socket.on("gameWon", ({ userId }) => {
  console.log("Game won by:", userId);
});

return () => {
  socket.off("numberCalled");
  socket.off("playerJoined");
  socket.off("gameWon");
};

}, []);

useEffect(() => { if (countdown > 0 && !gameStarted) { const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000); return () => clearTimeout(timer); } else if (countdown === 0 && !gameStarted) { setGameStarted(true); } }, [countdown, gameStarted]);

useEffect(() => { let interval = null; if (gameStarted && !winner) { interval = setInterval(() => { setCalledNumbers((prev) => { if (prev.length >= 100) { clearInterval(interval); return prev; } let newNumber; do { newNumber = Math.floor(Math.random() * 100) + 1; } while (prev.includes(newNumber));

socket.emit("callNumber", { gameId, number: newNumber });
      setCurrentNumber(newNumber);
      return [...prev, newNumber];
    });
  }, 2000);
}
return () => {
  if (interval) clearInterval(interval);
};

}, [gameStarted, winner]);

useEffect(() => { const isMarked = (num, row, col) => { if (row === 2 && col === 2) return true; return calledNumbers.includes(num); };

let bingo = false;
for (let i = 0; i < 5; i++) {
  if (playerCard[i]?.every((num, j) => isMarked(num, i, j))) {
    bingo = true;
    break;
  }
}
if (!bingo) {
  for (let j = 0; j < 5; j++) {
    let colWin = true;
    for (let i = 0; i < 5; i++) {
      if (!isMarked(playerCard[i]?.[j], i, j)) {
        colWin = false;
        break;
      }
    }
    if (colWin) {
      bingo = true;
      break;
    }
  }
}
if (!bingo) {
  bingo = [0, 1, 2, 3, 4].every((i) => isMarked(playerCard[i]?.[i], i, i));
}
if (!bingo) {
  bingo = [0, 1, 2, 3, 4].every((i) => isMarked(playerCard[i]?.[4 - i], i, 4 - i));
}

if (bingo && !winner) {
  setWinner(true);
  const totalWin = stake * players * 0.8;
  setWinAmount(`Br${totalWin}`);
  setShowPopup(true);
  socket.emit("bingoWin", { gameId, userId: "YourUserId" });
  setTimeout(() => {
    setShowPopup(false);
    setWinner(false);
  }, 15000);
}

}, [calledNumbers, playerCard, stake, players, winner, socket, gameId]);

useEffect(() => { const totalWin = stake * players * 0.8; setWinAmount(`Br${totalWin}`); }, [players, stake]);

const lastThree = calledNumbers.slice(-3).reverse();

return ( <div className="container"> <div className="logo-container"> <img src={logo} alt="Logo" className="logo" /> </div>

<div className="top-menu">
    <div>Players: {players}</div>
    <div>Bet: Br{stake}</div>
    <div>Win: {winAmount}</div>
    <div>Call: {calledNumbers.length}</div>
  </div>
  <div className="main-content">
    <div className="board">
      <div className="bingo-header-row">
        {["B", "I", "N", "G", "O"].map((letter) => (
          <div key={letter} className={`bingo-letter bingo-${letter.toLowerCase()}`}>{letter}</div>
        ))}
      </div>

      <div className="board-grid">
        {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
          <div
            key={num}
            className={`number-box ${calledNumbers.includes(num) ? "marked" : "unmarked"}`}
          >
            {num}
          </div>
        ))}
      </div>
    </div>

    <div className="cartela">
      {countdown !== null && countdown > 0 && !gameStarted && (
        <div className="circle">
          <div style={{ fontSize: "12px" }}>Wait</div>
          <div>{countdown}</div>
        </div>
      )}

      <div className="last-three">
        {lastThree.map((num, idx) => (
          <div key={idx}>{num}</div>
        ))}
      </div>

      <div className="current-number">{currentNumber || "--"}</div>
      <h4 style={{ textAlign: "center" }}>Cartela: #{cartelaNumber}</h4>

      <div className="bingo-header-row">
        {["B", "I", "N", "G", "O"].map((letter) => (
          <div key={letter} className={`bingo-letter bingo-${letter.toLowerCase()}`}>{letter}</div>
        ))}
      </div>

      <div className="cartela-grid">
        {playerCard.flat().map((num, idx) => {
          const row = Math.floor(idx / 5);
          const col = idx % 5;
          const isCenter = row === 2 && col === 2;
          const marked = isCenter || calledNumbers.includes(num);
          return (
            <div
              key={idx}
              className={`number-box ${marked ? "marked" : "unmarked"}`}
            >
              {isCenter ? "*" : num}
            </div>
          );
        })}
      </div>

       <div className="buttons">
            <button
              onClick={() => alert("Bingo button logic (coming soon)!")}
              className="action-btn"
            >
              🎉 Bingo
            </button>
        <button onClick={() => navigate("/")} className="action-btn">
          🚪 Leave
        </button>
      </div>
    </div>
  </div>

  {showPopup && (
    <div className="popup">
      <div className="popup-content">
        🎉 Cartela #{cartelaNumber} Won! 🎉
        <div style={{ marginTop: "20px" }}></div>
        <button onClick={() => setShowPopup(false)} className="action-btn" style={{ background: "#4CAF50" }}>
          OK
        </button>
      </div>
    </div>
  )}
</div>

); }

export default Call;