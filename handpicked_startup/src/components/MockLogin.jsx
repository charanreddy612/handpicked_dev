// src/components/MockLogin.jsx
import { useState, useEffect } from 'react';

export default function MockLogin({ onAuthChange }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedStatus = localStorage.getItem("mock-login");
    if (savedStatus === "true") {
      setIsLoggedIn(true);
      onAuthChange(true, "AdminUser");
    }
  }, []);

  const handleLogin = () => {
    const nextState = !isLoggedIn;
    setIsLoggedIn(nextState);
    localStorage.setItem("mock-login", nextState.toString());
    onAuthChange(nextState, nextState ? "AdminUser" : "");
  };

  return (
    <button onClick={handleLogin}>
      {isLoggedIn ? "Logout" : "Login"}
    </button>
  );
}