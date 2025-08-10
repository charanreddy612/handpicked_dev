import React from "react";

export default function Footer({ version = "v1.0.0"}) {
  return (
    <footer
      role="contentinfo"
      aria-label="Application Footer"
      className={`p-4 text-center text-sm border-t bg-gray-900 text-gray-300 border-gray-700`}
    >
      <p>© 2025 Handpicked Startup | Admin Panel</p>
      <p>Version: {version}</p>
    </footer>
  );
}