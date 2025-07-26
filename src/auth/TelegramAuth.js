// /src/auth/TelegramAuth.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TelegramAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (tgUser) {
      localStorage.setItem("telegramUser", JSON.stringify(tgUser));
      navigate("/home");
    } else {
      alert("Failed to load Telegram user");
    }
  }, [navigate]);

  return null;
};

export default TelegramAuth;