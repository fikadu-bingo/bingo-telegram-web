// src/auth/TelegramAuth.js
import React, { useEffect } from "react";

const TelegramAuth = ({ children }) => {
  useEffect(() => {
    const telegram = window.Telegram?.WebApp;
    const user = telegram?.initDataUnsafe?.user;

    if (user) {
      localStorage.setItem("telegramUser", JSON.stringify(user));
    } else {
      console.warn("Telegram user not found");
    }
  }, []);

  return <>{children}</>;
};

export default TelegramAuth;