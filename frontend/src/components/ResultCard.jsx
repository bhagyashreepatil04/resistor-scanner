// frontend/src/components/ResultCard.jsx
import React from "react";

function ResultCard({ data }) {
  if (!data) return null;

  return (
    <div
      style={{
        marginTop: 20,
        padding: 20,
        borderRadius: 16,
        background: "#ffffff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        textAlign: "center",
        maxWidth: 380,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <p style={{ fontSize: 18 }}>
        <b>Bands:</b> {data.band1_color} {data.band2_color}{" "}
        {data.multiplier_color} {data.tolerance_color}
      </p>

      <p style={{ fontSize: 18 }}>
        <b>Value:</b> {data.resistance_ohms} Ω
      </p>

      <p style={{ fontSize: 18 }}>
        <b>Tolerance:</b> {data.tolerance_percentage}
      </p>
    </div>
  );
}

export default ResultCard;
