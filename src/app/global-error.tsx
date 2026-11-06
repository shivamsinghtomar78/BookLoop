"use client";

// Root error boundary: only catches errors thrown above the (main) layout,
// so it ships its own html/body. The everyday boundary is app/error.tsx.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          background: "#faf9f5",
          color: "#222",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "#def7ec",
            color: "#057a55",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
          aria-hidden
        >
          BL
        </div>
        <h1 style={{ fontSize: 24, margin: 0 }}>BookLoop hit a snag</h1>
        <p style={{ maxWidth: 360, color: "#484848" }}>
          Your books are safe. Reload the page — if it keeps happening, tell us
          from your profile.
        </p>
        {error.digest && (
          <p style={{ fontSize: 12, color: "#767676" }}>Reference: {error.digest}</p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: 8,
            padding: "10px 18px",
            borderRadius: 8,
            border: 0,
            background: "#057a55",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
