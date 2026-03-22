import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, rgb(251, 248, 241), rgb(229, 223, 214))",
          color: "rgb(24, 21, 17)",
          fontSize: 92,
          fontWeight: 800,
          letterSpacing: "-0.05em",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 360,
            width: 360,
            borderRadius: 72,
            border: "12px solid rgb(93, 88, 81)",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 30px 80px rgba(24,21,17,0.16)",
          }}
        >
          PT
        </div>
      </div>
    ),
    size,
  );
}
