// frontend/src/App.jsx
import React, { useState } from "react";
import CameraCapture from "./components/CameraCapture";
import ResultCard from "./components/ResultCard";

function App() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  // After processing, KEEP image visible
  const handleResult = (data) => {
    setResult(data);
  };

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>Resistor Scanner</h2>

      {/* Choose From Gallery button */}
      <CameraCapture
        onResult={handleResult}
        onImagePreview={setPreview}
      />

      {/* Always show image */}
      {preview && (
        <img
          src={preview}
          alt="Uploaded preview"
          style={{
            width: "60%",
            borderRadius: 10,
            marginTop: 20,
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
          }}
        />
      )}

      {/* Show output */}
      <ResultCard data={result} />
    </div>
  );
}

export default App;
