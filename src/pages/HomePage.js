import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import DepositModal from "../components/DepositModal";
import DepositSuccessModal from "../components/DepositSuccessModal";
import CashOutModal from "../components/CashOutModal";
import CashOutSuccessModal from "../components/CashOutSuccessModal";
import TransferModal from "../components/TransferModal";
import PromoCodeModal from "../components/PromoCodeModal";
import logo from "../assets/logo.png";

function HomePage() {
  const navigate = useNavigate();

  // User & balance state
  const [balance, setBalance] = useState(() => {
    const stored = localStorage.getItem("balance");
    return stored ? parseFloat(stored) : 200;
  });
  const [firstName, setFirstName] = useState("User");
  const [telegramId, setTelegramId] = useState(null);

  // Socket & realtime game info
  const socketRef = useRef(null);

  // Single selected stake group
  const [selectedStake, setSelectedStake] = useState(null);

  // Live game info from server
  const [livePlayerCount, setLivePlayerCount] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [winAmount, setWinAmount] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCashOutSuccess, setShowCashOutSuccess] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const stakes = [10, 20, 50, 100, 200];

  // Helper to get user ID fallback
  const getUserId = () =>
    localStorage.getItem("telegram_id")||  telegramId || `guest_${Date.now()}`;

  // Initialize socket connection and listeners
  useEffect(() => {
    const socket = io("https://bingo-server-rw7p.onrender.com");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      const userId = getUserId();
      if (selectedStake && userId) {
        const username = firstName || "User";
        socket.emit("joinGame", { userId, username, stake: selectedStake });
      }
    });

    socket.on("playerCountUpdate", setLivePlayerCount);
    socket.on("countdownUpdate", setCountdown);
    socket.on("countdownStopped", () => setCountdown(null));
    socket.on("winAmountUpdate", setWinAmount);

    socket.on("balanceChange", (payload) => {
      try {
        const userId = getUserId();
        if (!userId) return;

        const markerKey = "last_balance_change";
        const payloadId = JSON.stringify(payload || {});
        if (localStorage.getItem(markerKey) === payloadId) return;

        if (payload.winner === userId) {
          const prize = Number(payload.prize || 0);
          const current = parseFloat(localStorage.getItem("balance") || balance || 0);
          const newBal = Number((current + prize).toFixed(2));
          setBalance(newBal);
          localStorage.setItem("balance", newBal);
        } else if (payload.losers?.includes(userId)) {
          const deduct = Number(payload.perLoserDeduct || 0);
          const current = parseFloat(localStorage.getItem("balance") || balance || 0);
          const newBal = Number((current - deduct).toFixed(2));
          setBalance(newBal);
          localStorage.setItem("balance", newBal);
        }

        localStorage.setItem(markerKey, payloadId);
      } catch (e) {
        console.error("balanceChange error:", e);
      }
    });

    socket.on("deductBalance", ({ amount } = {}) => {
      try {
        const userId = getUserId();
        if (!userId) return;
        const current = parseFloat(localStorage.getItem("balance") || balance || 0);
        const newBal = Number((current - Number(amount || 0)).toFixed(2));
        setBalance(newBal);
        localStorage.setItem("balance", newBal);
      } catch (e) {
        console.error("deductBalance error:", e);
      }
    });
    socket.on("gameReset", () => {
      localStorage.removeItem("last_balance_change");
      setWinAmount(null);
      setCountdown(null);
      setLivePlayerCount(0);
    });

    return () => {
      const userId = getUserId();
      if (socket && userId) socket.emit("leaveGame", { userId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [telegramId, selectedStake, firstName, balance]);

  // Fetch user data from backend
  const fetchUserData = async () => {
    try {
      const telegram_id = localStorage.getItem("telegram_id");
      if (!telegram_id) return;

      const res = await fetch(`
        https://bingo-server-rw7p.onrender.com/api/user/me?telegram_id=${telegram_id}`
      );
      const data = await res.json();

      if (data?.user) {
        setBalance(data.user.balance);
        localStorage.setItem("balance", data.user.balance);

        if (data.user.first_name) {
          setFirstName(data.user.first_name);
          localStorage.setItem("firstName", data.user.first_name);
          localStorage.setItem("telegramUser", JSON.stringify(data.user));
        }
      }
    } catch (e) {
      console.error("fetchUserData error:", e);
    }
  };

  // Load user info from URL or localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const telegram_id = params.get("telegram_id");
    const first_name = params.get("first_name");
    const username = params.get("username");

    if (telegram_id && first_name) {
      const user = { id: telegram_id, first_name, username };
      localStorage.setItem("telegramUser", JSON.stringify(user));
      localStorage.setItem("telegram_id", telegram_id);
      setFirstName(first_name);
      setTelegramId(telegram_id);
    } else {
      const storedUser = JSON.parse(localStorage.getItem("telegramUser") || "{}");
      if (storedUser.first_name) setFirstName(storedUser.first_name);
      if (storedUser.id) {
        setTelegramId(storedUser.id);
        localStorage.setItem("telegram_id", storedUser.id);
      }
    }
    fetchUserData();
  }, []);

  // Refresh user data every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchUserData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync balance changes from other tabs/windows
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "balance" && e.newValue) {
        const val = parseFloat(e.newValue);
        if (!isNaN(val)) setBalance(val);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // User selects a stake group
  const handleStakeSelect = (amount) => {
    if (balance < amount) {
      alert("Not enough balance!");
      return;
    }
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
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

    if (selectedStake !== null && selectedStake !== amount) {
      socket.emit("leaveGame", { userId });
      setLivePlayerCount(0);
      setCountdown(null);
      setWinAmount(null);
    }

    socket.emit("joinGame", { userId, username, stake: amount });
    setSelectedStake(amount);
  };

  // Play now button pressed
  const handlePlayNow = () => {
    if (!selectedStake) {
      setShowModal("stakeWarning");
      return;
    }
    if (balance < selectedStake) {
      alert("Not enough balance!");
      return;
    }
    const telegramUser = JSON.parse(localStorage.getItem("telegramUser") || "{}");
    const username = telegramUser.first_name || firstName || "User";
    const userId = localStorage.getItem("telegram_id") || telegramId;
    navigate("/bingo", {
      state: { balance, stake: selectedStake, userJoined: true, username, userId },
    });
  };

  // Deposit success handler
  const handleDeposit = (amount) => {
    const newBal = balance + amount;
    setBalance(newBal);
    localStorage.setItem("balance", newBal);
    setShowModal(null);
    setShowSuccessModal(true);
  };

  // Cash out success handler
  const handleCashOut = () => {
    setShowModal(null);
    setShowCashOutSuccess(true);
  };

  // Styling for action buttons
  const actionBtnStyle = {
    background: "#00BFFF",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  };

  // Overlay style for modals
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
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
        <h3 style={{ margin: 0, fontSize: "18px" }}>Your Balance</h3>
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
        <button style={actionBtnStyle} onClick={() => setShowModal("transfer")}>
          🔁 Transfer
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

      {/* Modals */}
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

      {showModal === "transfer" && (
        <div style={overlayStyle}>
          <TransferModal onClose={() => setShowModal(null)} />
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



export default HomePage;