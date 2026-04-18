import { useEffect, useRef, useState, useCallback } from "react";

const ITEM_LABELS = ["🍎 Food", "👕 Clothing", "🚌 Transportation", "🏠 Shelter"];

/**
 * CameraCapture
 *
 * Camera Consciousness (Dual C) component.
 * Uses navigator.mediaDevices.getUserMedia to activate the device camera,
 * overlays real-time item identification UI, and fires onCapture when the
 * user confirms a visual scan.
 */
export function CameraCapture({ onCapture, isProcessing }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [detectedItem, setDetectedItem] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access."
          : "Camera not available on this device."
      );
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Attach stream to video element when stream changes
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulate Dual C item detection scan.
  // NOTE: This is a placeholder implementation that randomly selects a category label.
  // Full integration requires a real-time on-device AI model (e.g. YOLOv8/custom TFLite)
  // that processes video frames from the camera feed to identify items and their prices.
  const runScan = useCallback(() => {
    setScanning(true);
    setDetectedItem(null);
    setTimeout(() => {
      const label = ITEM_LABELS[Math.floor(Math.random() * ITEM_LABELS.length)];
      setDetectedItem(label);
      setScanning(false);
    }, 1200);
  }, []);

  const handleConfirm = () => {
    if (detectedItem && onCapture) {
      onCapture({ itemLabel: detectedItem });
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden border border-purple-500/40 shadow-2xl bg-black">
      {/* Video feed */}
      {!cameraError ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full object-cover"
          style={{ minHeight: 280 }}
        />
      ) : (
        <div className="flex items-center justify-center bg-gray-900 text-gray-400 text-sm p-6 min-h-[280px]">
          <span>{cameraError}</span>
        </div>
      )}

      {/* Overlay: scanning grid */}
      {stream && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-purple-400 rounded-tl-md" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-purple-400 rounded-tr-md" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-purple-400 rounded-bl-md" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-purple-400 rounded-br-md" />

          {/* Scanning line animation */}
          {scanning && (
            <div
              className="absolute left-4 right-4 h-0.5 bg-purple-400 opacity-80"
              style={{ animation: "scanLine 1.2s linear forwards", top: "40%" }}
            />
          )}

          {/* Detection label */}
          {detectedItem && (
            <div className="absolute bottom-16 left-0 right-0 flex justify-center">
              <span className="bg-purple-900/80 text-purple-200 text-sm font-semibold px-4 py-1 rounded-full border border-purple-400/60">
                {detectedItem} detected
              </span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 pb-4 pt-2 bg-gradient-to-t from-black/80 to-transparent">
        {!detectedItem ? (
          <button
            onClick={runScan}
            disabled={!stream || scanning || isProcessing}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors shadow-lg"
          >
            {scanning ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Scanning…
              </>
            ) : (
              "🔍 Scan Item"
            )}
          </button>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-green-900/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors shadow-lg"
          >
            {isProcessing ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              `✓ Pay for ${detectedItem}`
            )}
          </button>
        )}

        {detectedItem && !isProcessing && (
          <button
            onClick={() => { setDetectedItem(null); runScan(); }}
            className="text-gray-400 hover:text-gray-200 text-xs underline"
          >
            Re-scan
          </button>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 10%; opacity: 1; }
          100% { top: 90%; opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
