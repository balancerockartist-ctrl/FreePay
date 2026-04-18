import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { useSolanaPayment } from "@/hooks/useSolanaPayment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Apple,
  Shirt,
  Bus,
  Home,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEM_CATEGORIES = [
  { id: "food", label: "Food", icon: Apple, color: "bg-green-100 text-green-700 border-green-300" },
  { id: "clothing", label: "Clothing", icon: Shirt, color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "transport", label: "Transport", icon: Bus, color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { id: "shelter", label: "Shelter", icon: Home, color: "bg-purple-100 text-purple-700 border-purple-300" },
  { id: "other", label: "Other", icon: Package, color: "bg-gray-100 text-gray-700 border-gray-300" },
];

const SOLANA_EXPLORER_BASE = "https://explorer.solana.com/tx";

// Steps: camera → confirm → payment → result
const STEPS = ["camera", "confirm", "payment", "result"];

/**
 * PaymentFlow
 *
 * Full camera-capture → item identification → Solana payment flow.
 */
export function PaymentFlow() {
  const [step, setStep] = useState("camera");
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [amountSol, setAmountSol] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");

  const { sendPayment, status, signature, error, reset } = useSolanaPayment();

  // ── Step helpers ──────────────────────────────────────────────────────────

  const handleCapture = (dataUrl) => {
    setCapturedImage(dataUrl);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!selectedCategory) return;
    setStep("payment");
  };

  const handlePayment = async () => {
    try {
      await sendPayment({
        recipientAddress,
        amountSol: parseFloat(amountSol),
      });
      setStep("result");
    } catch {
      // error state is managed by the hook
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setSelectedCategory(null);
    setAmountSol("");
    setRecipientAddress("");
    reset();
    setStep("camera");
  };

  // ── Renders ───────────────────────────────────────────────────────────────

  if (step === "camera") {
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle>Scan Item</CardTitle>
          <CardDescription>
            Point your camera at the item you want to pay for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CameraCapture onCapture={handleCapture} />
        </CardContent>
      </Card>
    );
  }

  if (step === "confirm") {
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle>Identify Item</CardTitle>
          <CardDescription>
            Select the category that best describes the captured item.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Captured image preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured item"
              className="w-full rounded-lg border border-border object-cover max-h-48"
            />
          )}

          {/* Category grid */}
          <div className="grid grid-cols-3 gap-2">
            {ITEM_CATEGORIES.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setSelectedCategory(id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-all",
                  color,
                  selectedCategory === id
                    ? "ring-2 ring-offset-1 ring-primary scale-105"
                    : "hover:scale-105"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retake
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedCategory}
            className="flex-1"
          >
            Continue
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "payment") {
    const category = ITEM_CATEGORIES.find((c) => c.id === selectedCategory);
    const isPending = status === "connecting" || status === "pending";

    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle>Pay with Solana</CardTitle>
          <CardDescription>
            Enter the recipient address and amount to complete your payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Selected category badge */}
          {category && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <Badge variant="secondary" className="gap-1">
                <category.icon className="h-3 w-3" />
                {category.label}
              </Badge>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recipient">Recipient Solana Address</Label>
            <Input
              id="recipient"
              placeholder="Enter Solana wallet address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              min="0.000001"
              step="0.001"
              placeholder="0.00"
              value={amountSol}
              onChange={(e) => setAmountSol(e.target.value)}
              disabled={isPending}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setStep("confirm")}
            disabled={isPending}
            className="flex-1"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isPending || !recipientAddress || !amountSol}
            className="flex-1"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {status === "connecting" ? "Connecting…" : "Sending…"}
              </>
            ) : (
              "Send Payment"
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "result") {
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Payment Confirmed
          </CardTitle>
          <CardDescription>
            Your Solana transaction was confirmed on devnet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {signature && (
            <>
              <p className="text-xs text-muted-foreground break-all">
                <span className="font-medium">Signature:</span> {signature}
              </p>
              <a
                href={`${SOLANA_EXPLORER_BASE}/${signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary underline"
              >
                View on Solana Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleReset} className="w-full">
            New Payment
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return null;
}
