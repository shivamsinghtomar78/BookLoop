// Social card for link previews (WhatsApp is how students will share this).

import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "BookLoop — give every book a second life";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #07231c 0%, #04170f 100%)",
          padding: "72px 80px",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "rgba(186,245,212,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: 11,
                height: 26,
                borderRadius: 3,
                background: "#baf5d4",
                transform: "skewY(-7deg)",
              }}
            />
            <div
              style={{
                width: 11,
                height: 26,
                borderRadius: 3,
                background: "#baf5d4",
                transform: "skewY(7deg)",
              }}
            />
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1, display: "flex" }}>
            Book<span style={{ color: "#baf5d4" }}>Loop</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1.02,
              fontWeight: 500,
              letterSpacing: -2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            Give every book
            <span style={{ color: "#baf5d4", fontStyle: "italic" }}>a second life.</span>
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.62)" }}>
            Buy · sell · exchange · donate — inside your own school.
          </div>
        </div>

        <div style={{ display: "flex", gap: 28, fontSize: 22, color: "rgba(255,255,255,0.5)" }}>
          <span>Classes 1–12</span>
          <span>·</span>
          <span>No phone numbers</span>
          <span>·</span>
          <span>Free for students</span>
        </div>
      </div>
    ),
    size,
  );
}
