// frontend/src/components/CameraCapture.jsx
import React, { useState } from "react";
import axios from "axios";

function CameraCapture({ onResult, onImagePreview }) {
  const [processing, setProcessing] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL ||
    `${window.location.protocol}//${window.location.hostname}:5000`;

  const handleGallery = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewURL = URL.createObjectURL(file);
    onImagePreview(previewURL); // show image BEFORE processing

    const formData = new FormData();
    formData.append("image", file);

    setProcessing(true);

    try {
      const res = await axios.post(`${API_URL}/api/scan/file`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });
      onResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error processing image.");
    }

    setProcessing(false);
  };

  return (
    <div style={{ textAlign: "center" }}>
      {/* ONLY GALLERY INPUT */}
      <input
        type="file"
        id="galleryInput"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleGallery}
      />

      <label
        htmlFor="galleryInput"
        style={{
          display: "block",
          padding: "12px",
          margin: "8px auto",
          width: "70%",
          background: "#3b82f6",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        🖼️ Choose From Gallery
      </label>

      {processing && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#18a058",
            color: "white",
            borderRadius: 8,
          }}
        >
          Processing...
        </div>
      )}
    </div>
  );
}

export default CameraCapture;
