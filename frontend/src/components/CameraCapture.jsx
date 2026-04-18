import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * CameraCapture
 *
 * Renders a live camera preview and exposes a capture button that returns a
 * base-64 encoded JPEG data URL via the onCapture callback.
 *
 * Props:
 *   onCapture(dataUrl: string) – called with the captured image data URL
 *   className                  – extra Tailwind classes for the wrapper
 */
export function CameraCapture({ onCapture, className }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraState, setCameraState] = useState("idle"); // 'idle' | 'active' | 'error'
  const [errorMsg, setErrorMsg] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // prefer rear camera

  const startCamera = useCallback(async () => {
    setCameraState("idle");
    setErrorMsg(null);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState("active");
    } catch (err) {
      let msg = "Camera access denied.";
      if (err.name === "NotFoundError") msg = "No camera found on this device.";
      else if (err.name === "NotAllowedError") msg = "Camera permission denied.";
      setErrorMsg(msg);
      setCameraState("error");
    }
  }, [facingMode]);

  // Start camera on mount and when facingMode changes
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCapture && onCapture(dataUrl);
  }, [onCapture]);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  return (
    <div className={cn("relative flex flex-col items-center gap-3", className)}>
      {/* Video preview */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border bg-black aspect-[4/3]">
        {cameraState === "active" && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {cameraState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-destructive p-4 text-center">
            <CameraOff className="h-8 w-8" />
            <p className="text-sm">{errorMsg}</p>
            <Button size="sm" variant="outline" onClick={startCamera}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {cameraState === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="h-10 w-10 text-muted-foreground animate-pulse" />
          </div>
        )}

        {/* Flip button (only when camera is active and multiple cameras may exist) */}
        {cameraState === "active" && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-80"
            onClick={toggleCamera}
            aria-label="Flip camera"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hidden canvas used for frame extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Capture button */}
      <Button
        onClick={captureFrame}
        disabled={cameraState !== "active"}
        size="lg"
        className="w-full max-w-sm"
      >
        <Camera className="mr-2 h-5 w-5" />
        Capture Item
      </Button>
    </div>
  );
}
