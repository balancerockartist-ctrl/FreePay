import { useState, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Camera, Calculator, Hash, Infinity } from "lucide-react";
import CameraCapture from "@/components/camera/CameraCapture";
import AbundanceCalculator from "@/components/camera/AbundanceCalculator";
import SolanaTransactionCard from "@/components/camera/SolanaTransactionCard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const linkClass = ({ isActive }) =>
    [
      "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
      isActive
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    ].join(" ");

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-1">
        <span className="flex items-center gap-1.5 font-bold text-base mr-4 select-none">
          <Infinity className="w-5 h-5 text-primary" />
          FreePay
        </span>
        <NavLink to="/" end className={linkClass}>
          <Camera className="w-4 h-4" />
          Camera Pay
        </NavLink>
        <NavLink to="/calculator" className={linkClass}>
          <Calculator className="w-4 h-4" />
          Calculator
        </NavLink>
        <NavLink to="/transaction" className={linkClass}>
          <Hash className="w-4 h-4" />
          Transaction
        </NavLink>
      </div>
    </nav>
  );
}

// ── Pages ─────────────────────────────────────────────────────────────────────

/**
 * Camera Pay – capture an item and initiate a payment.
 */
function CameraPayPage() {
  const [captured, setCaptured] = useState(null);
  const [txState, setTxState] = useState({
    signature: null,
    status: "idle",
    amount: null,
  });
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sample item prices for demo purposes
  const SAMPLE_PRICES = { Food: 12.5, Clothing: 45.0, Shelter: 120.0, Transport: 3.5 };

  const handleCapture = useCallback(async ({ category }) => {
    setError(null);
    setCaptured(category);

    const amount = SAMPLE_PRICES[category.label] ?? 10.0;

    try {
      const res = await fetch(`${API}/camera/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_label: category.label,
          amount,
          currency: "USD",
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setCalculation(data);
    } catch (err) {
      setError(`Could not fetch payment details: ${err.message}`);
    }
  }, []);

  const handlePayClick = useCallback(async () => {
    if (!calculation) return;
    setLoading(true);
    setTxState({ signature: null, status: "pending", amount: null });

    // Simulate a Solana transaction submission (no real signing here –
    // a production app would use a wallet adapter).
    await new Promise((r) => setTimeout(r, 1500));
    const fakeSig = Array.from({ length: 64 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789"[
        Math.floor(Math.random() * 58)
      ]
    ).join("");

    setTxState({
      signature: fakeSig,
      status: "confirmed",
      amount: calculation.consumer_price / 200, // illustrative SOL conversion
    });
    setLoading(false);
  }, [calculation]);

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Camera Pay</h1>
      <p className="text-sm text-muted-foreground text-center">
        Point your camera at an item to identify it and calculate the payment.
      </p>

      <CameraCapture onCapture={handleCapture} className="w-full" />

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {calculation && (
        <AbundanceCalculator
          amount={calculation.original_amount}
          itemLabel={captured?.label ?? calculation.item_label}
          onCalculated={setCalculation}
        />
      )}

      {calculation && txState.status === "idle" && (
        <button
          onClick={handlePayClick}
          disabled={loading}
          className="w-full max-w-md rounded-lg bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {loading ? "Processing…" : `Pay ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(calculation.consumer_price)}`}
        </button>
      )}

      {txState.status !== "idle" && (
        <SolanaTransactionCard
          signature={txState.signature}
          status={txState.status}
          amount={txState.amount}
          itemLabel={captured?.label}
          cluster="devnet"
          className="w-full"
        />
      )}
    </div>
  );
}

/**
 * Calculator – standalone payment split calculator.
 */
function CalculatorPage() {
  const [amount, setAmount] = useState(50);

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Abundance Calculator</h1>
      <p className="text-sm text-muted-foreground text-center">
        See how the 10% instant discount and voluntary tip are applied to any amount.
      </p>

      <div className="flex items-center gap-3 w-full max-w-md">
        <label className="text-sm font-medium whitespace-nowrap">Amount ($)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <AbundanceCalculator amount={amount} itemLabel="Custom Amount" className="w-full" />
    </div>
  );
}

/**
 * Transaction – show a Solana transaction status card.
 */
function TransactionPage() {
  const [sig, setSig] = useState("");
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sig.trim().length >= 43) setSubmitted(sig.trim());
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Transaction Lookup</h1>
      <p className="text-sm text-muted-foreground text-center">
        Enter a Solana transaction signature to view it on the explorer.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
        <input
          value={sig}
          onChange={(e) => setSig(e.target.value)}
          placeholder="Paste transaction signature…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
        />
        <button
          type="submit"
          className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium hover:bg-primary/90 transition"
        >
          Look up
        </button>
      </form>

      <SolanaTransactionCard
        signature={submitted}
        status={submitted ? "confirmed" : "idle"}
        cluster="devnet"
        className="w-full"
      />
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <div className="App min-h-screen bg-background text-foreground">
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<CameraPayPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/transaction" element={<TransactionPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
