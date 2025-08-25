import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import DepositModal from "../components/DepositModal";
import DepositSuccessModal from "../components/DepositSuccessModal";
import CashOutModal from "../components/CashOutModal";
import CashOutSuccessModal from "../components/CashOutSuccessModal";
import PromoCodeModal from "../components/PromoCodeModal";
import TransactionHistoryModal from "../components/TransactionHistoryModal"; 
import logo from "../assets/logo.png";

import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();

  // ===== Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  // ===== User & balance state
  const [balance, setBalance] = useState(() => {
    const stored = localStorage.getItem("balance");
    return stored ? parseFloat(stored) : 200;
  });
  const [firstName, setFirstName] = useState("User");
  const [telegramId, setTelegramId] = useState(null);

  // ===== Socket & realtime game info
  const socketRef = useRef(null);
  const [selectedStake, setSelectedStake] = useState(null);
  const [livePlayerCount, setLivePlayerCount] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [winAmount, setWinAmount] = useState(null);

  // ===== UI modal states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCashOutSuccess, setShowCashOutSuccess] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const stakes = [10, 20, 50, 100, 200];

  // ===== Socket setup
  useEffect(() => {
    const socket = io("https://bingo-server-rw7p.onrender.com");
    socketRef.current = socket;

    socket.on("connect", () => {
      const userId = localStorage.getItem("telegram_id") ?? telegramId;
      if (selectedStake && userId) {
        const username = firstName ?? "User";
        socket.emit("joinGame", { userId, username, stake: selectedStake });
      }
    });

    socket.on("playerCountUpdate", (count) => setLivePlayerCount(count));
    socket.on("countdownUpdate", (time) => setCountdown(time));
    socket.on("countdownStopped", () => setCountdown(null));
    socket.on("winAmountUpdate", (amount) => setWinAmount(amount));

    socket.on("balanceChange", ({ userId: changedUserId, newBalance }) => {
      const userId = localStorage.getItem("telegram_id") ?? telegramId;
      if (!userId) return;
      if (changedUserId === userId && typeof newBalance === "number") {
        setBalance(newBalance);
        localStorage.setItem("balance", newBalance);
      }
    });

    socket.on("deductBalance", ({ amount } = {}) => {
      try {
        const userId = localStorage.getItem("telegram_id") ?? telegramId;
        if (!userId) return;
        const current = parseFloat(localStorage.getItem("balance") ?? balance ?? 0);
        const newBal = Number((current - Number(amount ?? 0)).toFixed(2));
        setBalance(newBal);
        localStorage.setItem("balance", newBal);
      } catch (err) {
        console.error("Failed to apply deductBalance:", err);
      }
    });

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

    return () => {
      const userId = localStorage.getItem("telegram_id") ?? telegramId;
      if (socket && userId) socket.emit("leaveGame", { userId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [telegramId, selectedStake, firstName, balance]);
  // ===== Fetch and sync user data
  const fetchUserData = async () => {
    try {
      const telegram_id = localStorage.getItem("telegram_id");
      if (!telegram_id) return;

      const res = await fetch(`
        https://bingo-server-rw7p.onrender.com/api/user/me?telegram_id=${telegram_id}`
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

  // ===== Load user info from URL or localStorage
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

  // ===== Refresh user data every 15s
  useEffect(() => {
    const interval = setInterval(fetchUserData, 15000);
    return () => clearInterval(interval);
  }, []);

  // ===== Listen for balance changes (other tabs)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "balance") {
        const newBalance = parseFloat(event.newValue);
        if (!isNaN(newBalance)) setBalance(newBalance);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ===== Game actions
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
    let userId = localStorage.getItem("telegram_id") ?? telegramId;
    if (!userId) {
      userId = `guest_${Date.now()}`;
      localStorage.setItem("telegram_id", userId);
      setTelegramId(userId);
    }
    const username = firstName ?? "User";
    if (selectedStake !== null && selectedStake !== amount) {
      socket.emit("leaveGame", { userId });
      setLivePlayerCount(0);
      setCountdown(null);
      setWinAmount(null);
    }
    socket.emit("joinGame", { userId, username, stake: amount });
    setSelectedStake(amount);
  };

  const leaveCurrentStake = () => {
    const socket = socketRef.current;
    const userId = localStorage.getItem("telegram_id") ?? telegramId;
    if (socket && userId) socket.emit("leaveGame", { userId });
    setSelectedStake(null);
    setLivePlayerCount(0);
    setCountdown(null);
    setWinAmount(null);
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
    const username =
      (telegramUser && telegramUser.first_name) ?? firstName ?? "User";
    const userId = localStorage.getItem("telegram_id") ?? telegramId;

    navigate("/bingo", {
      state: {
        balance,
        stake: selectedStake,
        userJoined: true,
        username,
        userId,
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
    <div className="hp-container">
      {/* Header with menu button, centered logo, and top-right balance */}
<div className="hp-header">
  <button
    className="hp-menu-btn"
    onClick={openSidebar}
    aria-label="Open menu"
  >
    <span />
    <span />
    <span />
  </button>

  <img src={logo} alt="1Bingo Logo" className="hp-logo" />

  <div className="hp-balance-top-right">
    <div className="hp-balance-box">
      <span className="hp-coin">🪙</span> ETB: {balance}
    </div>
  </div>
</div>
      {/* Welcome line below logo */}
      <div className="hp-welcome-line">
        👋 Welcome, {firstName}.
      </div>{/* Sidebar + Backdrop */}
      {isSidebarOpen && <div className="hp-backdrop" onClick={closeSidebar} />}
      <aside className={`hp-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="hp-sidebar-top">
          <h2>1Bingo</h2>
          <button className="hp-close" onClick={closeSidebar} aria-label="Close menu">
            ×
          </button>
        </div>

      <div className="hp-side-items">
          <button className="hp-side-btn" onClick={closeSidebar}>🎮 Games</button>
          <button className="hp-side-btn" onClick={closeSidebar}>🏆 Leaderboard</button>
          <button className="hp-side-btn" onClick={closeSidebar}>❓ How to Play</button>

          {/* 👛 Wallet button inserted here */}
          <button
            className="hp-side-btn"
            onClick={() => {
              closeSidebar();
              setShowWalletModal(true); // <-- you'll define this state
            }}
          >
            👛 Wallet
          </button>

          <button className="hp-side-btn" onClick={closeSidebar}>👥 Referral</button>
          <button className="hp-side-btn" onClick={closeSidebar}>📩 Contact</button>

          <div className="hp-side-welcome">Welcome back 👋 {firstName}</div>
          <div className="hp-side-balance">💰 {balance} ETB</div>

          <button
            className="hp-side-btn"
            onClick={() => {
              closeSidebar();
              setShowTransactionModal(true);
            }}
          >
            📜 Transaction History
          </button>
        </div>

        <p className="hp-side-footer">
          Developed by F-tech Solutions PLC © 2025
        </p>
      </aside>

      {/* Balance card */}
     
      {/* Stake header */}
      <div className="hp-stake-header">
        <div>Stake</div>
        <div>Users</div>
        <div>Timer</div>
        <div>Win</div>
        <div>Join</div>
      </div>

      {/* Stake rows */}
      {stakes.map((amount) => {
        const isSelected = selectedStake === amount;
        const users = isSelected ? livePlayerCount : 0;
        const timer =
          isSelected && countdown !== null && users >= 2 ? `${countdown}s` : "...";
        const win =
          isSelected && users > 0
            ? `${winAmount ?? Math.floor(amount * users * 0.8)} Br`
            : `${Math.floor(amount * 0.8)} Br`;
        const countdownActive = isSelected && countdown > 0;

        return (
          <div key={amount} className={`hp-stake-row ${isSelected ? "selected" : ""}`}>
            <div className="left">Br{amount}</div>
            <div className="center">👥 {users}</div>
            <div className="center">⏰ {timer}</div>
            <div className="center">💰 {win}</div>
            <div className="center">
              {isSelected ? (
                <div className="hp-selected-badge">Selected ✓</div>
              ) : (
                <button
                  onClick={() => handleStakeSelect(amount)}
                  disabled={countdownActive}
                  title={countdownActive ? "Game already started for this stake" : ""}
                  className={`hp-start-btn ${countdownActive ? "disabled" : ""}`}
                >
                  Start
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Actions */}
      <div className="hp-actions">
        <button className="hp-action-btn" onClick={() => setShowModal("deposit")}>
          💰 Deposit
        </button>
        <button className="hp-action-btn" onClick={() => setShowModal("cashout")}>
          💵 Cash out
        </button>
        <button className="hp-action-btn" onClick={fetchUserData}>
          🔄 Refresh
        </button>
        <button className="hp-action-btn" onClick={handlePlayNow}>
          🎮 Play now
        </button>
      </div>

      <p className="hp-promo-link" onClick={() => setShowPromoModal(true)}>
        Have a promo code? Click here
      </p>{/* Modals */}
{showWalletModal && (
  <div className="hp-overlay">
    <div className="hp-wallet-large">
      {/* Sidebar */}
      <div className="hp-wallet-sidebar">
        <button className="wallet-btn active">💳 Deposit</button>
        <button className="wallet-btn">💸 Withdraw</button>
        <button className="wallet-btn">🔄 Transfer</button>
        <button className="wallet-btn">📜 History</button>
      </div>
{/* Main content */}
<div className="hp-wallet-content">
  {/* Balances */}
  <div className="wallet-balances">
    <div className="balance-card">
      <span className="balance-label">Main Balance</span>
      <h3 className="balance-value">ETB {balance.toFixed(2)} Birr</h3>
    </div>
    <div className="balance-card">
      <span className="balance-label">Bonus Balance</span>
      <h3 className="balance-value">ETB 0.00 Birr</h3>
    </div>
  </div>

  {/* Deposit Input */}
  <div className="deposit-section">
    <label className="deposit-label">Deposit Amount</label>
    <input type="number" placeholder="Enter amount" />
  </div>

  {/* Payment Options */}
  <div className="payment-options">
    <div className="payment-card">⭐️ Telebirr (Better Fee)</div>
    <div className="payment-card">Telebirr (Normal)</div>
    <div className="payment-card">⭐️ CBE Birr (Better Fee)</div>
    <div className="payment-card">CBE Birr (Normal)</div>
  </div>
</div>

      {/* Close */}
      <button
        onClick={() => setShowWalletModal(false)}
        className="wallet-close-btn"
      >
        ✖
      </button>
    </div>
  </div>
)}
      {showModal === "stakeWarning" && (
        <div className="hp-overlay">
          <div className="hp-alert">
            ⚠️ Please select stake
            <div className="hp-alert-actions">
              <button onClick={() => setShowModal(null)} className="hp-ok-btn">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "deposit" && (
        <div className="hp-overlay">
          <DepositModal onClose={() => setShowModal(null)} onDeposit={handleDeposit} />
        </div>
      )}

      {showModal === "cashout" && (
        <div className="hp-overlay">
          <CashOutModal onClose={() => setShowModal(null)} onConfirm={handleCashOut} />
        </div>
      )}

      {showPromoModal && (
        <div className="hp-overlay">
          <PromoCodeModal
            onClose={() => setShowPromoModal(false)}
            onSuccess={() => {
              setShowPromoModal(false);
              alert("Promo code verified!");
            }}
          />
        </div>
      )}

      {showTransactionModal && (
        <div className="hp-overlay">
          <TransactionHistoryModal onClose={() => setShowTransactionModal(false)} />
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