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

  // --- socket & realtime game info
  const socketRef = useRef(null);

  // We only allow ONE selected stake at a time (single-game mode)
  const [selectedStake, setSelectedStake] = useState(null);

  // Live game info from server:
  const [livePlayerCount, setLivePlayerCount] = useState(0);
  const [countdown, setCountdown] = useState(null); // seconds or null
  const [winAmount, setWinAmount] = useState(null);

  // --- UI modal states
  const [showModal, setShowModal] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCashOutSuccess, setShowCashOutSuccess] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const stakes = [10, 20, 50, 100, 200];

  // Initialize socket connection & listeners - only ONCE
  useEffect(() => {
    const socket = io("https://bingo-server-rw7p.onrender.com");

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      // Rejoin game if stake selected and userId exists
      const userId = localStorage.getItem("telegram_id") || telegramId;
      if (selectedStake && userId) {
        const username = firstName || "User";
        socket.emit("joinGame", { userId, username, stake: selectedStake });
      }
    });

    // Live player count (for selected single-room)
    socket.on("playerCountUpdate", (count) => {
      setLivePlayerCount(count);
    });

    // Countdown updates
    socket.on("countdownUpdate", (time) => {
      setCountdown(time);
    });

    socket.on("countdownStopped", () => {
      setCountdown(null);
    });

    // Win amount update
    socket.on("winAmountUpdate", (amount) => {
      setWinAmount(amount);
    });

    // The server sends instructions to update balances after a game finishes
    socket.on("balanceChange", (payload) => {
      try {
        const userId = localStorage.getItem("telegram_id") || telegramId;
        if (!userId) return;

        // Prevent applying the same payload multiple times:
        const markerKey = "last_balance_change";
        const payloadId = JSON.stringify(payload || {});
        const already = localStorage.getItem(markerKey);
        if (already === payloadId) {
          return; // already applied
        }

        // Apply winner/loser updates (update local balance + localStorage)
        if (payload && payload.winner === userId) {
          // Winner: add prize
          const prize = Number(payload.prize || 0);
          const current = parseFloat(localStorage.getItem("balance") ?? balance ?? 0);
          const newBal = Number((current + prize).toFixed(2));
          setBalance(newBal);
          localStorage.setItem("balance", newBal);
        } else if (payload && Array.isArray(payload.losers) && payload.losers.includes(userId)) {
          // Loser: deduct perLoserDeduct
          const deduct = Number(payload.perLoserDeduct || 0);
          const current = parseFloat(localStorage.getItem("balance") ?? balance ?? 0);
          const newBal = Number((current - deduct).toFixed(2));
          setBalance(newBal);
          localStorage.setItem("balance", newBal);
        }
// Save marker so we don't reapply this same balanceChange
        localStorage.setItem(markerKey, payloadId);
      } catch (err) {
        console.error("Failed to apply balanceChange:", err);
      }
    });

    // Server may send a targeted deduct (e.g., when leaving)
    socket.on("deductBalance", ({ amount, reason } = {}) => {
      try {
        const userId = localStorage.getItem("telegram_id") || telegramId;
        if (!userId) return;
        const current = parseFloat(localStorage.getItem("balance") ?? balance ?? 0);
        const newBal = Number((current - Number(amount || 0)).toFixed(2));
        setBalance(newBal);
        localStorage.setItem("balance", newBal);
      } catch (err) {
        console.error("Failed to apply deductBalance:", err);
      }
    });

    // Clear per-game markers on reset so next game can apply again
    socket.on("gameReset", () => {
      try {
        localStorage.removeItem("last_balance_change");
        setWinAmount(null);
        setCountdown(null);
        setLivePlayerCount(0);
      } catch (err) {
        console.warn("Error handling gameReset:", err);
      }
    });

    // Cleanup on unmount
    return () => {
      const userId = localStorage.getItem("telegram_id") || telegramId;
      if (socket && userId) {
        socket.emit("leaveGame", { userId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [telegramId, selectedStake, firstName, balance]);

  // Fetch and sync user data (balance etc.)
  const fetchUserData = async () => {
    try {
      const telegram_id = localStorage.getItem("telegram_id");
      if (!telegram_id) return;

      const res = await fetch(
        `https://bingo-server-rw7p.onrender.com/api/user/me?telegram_id=${telegram_id}`
      );
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

  // Load user info on mount from URL or localStorage
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

    fetchUserData();
  }, []);

  // Refresh user data every 15s
  useEffect(() => {
    const interval = setInterval(fetchUserData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Listen for balance changes in localStorage (from other tabs/components)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "balance") {
        const newBalance = parseFloat(event.newValue);
        if (!isNaN(newBalance)) {
          setBalance(newBalance);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Join game when user selects stake
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

    const username = firstName || "User";

    // Leave previous stake if different
    if (selectedStake !== null && selectedStake !== amount) {
      socket.emit("leaveGame", { userId });
      setLivePlayerCount(0);
      setCountdown(null);
      setWinAmount(null);
    }

    socket.emit("joinGame", { userId, username, stake: amount });

    setSelectedStake(amount);
  };

  // Leave game manually (optional)
  const leaveCurrentStake = () => {
    const socket = socketRef.current;
    const userId = localStorage.getItem("telegram_id") || telegramId;
    if (socket && userId) {
      socket.emit("leaveGame", { userId });
    }
    setSelectedStake(null);
    setLivePlayerCount(0);
    setCountdown(null);
    setWinAmount(null);
  };

  // Play now button navigates to bingo with all needed info
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
    const userId = localStorage.getItem("telegram_id") || telegramId;

    navigate("/bingo", {
      state: {
        balance,
        stake: selectedStake,
        userJoined: true,
        username,
        userId, // important for Call.js to join socket
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
        const isSelected = selectedStake === amount;
        const users = isSelected ? livePlayerCount : 0;
        const timer =
          isSelected && countdown !== null && users >= 2
            ? `${countdown}s`
            : "...";
        const win =
          isSelected && users > 0
            ? `${winAmount ?? Math.floor(amount * users * 0.8)} Br`
            : `${Math.floor(amount * 0.8)} Br`;

        // Disable join button if countdown running (timeLeft > 0)
        const countdownActive = isSelected && countdown > 0;

        return (
          <div
            key={amount}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: isSelected ? "#0E0E2C" : "#22224A",
              border: isSelected ? "1px solid orange" : "1px solid transparent",
              borderRadius: "10px",
              padding: "10px",
              margin: "8px 0",
            }}
          >
            <div style={{ flex: 1, textAlign: "left", fontWeight: "bold" }}>
              Br{amount}
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>👥 {users}</div>
            <div style={{ flex: 1, textAlign: "center" }}>⏰ {timer}</div>
            <div style={{ flex: 1, textAlign: "center" }}>💰 {win}</div>
            <div style={{ flex: 1, textAlign: "center" }}>
              {isSelected ? (
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
                  disabled={countdownActive}
                  title={countdownActive ? "Game already started for this stake" : ""}
                  style={{
                    background: countdownActive ? "#555" : "#00BFFF",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: countdownActive ? "not-allowed" : "pointer",
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
          <DepositModal onClose={() => setShowModal(null)} onDeposit={handleDeposit} />
        </div>
      )}

      {showModal === "cashout" && (
        <div style={overlayStyle}>
          <CashOutModal onClose={() => setShowModal(null)} onConfirm={handleCashOut} />
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

      {showSuccessModal && <DepositSuccessModal onClose={() => setShowSuccessModal(false)} />}
      {showCashOutSuccess && <CashOutSuccessModal onClose={() => setShowCashOutSuccess(false)} />}
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
  zIndex: 1000,
};

export default HomePage;