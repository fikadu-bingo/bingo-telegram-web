import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import logo from "../assets/logo.png"; // Adjust path if needed

function Call() {
  const location = useLocation();
  const navigate = useNavigate();
  const { card, stake, wallet, gameId, cartelaNumber } = location.state || {};

  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [playerCard, setPlayerCard] = useState(card || []);
  const [countdown, setCountdown] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(false);
  const [winAmount, setWinAmount] = useState("-");
  const [showPopup, setShowPopup] = useState(false);

  // 🔥 Connect socket
  const socket = io("http://localhost:5000");

  useEffect(() => {
    if (!card) {
      alert("No card data found. Returning...");
      navigate("/");
    }
  }, [card, navigate]);

  useEffect(() => {
    if (gameId) {
      socket.emit("joinGame", gameId);
      console.log("Joined game room:", gameId);
    }

    return () => {
      socket.disconnect();
      console.log("Socket disconnected");
    };
  }, [gameId]);

  useEffect(() => {
    socket.on("numberCalled", (number) => {
      setCurrentNumber(number);
      setCalledNumbers((prev) => [...prev, number]);
    });

    socket.on("playerJoined", (data) => {
      console.log("Player joined:", data.playerId);
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

  useEffect(() => {
    if (countdown > 0 && !gameStarted) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !gameStarted) {
      setGameStarted(true);
    }
  }, [countdown, gameStarted]);

  useEffect(() => {
    let interval = null;

    if (gameStarted && !winner) {
      interval = setInterval(() => {
        setCalledNumbers((prev) => {
          if (prev.length >= 100) {
            clearInterval(interval);
            return prev;
          }

          let newNumber;
          do {
            newNumber = Math.floor(Math.random() * 100) + 1;
          } while (prev.includes(newNumber));

          // Emit to all players
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

  useEffect(() => {
    if (!playerCard || playerCard.length === 0) return;

    const isMarked = (num, row, col) => {
      if (row === 2 && col === 2) return true; // center always marked
      return calledNumbers.includes(num);
    };

    let bingo = false;

    // Check rows
    for (let i = 0; i < 5; i++) {
      if (playerCard[i].every((num, j) => isMarked(num, i, j))) {
        bingo = true;
        break;
      }
    }

    // Check columns
    if (!bingo) {
      for (let j = 0; j < 5; j++) {
        let colWin = true;
        for (let i = 0; i < 5; i++) {
          if (!isMarked(playerCard[i][j], i, j)) {
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

    // Check main diagonal
    if (!bingo) {
      let diagWin = true;
      for (let i = 0; i < 5; i++) {
        if (!isMarked(playerCard[i][i], i, i)) {
          diagWin = false;
          break;
        }
      }
      if (diagWin) bingo = true;
    }

    // Check anti-diagonal
    if (!bingo) {
      let antiDiagWin = true;
      for (let i = 0; i < 5; i++) {
        if (!isMarked(playerCard[i][4 - i], i, 4 - i)) {
          antiDiagWin = false;
          break;
        }
      }
      if (antiDiagWin) bingo = true;
    }

    // If bingo
    if (bingo && !winner) {
      setWinner(true);
      setWinAmount(`Br${stake * 10}`);
      setShowPopup(true);

      socket.emit("bingoWin", { gameId, userId: "YourUserId" }); // Replace with actual user ID

      // Reset after win
      setCalledNumbers([]);
      setCurrentNumber(null);
      setCountdown(60);
      setGameStarted(false);

      setTimeout(() => {
        setShowPopup(false);
        setWinner(false);
      }, 15000);
    }
  }, [calledNumbers, playerCard, stake, winner, socket, gameId]);

  const lastThree = calledNumbers.slice(-3).reverse();

  return (
    <div style={{ padding: "10px" }}>
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <img
          src={logo}
          alt="Logo"
          style={{ height: "60px", objectFit: "contain" }}
        />
      </div>

      {/* Top menu */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          background: "linear-gradient(90deg, orange, green, cyan)",
          borderRadius: "10px",
          color: "white",
          padding: "8px 5px",
          fontSize: "13px",
          marginBottom: "10px",
          flexWrap: "wrap",
        }}
      >
        <div>Players: 10</div>
        <div>Bet: Br{stake}</div>
        <div>Win: {winAmount}</div>
        <div>Call: {calledNumbers.length}</div>
        <div>Bonus: -</div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {/* Left side board */}
        <div style={{ flex: "1", minWidth: "180px", maxWidth: "200px" }}>
          {!gameStarted && countdown > 0 && (
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "#4CAF50",
                color: "white",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "10px auto",
                fontWeight: "bold",
                fontSize: "18px",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: "12px" }}>Wait</div>
              <div>{countdown}</div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "3px",
              marginTop: "5px",
            }}
          >
            {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
              <div
                key={num}
                style={{
                  width: "30px",
                  height: "30px",
                  background: calledNumbers.includes(num) ? "#00C9FF" : "#333",
                  color: "white",
                  fontSize: "10px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "4px",
                }}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div style={{ flex: "1", minWidth: "200px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "6px",
              marginBottom: "10px",
            }}
          >
            {lastThree.map((num, idx) => (
              <div
                key={idx}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#FF5722",
                  color: "white",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                {num}
              </div>
            ))}
          </div>

          <div
            style={{
              width: "100px",
              height: "100px",
              margin: "0 auto 10px",
              borderRadius: "50%",
              background: "#FF5722",
              color: "white",
              fontSize: "28px",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {currentNumber || "--"}
          </div>

          <h4 style={{ textAlign: "center" }}>Cartela: #{cartelaNumber}</h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 30px)",
              justifyContent: "center",
              gap: "3px",
              margin: "10px auto",
            }}
          >
            {playerCard.flat().map((num, idx) => {
              const row = Math.floor(idx / 5);
              const col = idx % 5;
              const marked =
                row === 2 && col === 2 ? true : calledNumbers.includes(num);
              return (
                <div
                  key={idx}
                  style={{
                    width: "30px",
                    height: "30px",
                    background: marked ? "#00C9FF" : "#333",
                    color: "white",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    fontSize: "10px",
                  }}
                >
                  {marked ? "*" : num}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => alert("Bingo button logic (coming soon)!")}
              style={actionBtnStyle}
            >
              🎉 Bingo
            </button>
            <button onClick={() => navigate("/")} style={actionBtnStyle}>
              🚪 Leave
            </button>
          </div>
        </div>
      </div>

      {/* Popup modal */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            🎉 Cartela #{cartelaNumber} Won! 🎉
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => setShowPopup(false)}
                style={{
                  padding: "8px 20px",
                  background: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const actionBtnStyle = {
  padding: "8px 15px",
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "12px",
};

export default Call;