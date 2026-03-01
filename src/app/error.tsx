"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
      <p style={{ color: "#666" }}>{error.message}</p>
      <button
        type="button"
        onClick={reset}
        style={{ padding: "8px 16px", marginTop: 8, cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
