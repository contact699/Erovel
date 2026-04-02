import { ImageResponse } from "next/og";

export const alt = "Erovel - Stories that ignite";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0c0a09",
          color: "#f5f0eb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "12px",
              backgroundColor: "#1c1917",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: "bold",
              color: "#d4a574",
              fontFamily: "Georgia, serif",
            }}
          >
            E
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              letterSpacing: "-1px",
            }}
          >
            Erovel
          </span>
        </div>
        <p
          style={{
            fontSize: "28px",
            color: "#d4a574",
            marginTop: "0",
          }}
        >
          Stories that ignite
        </p>
        <p
          style={{
            fontSize: "18px",
            color: "#a8a29e",
            marginTop: "16px",
            maxWidth: "600px",
            textAlign: "center",
          }}
        >
          A platform for adult fiction creators and readers.
          Prose and chat-style stories with creator monetization.
        </p>
      </div>
    ),
    { ...size }
  );
}
