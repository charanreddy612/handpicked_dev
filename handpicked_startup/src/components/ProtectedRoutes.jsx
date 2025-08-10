import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // This runs only in the browser
    setIsClient(true);
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
    } else {
      window.location.href = "/login";
    }
  }, []);

  if (!isClient) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
