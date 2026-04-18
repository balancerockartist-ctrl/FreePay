import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, CameraOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Item categories the visual classifier can recognise. */
const ITEM_CATEGORIES = [
  { label: "Food", emoji: "🍎", color: "bg-green-500" },
  { label: "Clothing", emoji: "👕", color: "bg-blue-500" },
  { label: "Shelter", emoji: "🏠", color: "bg-amber-500" },
  { label: "Transport", emoji: "🚌", color: "bg-purple-500" },
];

/**
 * Lightweight client-side classifier stub.
 * In production this would call a real ML model (e.g. via the backend
 * /api/camera/payment endpoint).  Here it returns a deterministic result
 * based on image brightness so the UI flow can be demonstrated without
 * a server round-trip.
 */
function classifyFrame(canvas) {
  const ctx = canvas.getContext("2d");
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  const avg = sum / (data.length / 4);
  const index = Math.floor((avg / 255) * ITEM_CATEGORIES.length) % ITEM_CATEGORIES.length;
  return ITEM_CATEGORIES[index];
}

/**
 * CameraCapture
 *
 * Opens the device camera (back camera preferred), lets the user capture a
 * still frame, then classifies the item and calls `onCapture` with:
 *   { category, dataUrl }
 *
 * Props
 * ─────
 * onCapture(result)  – called when an item is successfully identified
 * className          – optional extra Tailwind classes for the wrapper
 */
export default function CameraCapture({ onCapture, className }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraState, setCameraState] = useState("idle"); // idle | starting | active | error
  const [classifyState, setClassifyState] = useState("idle"); // idle | classifying | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
  }, []);

  // Clean up the stream when the component unmounts
  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    setErrorMsg("");
    setResult(null);
    setPreview(null);
    setClassifyState("idle");
    setCameraState("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");
    } catch (err) {
      setErrorMsg(err.name === "NotAllowedError"
        ? "Camera permission denied. Please allow camera access and try again."
        : `Could not open camera: ${err.message}`);
      setCameraState("error");
    }
  }, []);

  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreview(dataUrl);
    stopCamera();

    setClassifyState("classifying");
    // Yield to the event loop so the UI updates before the (potentially
    // heavy) classification work blocks it.
    await new Promise((r) => setTimeout(r, 300));

    try {
      const category = classifyFrame(canvas);
      setResult(category);
      setClassifyState("done");
      onCapture?.({ category, dataUrl });
    } catch (err) {
      setErrorMsg("Classification failed. Please try again.");
      setClassifyState("error");
    }
  }, [stopCamera, onCapture]);

  const reset = useCallback(() => {
    stopCamera();
    setResult(null);
    setPreview(null);
    setClassifyState("idle");
    setErrorMsg("");
  }, [stopCamera]);

  return (
    <div className={cn("flex flex-col items-center gap-4 w-full", className)}>
      {/* ── Viewfinder / preview ── */}
      <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700">
        {/* Live video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover",
            cameraState === "active" ? "block" : "hidden"
          )}
        />

        {/* Still preview after capture */}
        {preview && (
          <img
            src={preview}
            alt="Captured frame"
            className="w-full h-full object-cover"
          />
        )}

        {/* Idle / error placeholder */}
        {!preview && cameraState !== "active" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400">
            <CameraOff className="w-12 h-12" />
            <span className="text-sm">Camera not active</span>
          </div>
        )}

        {/* Classification overlay */}
        {classifyState === "classifying" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-white">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-sm font-medium">Identifying item…</span>
          </div>
        )}

        {/* Result overlay badge */}
        {result && classifyState === "done" && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <Badge className={cn("text-white text-sm px-3 py-1 gap-1", result.color)}>
              <span>{result.emoji}</span>
              <span>{result.label}</span>
              <CheckCircle2 className="w-4 h-4 ml-1" />
            </Badge>
          </div>
        )}
      </div>

      {/* Hidden canvas used for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Error message ── */}
      {errorMsg && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-3">
        {cameraState === "idle" && classifyState !== "done" && (
          <Button onClick={startCamera} className="gap-2">
            <Camera className="w-4 h-4" />
            Open Camera
          </Button>
        )}

        {cameraState === "starting" && (
          <Button disabled className="gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Starting…
          </Button>
        )}

        {cameraState === "active" && (
          <Button onClick={captureFrame} className="gap-2">
            <Camera className="w-4 h-4" />
            Capture
          </Button>
        )}

        {(classifyState === "done" || cameraState === "error" || classifyState === "error") && (
          <Button variant="outline" onClick={reset} className="gap-2">
            Retake
          </Button>
        )}
      </div>

      {/* ── Category legend ── */}
      <div className="flex flex-wrap justify-center gap-2 mt-1">
        {ITEM_CATEGORIES.map((cat) => (
          <Badge
            key={cat.label}
            variant="secondary"
            className={cn(
              "text-white gap-1 transition-opacity",
              result && result.label !== cat.label ? "opacity-30" : "opacity-100",
              cat.color
            )}
          >
            {cat.emoji} {cat.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
