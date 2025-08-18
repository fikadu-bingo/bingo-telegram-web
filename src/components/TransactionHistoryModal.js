// src/components/TransactionHistoryModal.js
import React, { useEffect, useState } from "react";
import "./TransactionHistoryModal.css"; // style file

function TransactionHistoryModal({ onClose, telegramId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(
          `/api/user/transactions?telegram_id=${telegramId}`
        );
        const data = await response.json();
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [telegramId]);

  return (
    <div className="transaction-modal-overlay">
      <div className="transaction-modal">
        <h2>Transaction History</h2>
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>

        {loading ? (
          <p>Loading...</p>
        ) : transactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          <ul className="transaction-list">
            {transactions.map((t) => (
              <li
                key={t.id}
                className={`transaction-item ${
                  t.type === "deposit" ? "deposit" : "cashout"
                }`}
              >
                <span className="transaction-type">
                  {t.type === "deposit" ? "+ " : "- "}
                </span>
                <span className="transaction-amount">{t.amount} ETB</span>
                <span className="transaction-status">({t.status})</span>
                <span className="transaction-date">
                  {new Date(t.date).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TransactionHistoryModal;