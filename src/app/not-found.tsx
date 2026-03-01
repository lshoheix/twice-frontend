import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: 24, maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <h2 style={{ marginTop: 0 }}>404 – Page not found</h2>
      <p style={{ color: "#666" }}>The page you’re looking for doesn’t exist.</p>
      <Link href="/" style={{ color: "#0066cc" }}>
        Back to Dashboard
      </Link>
    </div>
  );
}
