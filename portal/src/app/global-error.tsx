"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ maxWidth: "40ch", color: "#666" }}>
          The application failed to load. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: "2.75rem",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.5rem",
            border: "1px solid #999",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {error.digest ? (
          <code style={{ fontSize: "0.75rem", color: "#999" }}>
            {error.digest}
          </code>
        ) : null}
      </body>
    </html>
  );
}
