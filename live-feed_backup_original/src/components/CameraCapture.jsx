import React, { useState, useRef, useCallback } from "react";
import { processPhoto, formatSize } from "../utils/imageProcessor";
import defaultWatermark from "../assets/watermark-frame.png";

/**
 * CameraCapture — Componente que gestiona la captura de foto,
 * compresión, previsualización con marca de agua y callback al padre.
 *
 * Props:
 *  - watermarkUrl: URL del PNG de marca de agua del evento (o null para default)
 *  - onPhotoReady: fn(blob, previewDataUrl) → callback cuando la foto está lista
 *  - disabled: boolean
 */
export default function CameraCapture({ watermarkUrl, onPhotoReady, disabled }) {
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState(null);
  const [finalSize, setFinalSize] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setProcessing(true);
    setOriginalSize(file.size);
    setPreview(null);

    try {
      const wmUrl = watermarkUrl || defaultWatermark;
      const processedBlob = await processPhoto(file, wmUrl);
      setFinalSize(processedBlob.size);

      // Generar preview del resultado final
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setPreview(dataUrl);
        onPhotoReady?.(processedBlob, dataUrl);
      };
      reader.readAsDataURL(processedBlob);
    } catch (err) {
      setError("No se pudo procesar la foto. Intentá de nuevo.");
      console.error(err);
    } finally {
      setProcessing(false);
      // Reset input para permitir la misma foto de vuelta
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [watermarkUrl, onPhotoReady]);

  const handleRetake = () => {
    setPreview(null);
    setOriginalSize(null);
    setFinalSize(null);
    setError(null);
    inputRef.current?.click();
  };

  return (
    <div className="camera-capture">
      {!preview && !processing && (
        <div className="camera-trigger">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={disabled}
            style={{ display: "none" }}
            id="camera-input"
          />
          <label
            htmlFor="camera-input"
            className={`btn-camera ${disabled ? "btn-camera--disabled" : ""}`}
          >
            <span className="camera-icon">📷</span>
            <span>Sacar foto</span>
          </label>
          <p className="camera-hint">La cámara trasera se abre automáticamente</p>
        </div>
      )}

      {processing && (
        <div className="camera-processing">
          <div className="spinner" />
          <p>Procesando foto...</p>
          <p className="processing-sub">Aplicando compresión y marca de agua</p>
        </div>
      )}

      {preview && !processing && (
        <div className="camera-preview">
          <div className="preview-wrapper">
            <img src={preview} alt="Vista previa" className="preview-image" />
            <div className="preview-badge">
              {originalSize && finalSize && (
                <span className="size-tag">
                  {formatSize(originalSize)} → {formatSize(finalSize)} ✓
                </span>
              )}
            </div>
          </div>
          <button className="btn-retake" onClick={handleRetake}>
            🔄 Sacar otra
          </button>
        </div>
      )}

      {error && (
        <div className="camera-error">
          <p>{error}</p>
          <button className="btn-retry" onClick={() => inputRef.current?.click()}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
