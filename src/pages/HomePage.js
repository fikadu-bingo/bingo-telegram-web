import React, { useState } from "react"; import { useNavigate } from "react-router-dom"; import DepositModal from "../components/DepositModal"; import DepositSuccessModal from "../components/DepositSuccessModal"; import CashOutModal from "../components/CashOutModal"; import CashOutSuccessModal from "../components/CashOutSuccessModal"; import TransferModal from "../components/TransferModal"; import PromoCodeModal from "../components/PromoCodeModal"; import logo from "../assets/logo.png";

function HomePage() { const navigate = useNavigate();

const [balance, setBalance] = useState(200); const [selectedStake, setSelectedStake] = useState(null); const [activeButton, setActiveButton] = useState(null); const [showModal, setShowModal] = useState(null); const [showSuccessModal, setShowSuccessModal] = useState(false); const [showCashOutSuccess, setShowCashOutSuccess] = useState(false); const [showTransferModal, setShowTransferModal] = useState(false); const [showPromoModal, setShowPromoModal] = useState(false);

const stakes = [200, 100, 50, 20, 10];

const handleStakeSelect = (amount) => { if (balance < amount) { alert("Not enough balance!"); return; } setSelectedStake(amount); setActiveButton(amount); };

const handlePlayNow = () => { if (!selectedStake) { setShowModal("stakeWarning"); return; }

if (balance < selectedStake) {
  alert("Not enough balance!");
  return;
}

const newBalance = balance - selectedStake;
setBalance(newBalance);

navigate("/bingo", {
  state: {
    balance: newBalance,
    stake: selectedStake,
    userJoined: true,
  },
});

};

const handleDeposit = (amount) => { setBalance((prev) => prev + amount); setShowModal(null); setShowSuccessModal(true); };

const handleCashOut = () => { setShowModal(null); setShowCashOutSuccess(true); };

return ( <div style={{ maxWidth: "400px", margin: "20px auto", background: "#1C1C3A", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", padding: "20px", textAlign: "center", color: "white", fontFamily: "Arial, sans-serif", }} > <img src={logo} alt="1Bingo Logo" style={{ width: "120px", height: "auto", marginBottom: "10px", }} />

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

  {stakes.map((amount) => (
    <div
      key={amount}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: activeButton === amount ? "#0E0E2C" : "#22224A",
        border:
          activeButton === amount ? "1px solid orange" : "1px solid transparent",
        borderRadius: "10px",
        padding: "10px",
        margin: "8px 0",
      }}
    >
      <div
        style={{
          flex: 1,
          textAlign: "left",
          color: "white",
          fontWeight: "bold",
        }}
      >
        Br{amount}
      </div>
      <div style={{ flex: 1, textAlign: "center" }}>👥 {activeButton === amount ? 1 : 0}</div>
      <div style={{ flex: 1, textAlign: "center" }}>⏰ {activeButton === amount ? "50s" : "..."}</div>
      <div style={{ flex: 1, textAlign: "center" }}>
        💰 {activeButton === amount ? `${Math.floor(amount * 0.8)} Br` : "..."}
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
  ))}

  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "10px",
      marginTop: "25px",
    }}
  >
    <button style={actionBtnStyle} onClick={() => setShowModal("deposit")}>💰 Deposit</button>
    <button style={actionBtnStyle} onClick={() => setShowModal("cashout")}>💵 Cash out</button>
    <button style={actionBtnStyle} onClick={() => setShowTransferModal(true)}>🔁 Transfer</button>
    <button style={actionBtnStyle} onClick={handlePlayNow}>🎮 Play now</button>
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

  {showTransferModal && (
    <div style={overlayStyle}>
      <TransferModal onClose={() => setShowTransferModal(false)} balance={balance} />
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

); }

const actionBtnStyle = { flex: "1 1 45%", padding: "12px", background: "#4CAF50", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", };

const overlayStyle = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, };

export default HomePage;