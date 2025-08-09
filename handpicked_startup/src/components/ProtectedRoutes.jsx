import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("auth");

    if (!auth) {
      window.location.href = "/login";
    } else {
      setCheckingAuth(false);
    }
  }, []);

  if (checkingAuth) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "1.2rem",
        color: "#555"
      }}>
        Loading...
      </div>
    );
  }

  return children;
}