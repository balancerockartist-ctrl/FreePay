import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Camera, Wifi, Activity, Link2, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = ["Hotel", "Food", "Housing", "Water", "Medical"];

const SMART_CONTRACT_CODE = `if (dualC_verified == true)
  execute_credit_release()
  pool.withdraw(item_price)
  blockchain.confirm(tx)
  lifetime_membership.unlock(24h)`;

const StatusDot = ({ active }) => (
  <span
    className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${
      active ? "bg-green-400 shadow-[0_0_6px_#4ade80]" : "bg-gray-600"
    }`}
  />
);

export default function FreePayDashboard() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [scanState, setScanState] = useState("idle"); // idle | scanning | scanned | verifying | verified | failed
  const [scanResult, setScanResult] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [pool, setPool] = useState({ available_balance: 0, daily_capacity: 5000, capacity_used_pct: 0, incoming_tips_24h: 0 });
  const [transactions, setTransactions] = useState([]);
  const [sensorReady, setSensorReady] = useState(false);
  const [chainReady, setChainReady] = useState(false);
  const scanTimer = useRef(null);

  // Simulate system boot — sensors come online after mount
  useEffect(() => {
    const t1 = setTimeout(() => setSensorReady(true), 1200);
    const t2 = setTimeout(() => setChainReady(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const fetchPool = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/pool`);
      setPool(data);
    } catch {
      // keep previous value
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/transactions`);
      setTransactions(data);
    } catch {
      // keep previous value
    }
  }, []);

  // Poll pool + transactions every 5 s
  useEffect(() => {
    fetchPool();
    fetchTransactions();
    const id = setInterval(() => { fetchPool(); fetchTransactions(); }, 5000);
    return () => clearInterval(id);
  }, [fetchPool, fetchTransactions]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setScanState("idle");
    setScanResult(null);
    setVerifyResult(null);
  };

  const handleScan = async () => {
    if (!selectedCategory) return;
    setScanState("scanning");
    setScanResult(null);
    setVerifyResult(null);

    // Simulate camera scan delay (1.5 s)
    scanTimer.current = setTimeout(async () => {
      try {
        const { data } = await axios.post(`${API}/scan`, { item_category: selectedCategory });
        setScanResult(data);
        setScanState("scanned");
      } catch {
        setScanState("failed");
      }
    }, 1500);
  };

  const handleVerify = async () => {
    if (!scanResult) return;
    setScanState("verifying");
    try {
      const { data } = await axios.post(`${API}/verify`, { scan_id: scanResult.scan_id });
      setVerifyResult(data);
      setScanState(data.dual_c_verified ? "verified" : "failed");
      if (data.dual_c_verified) {
        fetchPool();
        fetchTransactions();
      }
    } catch {
      setScanState("failed");
    }
  };

  const handleReset = () => {
    if (scanTimer.current) clearTimeout(scanTimer.current);
    setScanState("idle");
    setScanResult(null);
    setVerifyResult(null);
    setSelectedCategory(null);
  };

  const scanLabel = {
    idle: "STANDBY",
    scanning: "SCANNING...",
    scanned: "ITEM DETECTED",
    verifying: "VERIFYING...",
    verified: "VERIFIED ✓",
    failed: "SCAN FAILED",
  }[scanState];

  const scanColor = {
    idle: "text-gray-400",
    scanning: "text-yellow-400 animate-pulse",
    scanned: "text-blue-400",
    verifying: "text-yellow-400 animate-pulse",
    verified: "text-green-400",
    failed: "text-red-400",
  }[scanState];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-mono">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <Camera className="text-cyan-400" size={22} />
        <span className="text-lg font-semibold tracking-widest text-cyan-400">FREEPAY</span>
        <span className="text-gray-500 text-sm ml-2">v1.0 · Dual-C Verified Payment System</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left Column ─────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Point Camera at Item */}
          <div className="bg-[#0f0f1a] border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-4">
              Point Camera at Item
            </h2>
            <div className="grid grid-cols-5 gap-2 mb-5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`py-2 px-1 text-xs rounded-lg border transition-all ${
                    selectedCategory === cat
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                      : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Camera Viewfinder */}
            <div
              className={`relative rounded-xl border-2 transition-all duration-500 overflow-hidden ${
                scanState === "scanning" || scanState === "verifying"
                  ? "border-yellow-500/70"
                  : scanState === "verified"
                  ? "border-green-500/70"
                  : scanState === "failed"
                  ? "border-red-500/70"
                  : scanState === "scanned"
                  ? "border-blue-500/70"
                  : "border-gray-700"
              }`}
              style={{ aspectRatio: "4/3" }}
            >
              {/* Viewfinder grid overlay */}
              <div className="absolute inset-0 bg-[#050510]">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-gray-800/50" />
                  ))}
                </div>
              </div>

              {/* Scanning beam */}
              {(scanState === "scanning" || scanState === "verifying") && (
                <div className="absolute inset-x-0 h-0.5 bg-cyan-400/70 shadow-[0_0_12px_#22d3ee] animate-[scanBeam_1.5s_ease-in-out_infinite]" />
              )}

              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-500/60" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-500/60" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-500/60" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-500/60" />

              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                {scanState === "idle" && (
                  <p className="text-gray-500 text-sm">
                    {selectedCategory ? `Select "${selectedCategory}" and scan` : "Select a category above"}
                  </p>
                )}
                {scanState === "scanned" && scanResult && (
                  <div className="text-center px-4">
                    <p className="text-blue-300 text-sm font-semibold">{scanResult.item_name}</p>
                    <p className="text-white text-xl font-bold mt-1">${scanResult.item_price.toFixed(2)}</p>
                    <p className="text-gray-500 text-xs mt-1">{scanResult.item_category}</p>
                  </div>
                )}
                {scanState === "verified" && verifyResult && (
                  <div className="text-center px-4">
                    <CheckCircle2 className="text-green-400 mx-auto mb-2" size={32} />
                    <p className="text-green-300 text-sm font-semibold">Credit Released</p>
                    <p className="text-gray-400 text-xs mt-1 break-all">
                      {verifyResult.tx_hash?.slice(0, 20)}…
                    </p>
                  </div>
                )}
                {scanState === "failed" && (
                  <div className="text-center">
                    <XCircle className="text-red-400 mx-auto mb-2" size={32} />
                    <p className="text-red-300 text-sm">Scan failed — try again</p>
                  </div>
                )}
              </div>

              {/* State label bottom */}
              <div className={`absolute bottom-3 left-0 right-0 text-center text-xs tracking-widest ${scanColor}`}>
                {scanLabel}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleScan}
                disabled={!selectedCategory || scanState === "scanning" || scanState === "verifying"}
                className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
              >
                {scanState === "scanning" ? "Scanning…" : "Scan Item"}
              </button>
              <button
                onClick={handleReset}
                className="py-2.5 px-3 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white transition-all"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Dual C Verification */}
          <div className="bg-[#0f0f1a] border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-4">
              Dual C Verification
            </h2>

            {/* Waiting / verified banner */}
            <div className={`rounded-lg px-4 py-3 mb-4 text-center text-sm font-semibold tracking-widest transition-all ${
              scanState === "verified"
                ? "bg-green-900/30 border border-green-700 text-green-400"
                : scanState === "scanned"
                ? "bg-blue-900/30 border border-blue-700 text-blue-400"
                : scanState === "verifying"
                ? "bg-yellow-900/30 border border-yellow-700 text-yellow-400 animate-pulse"
                : "bg-gray-900/50 border border-gray-700 text-gray-500"
            }`}>
              {scanState === "verified"
                ? "DUAL-C VERIFIED ✓"
                : scanState === "scanned"
                ? "READY TO VERIFY"
                : scanState === "verifying"
                ? "VERIFYING…"
                : "Waiting for camera scan…"}
            </div>

            {/* Status indicators */}
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-center">
                <StatusDot active={true} />
                <Wifi size={14} className="mr-2 text-gray-500" />
                Google Lens Integration Ready
              </li>
              <li className="flex items-center">
                <StatusDot active={sensorReady} />
                <Activity size={14} className="mr-2 text-gray-500" />
                Sensor Array Active
              </li>
              <li className="flex items-center">
                <StatusDot active={chainReady} />
                <Link2 size={14} className="mr-2 text-gray-500" />
                Block Chain Link Ready
              </li>
            </ul>

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={scanState !== "scanned" || !sensorReady || !chainReady}
              className="w-full py-2.5 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
            >
              {scanState === "verifying" ? "Verifying…" : "Run Dual-C Verification"}
            </button>
          </div>
        </div>

        {/* ── Right Column ────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Credit Pool & Smart Contract */}
          <div className="bg-[#0f0f1a] border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-4">
              Credit Pool &amp; Smart Contract
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Available Pool */}
              <div className="bg-gray-900/60 rounded-lg p-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Available Pool</p>
                <p className="text-2xl font-bold text-white">
                  ${pool.available_balance.toFixed(2)}
                </p>
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-700"
                      style={{ width: `${pool.capacity_used_pct}%` }}
                    />
                  </div>
                  <p className="text-gray-600 text-xs mt-1">
                    {pool.capacity_used_pct}% of daily capacity
                  </p>
                </div>
              </div>

              {/* Incoming Tips */}
              <div className="bg-gray-900/60 rounded-lg p-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Incoming Tips (24h)</p>
                <p className="text-2xl font-bold text-white">
                  ${pool.incoming_tips_24h.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Smart Contract Execution */}
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                Smart Contract Execution
              </p>
              <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-green-400 overflow-x-auto leading-relaxed">
                {SMART_CONTRACT_CODE}
              </pre>
            </div>
          </div>

          {/* Real-Time Transactions */}
          <div className="bg-[#0f0f1a] border border-gray-800 rounded-xl p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-gray-400 uppercase tracking-widest">
                Real-Time Transactions
              </h2>
              <button
                onClick={fetchTransactions}
                className="text-gray-600 hover:text-gray-400 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-700">
                <Clock size={32} className="mb-3" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <li
                    key={tx.tx_id}
                    className="flex items-center justify-between bg-gray-900/60 rounded-lg px-3 py-2.5 text-sm"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-white font-semibold truncate">{tx.item_name}</span>
                      <span className="text-gray-500 text-xs">{tx.item_category}</span>
                      {tx.tx_hash && (
                        <span className="text-gray-700 text-xs font-mono truncate">
                          {tx.tx_hash.slice(0, 18)}…
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-0.5 ml-4 shrink-0">
                      <span className="text-white font-bold">${tx.amount.toFixed(2)}</span>
                      <span
                        className={`text-xs ${
                          tx.status === "settled"
                            ? "text-green-400"
                            : tx.status === "failed"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanBeam {
          0%   { top: 10%; }
          50%  { top: 85%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}
