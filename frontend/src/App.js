import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { CameraCapture } from "@/components/CameraCapture";
import { TransactionFeed } from "@/components/TransactionFeed";
import { useSolanaPayment } from "@/hooks/useSolanaPayment";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ── Formatting helpers ─────────────────────────────────────────────
const formatAmount = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const statusVariant = {
  completed: "default",
  pending: "secondary",
  failed: "destructive",
};

// ── Savings panel ──────────────────────────────────────────────────
const AMOUNT_PRESETS = [10, 25, 50, 100];

function SavingsPanel({ amount }) {
  const [savings, setSavings] = useState(null);

  useEffect(() => {
    if (!amount) return;
    axios
      .get(`${API}/savings/calculate`, { params: { amount } })
      .then(({ data }) => setSavings(data))
      .catch(() => {});
  }, [amount]);

  if (!savings) return null;

  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {[
        { label: "You Pay", value: `$${savings.consumer_price}`, color: "text-green-400" },
        { label: "Merchant Gets", value: `$${savings.retailer_credit}`, color: "text-blue-400" },
        { label: "Protocol Absorbs", value: `$${savings.protocol_absorption}`, color: "text-purple-400" },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-3 text-center">
          <div className={`text-lg font-bold ${color}`}>{value}</div>
          <div className="text-gray-500 text-xs mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main home page ─────────────────────────────────────────────────
function Home() {
  const [amount, setAmount] = useState(25);
  const [walletAddress, setWalletAddress] = useState("");
  const [lastTx, setLastTx] = useState(null);
  const [feedKey, setFeedKey] = useState(0);
  const { processPayment, isProcessing, error } = useSolanaPayment();

  const handleCapture = async ({ itemLabel }) => {
    try {
      const tx = await processPayment({
        itemLabel,
        amount,
        walletAddress: walletAddress || undefined,
      });
      setLastTx(tx);
      setFeedKey((k) => k + 1);
    } catch {
      // error shown via `error` state from hook
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-950/90 backdrop-blur border-b border-gray-800/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♾️</span>
          <span className="font-bold text-lg tracking-tight">Free Pay</span>
          <span className="text-xs text-purple-400 bg-purple-900/30 border border-purple-700/40 rounded-full px-2 py-0.5 ml-1">7G</span>
        </div>
        <span className="text-xs text-gray-500">CC0 · SOLANA</span>
        <Link to="/dashboard" className="text-xs text-gray-400 hover:text-gray-200 underline">
          Dashboard →
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Camera Consciousness */}
        <section>
          <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">
            📷 Camera Consciousness (Dual C)
          </h2>
          <CameraCapture onCapture={handleCapture} isProcessing={isProcessing} />
        </section>

        {/* Amount selector */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Purchase Amount
          </h2>
          <div className="flex gap-2 flex-wrap">
            {AMOUNT_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  amount === p
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-gray-900 border-gray-700 text-gray-300 hover:border-purple-500"
                }`}
              >
                ${p}
              </button>
            ))}
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-24 px-3 py-1.5 rounded-full text-sm bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-purple-500"
              placeholder="Custom"
            />
          </div>
          <SavingsPanel amount={amount} />
        </section>

        {/* Optional wallet address */}
        <section>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">
            Wallet Address <span className="text-gray-600 normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Solana wallet address…"
            className="w-full px-4 py-2 rounded-xl text-sm bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-600"
          />
        </section>

        {/* Last transaction confirmation */}
        {lastTx && (
          <section className="bg-green-950/40 border border-green-700/40 rounded-2xl p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-green-400 mb-2">
              <span>✅</span> Transaction Confirmed
            </div>
            <div className="space-y-1 text-gray-300">
              <div>Item: <span className="text-white">{lastTx.item_label}</span></div>
              <div>You paid: <span className="text-green-400 font-semibold">${lastTx.consumer_price}</span></div>
              <div>Retailer received: <span className="text-blue-400 font-semibold">${lastTx.retailer_credit}</span></div>
              <div className="text-gray-500 font-mono text-xs truncate mt-1">
                TX: {lastTx.tx_hash}
              </div>
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/40 border border-red-700/40 rounded-xl p-3 text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}

        {/* Zero-Latency Transaction Feed */}
        <section>
          <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">
            ⚡ Zero-Latency Feed · SOLANA
          </h2>
          <TransactionFeed key={feedKey} />
        </section>
      </main>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────
const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [acctRes, txRes] = await Promise.all([
        axios.get(`${API}/accounts`),
        axios.get(`${API}/transactions`, {
          params: selectedAccount ? { account_id: selectedAccount } : {},
        }),
      ]);
      setAccounts(acctRes.data);
      setTransactions(txRes.data);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Failed to load data from the API.");
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">FreePay Dashboard</h1>
        <Link to="/" className="text-sm text-purple-400 hover:text-purple-300 underline">
          ← Camera Consciousness
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Balance summary cards */}
      <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAmount(totalBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {accounts.map((account) => (
          <Card
            key={account.id}
            className={`cursor-pointer transition-colors ${
              selectedAccount === account.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() =>
              setSelectedAccount(
                selectedAccount === account.id ? null : account.id
              )
            }
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {account.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatAmount(account.balance, account.currency)}
              </p>
              {account.owner && (
                <p className="text-xs text-muted-foreground mt-1">
                  {account.owner}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction list */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedAccount
              ? `Transactions — ${
                  accounts.find((a) => a.id === selectedAccount)?.name ??
                  "Account"
                }`
              : "All Transactions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 pr-4 text-left font-medium">Date</th>
                    <th className="py-2 pr-4 text-left font-medium">Description</th>
                    <th className="py-2 pr-4 text-left font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="py-2 pr-4">{tx.description || "—"}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={statusVariant[tx.status] ?? "outline"}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td
                        className={`py-2 text-right font-mono ${
                          tx.amount >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {formatAmount(tx.amount, tx.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

