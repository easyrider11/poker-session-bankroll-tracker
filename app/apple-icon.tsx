import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "rgb(244, 240, 231)",
          color: "rgb(24, 21, 17)",
          fontSize: 54,
          fontWeight: 800,
          letterSpacing: "-0.05em",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 128,
            width: 128,
            borderRadius: 32,
            border: "6px solid rgb(93, 88, 81)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          PT
        </div>
      </div>
    ),
    size,
  );
}
