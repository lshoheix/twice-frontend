"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: '"Pretendard", "Prompt", system-ui, sans-serif', padding: 24 }}>
        <h2>Application error</h2>
        <p>{error.message}</p>
        <button type="button" onClick={reset} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
