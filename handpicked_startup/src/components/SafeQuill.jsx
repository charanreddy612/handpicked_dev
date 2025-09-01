// src/components/common/SafeQuill.jsx
import React, { lazy, Suspense, useEffect, useState } from "react";

// Lazy import so it only loads on client
const ReactQuill = lazy(() => import("react-quill"));
import "react-quill/dist/quill.snow.css";

export default function SafeQuill(props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true);
    }
  }, []);

  if (!mounted) {
    return <div>Loading editor...</div>; // SSR-safe fallback
  }

  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <ReactQuill {...props} />
    </Suspense>
  );
}
