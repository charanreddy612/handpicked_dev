// src/components/common/TiptapEditor.jsx
import React, { Suspense } from "react";

const TiptapEditor = React.lazy(() => import("./TiptapEditor.client.jsx"));

export default function WrappedTiptap(props) {
  return (
    <Suspense fallback={<div>Loading editor…</div>}>
      <TiptapEditor {...props} />
    </Suspense>
  );
}
