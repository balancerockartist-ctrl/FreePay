import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ITEM_CATEGORIES = [
  { label: "Hotel", icon: "🏨" },
  { label: "Food", icon: "🍽️" },
  { label: "Housing", icon: "🏠" },
  { label: "Water", icon: "💧" },
  { label: "Medical", icon: "🏥" },
];

const SMART_CONTRACT_CODE = `if (dualC_verified == true)
  execute_credit_release()
  pool.withdraw(item_price)
  blockchain.confirm(tx)
  lifetime_membership.unlock(24h)`;

function StatusDot({ active }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-2 ${
        active ? "bg-green-400 animate-pulse" : "bg-gray-500"
      }`}
    />
  );
}

function FreePayDashboard() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [scanStatus, setScanStatus] = useState("STANDBY");
  const [dualCVerified, setDualCVerified] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [poolAmount] = useState(0.0);
  const [incomingTips] = useState(0.0);
  const [dailyCapacityPct] = useState(0);
  const pendingTimersRef = useRef([]);

  const systemStatus = [
    { label: "Google Lens Integration", ready: true },
    { label: "Sensor Array", ready: true },
    { label: "Block Chain Link", ready: true },
  ];

  const clearAllTimers = () => {
    pendingTimersRef.current.forEach((id) => clearTimeout(id));
    pendingTimersRef.current = [];
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setScanStatus("SCANNING");
    setDualCVerified(false);

    // Cancel any in-flight scan sequence
    clearAllTimers();

    // Simulate camera scan sequence
    const outerTimer = setTimeout(() => {
      setScanStatus("VERIFYING");
      const innerTimer = setTimeout(() => {
        setDualCVerified(true);
        setScanStatus("VERIFIED");
        logTransaction(category);
      }, 1500);
      pendingTimersRef.current.push(innerTimer);
    }, 2000);
    pendingTimersRef.current.push(outerTimer);
  };

  const logTransaction = (category) => {
    const tx = {
      id: `tx-${Date.now()}`,
      category: category.label,
      timestamp: new Date().toLocaleTimeString(),
      status: "confirmed",
      amount: "$0.00",
    };
    setTransactions((prev) => [tx, ...prev].slice(0, 20));

    // Persist a status check to the backend
    axios
      .post(`${API}/status`, { client_name: `freepay-scan-${category.label.toLowerCase()}` })
      .catch((err) => console.error("FreePay: status POST failed", err));
  };

  const handleReset = () => {
    clearAllTimers();
    setSelectedCategory(null);
    setScanStatus("STANDBY");
    setDualCVerified(false);
  };

  useEffect(() => {
    return () => clearAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanStatusColor = {
    STANDBY: "bg-gray-700 text-gray-300",
    SCANNING: "bg-yellow-600 text-yellow-100 animate-pulse",
    VERIFYING: "bg-blue-600 text-blue-100 animate-pulse",
    VERIFIED: "bg-green-600 text-green-100",
  }[scanStatus];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 font-mono">
      <h1 className="text-center text-2xl font-bold tracking-widest text-cyan-400 mb-6">
        ⚡ FreePay Terminal
      </h1>

      {/* Item Categories */}
      <Card className="bg-gray-900 border-gray-700 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-300 tracking-widest uppercase">
            Point Camera at Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ITEM_CATEGORIES.map((cat) => (
              <Button
                key={cat.label}
                variant={selectedCategory?.label === cat.label ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategorySelect(cat)}
                className={`border-gray-600 text-gray-200 hover:bg-cyan-800 hover:text-white ${
                  selectedCategory?.label === cat.label
                    ? "bg-cyan-700 border-cyan-500 text-white"
                    : "bg-gray-800"
                }`}
              >
                {cat.icon} {cat.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dual C Verification + Scan Status */}
      <Card className="bg-gray-900 border-gray-700 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-300 tracking-widest uppercase">
            Dual C Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-400 text-sm">
            {scanStatus === "STANDBY"
              ? "Waiting for camera scan..."
              : scanStatus === "SCANNING"
              ? `Scanning item: ${selectedCategory?.icon} ${selectedCategory?.label}...`
              : scanStatus === "VERIFYING"
              ? "Running dual-channel verification..."
              : `Verified: ${selectedCategory?.icon} ${selectedCategory?.label}`}
          </p>

          <div
            className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold tracking-widest ${scanStatusColor}`}
          >
            {scanStatus}
          </div>

          <Separator className="bg-gray-700" />

          <div className="space-y-1">
            {systemStatus.map((s) => (
              <div key={s.label} className="flex items-center text-xs text-gray-300">
                <StatusDot active={s.ready} />
                {s.label}{" "}
                <span className="ml-1 text-green-400 font-semibold">
                  {s.ready ? "Ready" : "Offline"}
                </span>
              </div>
            ))}
          </div>

          {scanStatus !== "STANDBY" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-gray-400 hover:text-white mt-1"
            >
              ↩ Reset
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Credit Pool & Smart Contract */}
      <Card className="bg-gray-900 border-gray-700 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-300 tracking-widest uppercase">
            Credit Pool &amp; Smart Contract
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Available Pool */}
            <div className="bg-gray-800 rounded p-3">
              <p className="text-xs text-gray-400 mb-1">Available Pool</p>
              <p className="text-xl font-bold text-green-400">
                ${poolAmount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {dailyCapacityPct}% of daily capacity
              </p>
              <div className="w-full h-1 bg-gray-700 rounded mt-2">
                <div
                  className="h-1 bg-green-500 rounded"
                  style={{ width: `${dailyCapacityPct}%` }}
                />
              </div>
            </div>

            {/* Incoming Tips */}
            <div className="bg-gray-800 rounded p-3">
              <p className="text-xs text-gray-400 mb-1">Incoming Tips (24h)</p>
              <p className="text-xl font-bold text-cyan-400">
                ${incomingTips.toFixed(2)}
              </p>
              <Badge
                variant="outline"
                className="mt-2 text-xs border-cyan-700 text-cyan-400"
              >
                LIVE
              </Badge>
            </div>
          </div>

          {/* Smart Contract Execution */}
          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">
              Smart Contract Execution
            </p>
            <pre
              className={`text-xs p-3 rounded border ${
                dualCVerified
                  ? "bg-green-950 border-green-700 text-green-300"
                  : "bg-gray-800 border-gray-600 text-gray-400"
              } whitespace-pre-wrap`}
            >
              {SMART_CONTRACT_CODE}
            </pre>
            {dualCVerified && (
              <p className="text-xs text-green-400 mt-1 animate-pulse">
                ✓ Contract executed — transaction confirmed on-chain
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Transactions */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-300 tracking-widest uppercase">
            Real-Time Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-4">
              No transactions yet. Select a category to begin scanning.
            </p>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between bg-gray-800 rounded px-3 py-2 text-xs"
                  >
                    <span className="text-gray-300">
                      {ITEM_CATEGORIES.find((c) => c.label === tx.category)?.icon}{" "}
                      {tx.category}
                    </span>
                    <span className="text-gray-500">{tx.timestamp}</span>
                    <span className="text-green-400 font-semibold">{tx.amount}</span>
                    <Badge
                      variant="outline"
                      className="border-green-700 text-green-400 text-xs"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FreePayDashboard;
