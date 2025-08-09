// LoginStatus.jsx
import { useState, useEffect } from 'react';

export default function LoginStatus() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Mock login check
    const storedUser = localStorage.getItem('username');
    if (storedUser) {
      setUsername(storedUser);
      setLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('username');
    setLoggedIn(false);
    setUsername('');
  };

  return (
    <div>
      {loggedIn ? (
        <div>
          Welcome, <strong>{username}</strong> |
          <button onClick={handleLogout} aria-label="Logout">Logout</button>
        </div>
      ) : (
        <a href="/login" aria-label="Login Link">Login</a>
      )}
    </div>
  );
}