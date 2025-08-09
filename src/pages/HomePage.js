import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client"; // socket client
import DepositModal from "../components/DepositModal";
import DepositSuccessModal from "../components/DepositSuccessModal";
import CashOutModal from "../components/CashOutModal";
import CashOutSuccessModal from "../components/CashOutSuccessModal";
import TransferModal from "../components/TransferModal";
import PromoCodeModal from "../components/PromoCodeModal";
import logo from "../assets/logo.png";

function HomePage() {
  const navigate = useNavigate();

  // --- user & balance state
  const [balance, setBalance] = useState(() => {
    const stored = localStorage.getItem("balance");
    return stored ? parseFloat(stored) : 200;
  });

  const [firstName, setFirstName] = useState("User");
  const [telegramId, setTelegramId] = useState(null);

  // --- socket & realtime stake info
  const socketRef = useRef(null);
  const joinedGameIdRef = useRef(null);
  const [joinedGameId, setJoinedGameId] = useState(null);
  const [stakeInfo, setStakeInfo] = useState({});

  // --- UI state
  const [selectedStake, setSelectedStake] = useState(null);
  const [activeButton, setActiveButton] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCashOutSuccess, setShowCashOutSuccess] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const stakes = [10, 20, 50, 100, 200];

  useEffect(() => {
    socketRef.current = io("https://bingo-server-rw7p.onrender.com");
    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("stakePlayerCount", ({ gameId, count } = {}) => {
      const parsed = parseInt(String(gameId).replace(/\D/g, ""), 10);
      if (!isNaN(parsed)) {
        setStakeInfo((prev) => ({
          ...prev,
          [parsed]: {
            ...(prev[parsed] || {}),
            users: count,
          },
        }));
      }
    });

    socket.on("playerCountUpdate", (count) => {
      const gameId = joinedGameIdRef.current;
      if (!gameId) return;
      const amount = parseInt(String(gameId).replace(/\D/g, ""), 10);
      if (!isNaN(amount)) {
        setStakeInfo((prev) => ({
          ...prev,
          [amount]: { ...(prev[amount] || {}), users: count },
        }));
      }
    });

    socket.on("countdownUpdate", (time) => {
      const gameId = joinedGameIdRef.current;
      if (!gameId) return;
      const amount = parseInt(String(gameId).replace(/\D/g, ""), 10);
      if (!isNaN(amount)) {
        setStakeInfo((prev) => ({
          ...prev,
          [amount]: { ...(prev[amount] || {}), timeLeft: time },
        }));
      }
    });

    socket.on("countdownStopped", () => {
      const gameId = joinedGameIdRef.current;
      if (!gameId) return;
      const amount = parseInt(String(gameId).replace(/\D/g, ""), 10);
      if (!isNaN(amount)) {
        setStakeInfo((prev) => ({
          ...prev,
          [amount]: { ...(prev[amount] || {}), timeLeft: undefined },
        }));
      }
    });

    socket.on("winAmountUpdate", (payload) => {
      const gameId = joinedGameIdRef.current;
      if (!gameId || !payload) return;
      const amount = parseInt(String(gameId).replace(/\D/g, ""), 10);
      if (!isNaN(amount)) {
        setStakeInfo((prev) => ({
          ...prev,
          [amount]: { ...(prev[amount] || {}), potentialWin: payload.winAmount },
        }));
      }
    });

    socket.on("ticketNumbersUpdated", () => {});
    socket.on("numberCalled", () => {});

    return () => {
      try {
        const telegram_id = localStorage.getItem("telegram_id");
        if (joinedGameIdRef.current && socketRef.current && telegram_id) {
          socketRef.current.emit("leaveGame", { gameId: joinedGameIdRef.current, userId: telegram_id });
        }
      } catch (err) {
        console.warn("Error leaving game on unmount:", err);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    joinedGameIdRef.current = joinedGameId;
  }, [joinedGameId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const telegram_id = params.get("telegram_id");
    const first_name = params.get("first_name");
    const username = params.get("username");

    if (telegram_id && first_name) {
      const telegramUser = { id: telegram_id, first_name, username };
      localStorage.setItem("telegramUser", JSON.stringify(telegramUser));
      localStorage.setItem("telegram_id", telegram_id);
      setFirstName(first_name);
      setTelegramId(telegram_id);
    } else {
      const storedUser = JSON.parse(localStorage.getItem("telegramUser"));
      if (storedUser?.first_name) {
        setFirstName(storedUser.first_name);
      } else {
        const fallback = localStorage.getItem("firstName");
        if (fallback) setFirstName(fallback);
      }
      if (storedUser?.id) {
        setTelegramId(storedUser.id);
        localStorage.setItem("telegram_id", storedUser.id);
      }
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const telegram_id = localStorage.getItem("telegram_id");
      if (!telegram_id) return;

      const res = await fetch(`https://bingo-server-rw7p.onrender.com/api/user/me?telegram_id=${telegram_id}`);
      const data = await res.json();

      if (data && data.user) {
        const newBalance = data.user.balance;
        setBalance(newBalance);
        localStorage.setItem("balance", newBalance);

        if (data.user.first_name) {
          setFirstName(data.user.first_name);
          localStorage.setItem("firstName", data.user.first_name);
          localStorage.setItem("telegramUser", JSON.stringify(data.user));
        }
      } else {
        console.warn("User data not found");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUserData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleStakeSelect = (amount) => {
    if (balance < amount) {
      alert("Not enough balance!");
      return;
    }

    const socket = socketRef.current;
    if (!socket) {
      alert("Realtime connection not ready. Try again in a moment.");
      return;
    }

    let userId = localStorage.getItem("telegram_id") || telegramId;
    if (!userId) {
      userId = `guest_${Date.now()}`;
      localStorage.setItem("telegram_id", userId);
      setTelegramId(userId);
    }

    const newGameId = `Br${amount}`;

    if (joinedGameIdRef.current && joinedGameIdRef.current !== newGameId) {
      socket.emit("leaveGame", { gameId: joinedGameIdRef.current, userId });
    }

    socket.emit("joinGame", { gameId: newGameId, userId, username: firstName, stake: amount });

    setSelectedStake(amount);
    setActiveButton(amount);
    setJoinedGameId(newGameId);
    joinedGameIdRef.current = newGameId;

    setStakeInfo((prev) => ({
      ...prev,
      [amount]: {
        ...(prev[amount] || {}),
        users: prev[amount]?.users ? prev[amount].users : 1,
        timeLeft: prev[amount]?.timeLeft ?? undefined,
        potentialWin: prev[amount]?.potentialWin ?? Math.floor(amount * 0.8),
      },
    }));
  };

  const leaveCurrentStake = () => {const socket = socketRef.current;
    const userId = localStorage.getItem("telegram_id") || telegramId;
    if (socket && joinedGameIdRef.current && userId) {
      socket.emit("leaveGame", { gameId: joinedGameIdRef.current, userId });
      setJoinedGameId(null);
      joinedGameIdRef.current = null;
      setActiveButton(null);
      setSelectedStake(null);
    }
  };

  const handlePlayNow = () => {
    if (!selectedStake) {
      setShowModal("stakeWarning");
      return;
    }

    if (balance < selectedStake) {
      alert("Not enough balance!");
      return;
    }

    const telegramUser = JSON.parse(localStorage.getItem("telegramUser"));
    const username = telegramUser?.first_name || firstName || "User";

    navigate("/bingo", {
      state: {
        balance: balance,
        stake: selectedStake,
        userJoined: true,
        username,
      },
    });
  };

  const handleDeposit = (amount) => {
    const newBalance = balance + amount;
    setBalance(newBalance);
    localStorage.setItem("balance", newBalance);
    setShowModal(null);
    setShowSuccessModal(true);
  };

  const handleCashOut = () => {
    setShowModal(null);
    setShowCashOutSuccess(true);
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "20px auto",
        background: "#1C1C3A",
        borderRadius: "15px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        padding: "20px",
        textAlign: "center",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <img
        src={logo}
        alt="1Bingo Logo"
        style={{ width: "120px", height: "auto", marginBottom: "10px" }}
      />

      <div style={{ fontSize: "18px", marginBottom: "10px", color: "#00BFFF" }}>
        👋 Welcome, {firstName}
      </div>

      <div
        style={{
          background: "#29294D",
          borderRadius: "12px",
          padding: "15px",
          margin: "20px 0",
        }}
      >
        <h3 style={{ margin: "0", fontSize: "18px" }}>Your Balance</h3>
        <p
          style={{
            fontSize: "26px",
            fontWeight: "bold",
            color: "#4CAF50",
            margin: "5px 0",
          }}
        >
          {balance} Br
        </p>
      </div>

      <h4 style={{ marginTop: "10px", color: "#ddd" }}>Select Stake Group</h4>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "5px 10px",
          fontWeight: "bold",
          fontSize: "13px",
          color: "#00BFFF",
        }}
      >
        <div style={{ flex: 1, textAlign: "left" }}>Stake</div>
        <div style={{ flex: 1, textAlign: "center" }}>Users</div>
        <div style={{ flex: 1, textAlign: "center" }}>Timer</div>
        <div style={{ flex: 1, textAlign: "center" }}>Win</div>
        <div style={{ flex: 1, textAlign: "center" }}>Join</div>
      </div>

      {stakes.map((amount) => {
        const info = stakeInfo[amount] || {};
        const users = typeof info.users === "number" ? info.users : activeButton === amount ? 1 : 0;
        const timer = (typeof info.timeLeft === "number" && users >= 2)
          ? `${info.timeLeft}s`
          : "...";
        const winAmount = users > 0
          ? `${Math.floor(amount * users * 0.8)} Br`
          : info.potentialWin
          ? `${info.potentialWin} Br`
          : "...";

        return (
          <div
            key={amount}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: activeButton === amount ? "#0E0E2C" : "#22224A",
              border:
                activeButton === amount
                  ? "1px solid orange"
                  : "1px solid transparent",borderRadius: "10px",
              padding: "10px",
              margin: "8px 0",
            }}
          >
            <div style={{ flex: 1, textAlign: "left", fontWeight: "bold" }}>
              Br{amount}
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              👥 {users}
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              ⏰ {timer}
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              💰 {winAmount}
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              {activeButton === amount ? (
                <div
                  style={{
                    background: "#FF5722",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                >
                  Selected ✓
                </div>
              ) : (
                <button
                  onClick={() => handleStakeSelect(amount)}
                  style={{
                    background: "#00BFFF",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Start
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          marginTop: "25px",
        }}
      >
        <button style={actionBtnStyle} onClick={() => setShowModal("deposit")}>
          💰 Deposit
        </button>
        <button style={actionBtnStyle} onClick={() => setShowModal("cashout")}>
          💵 Cash out
        </button>
        <button style={actionBtnStyle} onClick={fetchUserData}>
          🔄 Refresh
        </button>
        <button style={actionBtnStyle} onClick={handlePlayNow}>
          🎮 Play now
        </button>
      </div>

      <p
        style={{
          fontSize: "13px",
          color: "#00BFFF",
          textDecoration: "underline",
          cursor: "pointer",
          marginTop: "10px",
        }}
        onClick={() => setShowPromoModal(true)}
      >
        Have a promo code? Click here
      </p>

      {showModal === "stakeWarning" && (
        <div style={overlayStyle}>
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
              color: "#333",
            }}
          >
            ⚠️ Please select stake
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => setShowModal(null)}
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

      {showModal === "deposit" && (
        <div style={overlayStyle}>
          <DepositModal
            onClose={() => setShowModal(null)}
            onDeposit={handleDeposit}
          />
        </div>
      )}

      {showModal === "cashout" && (
        <div style={overlayStyle}>
          <CashOutModal
            onClose={() => setShowModal(null)}
            onConfirm={handleCashOut}
          />
        </div>
      )}
      {showPromoModal && (
        <div style={overlayStyle}>
          <PromoCodeModal
            onClose={() => setShowPromoModal(false)}
            onSuccess={() => {
              setShowPromoModal(false);
              alert("Promo code verified!");
            }}
          />
        </div>
      )}

      {showSuccessModal && (
        <DepositSuccessModal onClose={() => setShowSuccessModal(false)} />
      )}

      {showCashOutSuccess && (
        <CashOutSuccessModal onClose={() => setShowCashOutSuccess(false)} />
      )}
    </div>
  );
}

const actionBtnStyle = {
  flex: "1 1 45%",
  padding: "12px",
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "14px",
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

export default HomePage;