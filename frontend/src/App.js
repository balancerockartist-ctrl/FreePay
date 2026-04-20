import { useState, useEffect, useRef, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Sample items for simulation ──────────────────────────────────────────────
const SAMPLE_ITEMS = [
  { name: "Organic Coffee Beans", category: "Groceries", price: 14.99, safetyScore: 98 },
  { name: "Wireless Earbuds", category: "Electronics", price: 49.99, safetyScore: 95 },
  { name: "Yoga Mat", category: "Fitness", price: 29.99, safetyScore: 99 },
  { name: "Novel - The Alchemist", category: "Books", price: 12.99, safetyScore: 97 },
  { name: "Vitamin D3 Supplement", category: "Health", price: 18.99, safetyScore: 96 },
];

const DAILY_CAPACITY = 500;
const MEMBERSHIP_DURATION = 24 * 60 * 60; // 24 hours in seconds

// ─── Utility: generate a fake Dual-C hash ─────────────────────────────────────
function generateDualCHash(item) {
  const base = `${item.name}-${item.price}-${Date.now()}`;
  return Array.from(base)
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) & 0xffffffff, 0)
    .toString(16)
    .padStart(8, "0")
    .repeat(4)
    .slice(0, 32)
    .toUpperCase();
}

// ─── Utility: format seconds → HH:MM:SS ───────────────────────────────────────
function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

// ─── Home component ───────────────────────────────────────────────────────────
const Home = () => {
  // --- Camera state ---
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState(null); // { type, msg }

  // --- Verification state ---
  const [scannedItem, setScannedItem] = useState(null);

  // --- Credit pool state ---
  const [poolAmount, setPoolAmount] = useState(0);
  const [poolStatus, setPoolStatus] = useState("");

  // --- Release credit state ---
  const [wallet, setWallet] = useState("");
  const [releaseStatus, setReleaseStatus] = useState(null);

  // --- Membership state ---
  const [membershipSecondsLeft, setMembershipSecondsLeft] = useState(null);
  const membershipTimerRef = useRef(null);

  // --- Transactions state ---
  const [transactions, setTransactions] = useState([]);

  // ── Backend ping ─────────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/`).catch(() => {});
  }, []);

  // ── Camera ───────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraStatus({ type: "info", msg: "Requesting camera access…" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        videoRef.current.classList.add("active");
      }
      setCameraActive(true);
      setCameraStatus({ type: "success", msg: "Camera active – point at item" });
    } catch {
      setCameraStatus({ type: "error", msg: "Camera access denied or unavailable" });
    }
  };

  // ── Simulate scan ─────────────────────────────────────────────────────────────
  const simulateScan = useCallback(() => {
    const item = SAMPLE_ITEMS[Math.floor(Math.random() * SAMPLE_ITEMS.length)];
    const hash = generateDualCHash(item);
    setScannedItem({ ...item, hash });
    setCameraStatus({ type: "success", msg: `Scanned: ${item.name}` });
    startMembershipTimer();
  }, [startMembershipTimer]);

  // ── Add tip ───────────────────────────────────────────────────────────────────
  const addTip = () => {
    const newAmount = Math.min(poolAmount + 10, DAILY_CAPACITY);
    setPoolAmount(newAmount);
    setPoolStatus(`+$10 added — pool now $${newAmount.toFixed(2)}`);
    addTransaction("Tip Added", 10);
    setTimeout(() => setPoolStatus(""), 3000);
  };

  // ── Release credit ────────────────────────────────────────────────────────────
  const releaseCredit = () => {
    if (!wallet.trim()) {
      setReleaseStatus({ type: "error", msg: "Please enter a wallet address" });
      return;
    }
    if (!scannedItem) {
      setReleaseStatus({ type: "error", msg: "Scan an item first" });
      return;
    }
    if (poolAmount <= 0) {
      setReleaseStatus({ type: "error", msg: "Credit pool is empty" });
      return;
    }
    const amount = scannedItem.price;
    setReleaseStatus({ type: "info", msg: "⏳ Processing smart contract…" });

    setTimeout(() => {
      setPoolAmount((prev) => Math.max(0, prev - amount));
      addTransaction(scannedItem.name, -amount, wallet);
      setReleaseStatus({
        type: "success",
        msg: `✓ $${amount.toFixed(2)} released to ${wallet.slice(0, 8)}…`,
      });
    }, 1500);
  };

  // ── Membership timer ──────────────────────────────────────────────────────────
  const startMembershipTimer = useCallback(() => {
    if (membershipTimerRef.current) clearInterval(membershipTimerRef.current);
    setMembershipSecondsLeft(MEMBERSHIP_DURATION);
    membershipTimerRef.current = setInterval(() => {
      setMembershipSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(membershipTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(membershipTimerRef.current), []);

  // ── Transactions ──────────────────────────────────────────────────────────────
  const addTransaction = (name, amount, walletAddr = null) => {
    setTransactions((prev) => [
      {
        id: Date.now(),
        name,
        amount,
        wallet: walletAddr,
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9),
    ]);
  };

  // ── Derived values ────────────────────────────────────────────────────────────
  const poolPct = Math.round((poolAmount / DAILY_CAPACITY) * 100);
  const releaseEnabled = !!scannedItem && poolAmount > 0;
  const membershipPct =
    membershipSecondsLeft !== null
      ? Math.round((membershipSecondsLeft / MEMBERSHIP_DURATION) * 100)
      : 0;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <header className="freepay-header">
        <h1>⚡ FreePay</h1>
        <span className="header-badge">LIVE</span>
      </header>

      <div className="container">
        {/* Row 1 */}
        <div className="grid">
          {/* Camera */}
          <div className="card">
            <h2>📱 Camera Scan</h2>
            <div className="camera-container">
              <video ref={videoRef} id="cameraFeed" playsInline muted />
              {!cameraActive && (
                <div className="camera-placeholder">
                  <div>📷</div>
                  <div>Point at item</div>
                </div>
              )}
            </div>
            <button onClick={startCamera} id="cameraBtn">
              Enable Camera
            </button>
            <button
              onClick={simulateScan}
              style={{ background: "rgba(168, 85, 247, 0.6)" }}
            >
              Simulate Scan
            </button>
            {cameraStatus && (
              <div className={`status ${cameraStatus.type}`}>{cameraStatus.msg}</div>
            )}
          </div>

          {/* Verification */}
          <div className="card">
            <h2>⚡ Dual C Verification</h2>
            {scannedItem ? (
              <div id="verificationOutput">
                <div className="input-group">
                  <label
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Item
                  </label>
                  <input type="text" id="itemName" readOnly value={scannedItem.name} />
                </div>
                <div className="input-group">
                  <label
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Category
                  </label>
                  <input
                    type="text"
                    id="itemCategory"
                    readOnly
                    value={scannedItem.category}
                  />
                </div>
                <div className="input-group">
                  <label
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Price
                  </label>
                  <input
                    type="text"
                    id="itemPrice"
                    readOnly
                    value={`$${scannedItem.price.toFixed(2)}`}
                  />
                </div>
                <div className="input-group">
                  <label
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Safety Score
                  </label>
                  <input
                    type="text"
                    id="safetyScore"
                    readOnly
                    value={`${scannedItem.safetyScore}/100`}
                  />
                </div>
                <div className="input-group">
                  <label
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Dual C Hash
                  </label>
                  <input
                    type="text"
                    id="dualCHash"
                    readOnly
                    value={scannedItem.hash}
                    style={{ fontSize: 10 }}
                  />
                </div>
                <div className="status success">✓ VERIFIED</div>
              </div>
            ) : (
              <div
                id="verificationPlaceholder"
                style={{ opacity: 0.4, textAlign: "center", padding: 20 }}
              >
                <p>Waiting for scan…</p>
              </div>
            )}
          </div>

          {/* Credit Pool */}
          <div className="card">
            <h2>🔮 Credit Pool</h2>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 4,
              }}
            >
              Available Balance
            </div>
            <div className="amount-display" id="poolAmount">
              ${poolAmount.toFixed(2)}
            </div>
            <div className="pool-percentage">
              <div
                className="pool-fill"
                id="poolFill"
                style={{ width: `${poolPct}%` }}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                marginBottom: 12,
              }}
            >
              <span id="poolPercentage">{poolPct}%</span> of daily capacity
            </div>
            <button
              onClick={addTip}
              style={{ background: "rgba(16, 185, 129, 0.6)" }}
            >
              Add Tip ($10)
            </button>
            {poolStatus && (
              <div className="status info" id="poolStatus">
                {poolStatus}
              </div>
            )}
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid" style={{ marginTop: 20 }}>
          {/* Release Credit */}
          <div className="card">
            <h2>💰 Release Credit</h2>
            <div className="input-group">
              <label
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Wallet Address
              </label>
              <input
                type="text"
                id="walletInput"
                placeholder="Your Solana wallet"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
              />
            </div>
            <button
              onClick={releaseCredit}
              id="releaseBtn"
              disabled={!releaseEnabled}
            >
              Execute Smart Contract
            </button>
            {releaseStatus && (
              <div className={`status ${releaseStatus.type}`} id="releaseStatus">
                {releaseStatus.msg}
              </div>
            )}
          </div>

          {/* Membership */}
          <div className="card">
            <h2>🎖️ Lifetime Membership</h2>
            <div id="membershipStatus">
              {membershipSecondsLeft !== null ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      marginBottom: 4,
                    }}
                  >
                    Time Remaining
                  </div>
                  <div className="membership-timer">
                    {formatTime(membershipSecondsLeft)}
                  </div>
                  <div className="membership-progress">
                    <div
                      className="membership-fill"
                      style={{ width: `${membershipPct}%` }}
                    />
                  </div>
                  {membershipSecondsLeft === 0 ? (
                    <div className="status error">⌛ Membership expired</div>
                  ) : (
                    <div className="status success">✓ Active membership</div>
                  )}
                </div>
              ) : (
                <div style={{ opacity: 0.5, textAlign: "center", padding: 20 }}>
                  <p>Scan an item to start the 24h timer</p>
                </div>
              )}
            </div>
          </div>

          {/* Transactions */}
          <div className="card">
            <h2>📊 Recent Transactions</h2>
            <div id="transactionList">
              {transactions.length === 0 ? (
                <div style={{ opacity: 0.5, textAlign: "center", padding: 20 }}>
                  <p>No transactions yet</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div className="transaction-item" key={tx.id}>
                    <div>
                      <div className="tx-name">{tx.name}</div>
                      {tx.wallet && (
                        <div className="tx-time">→ {tx.wallet.slice(0, 10)}…</div>
                      )}
                      <div className="tx-time">{tx.time}</div>
                    </div>
                    <div
                      className="tx-amount"
                      style={tx.amount < 0 ? { color: "#f87171" } : {}}
                    >
                      {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

