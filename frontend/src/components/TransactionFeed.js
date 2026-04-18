import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const POLL_INTERVAL_MS = 5000;

/**
 * TransactionFeed
 *
 * Displays the Zero-Latency Feed of confirmed Free Pay transactions
 * sourced from the SOLANA network via the backend /api/transactions/feed endpoint.
 * Polls every 5 seconds to show near-real-time updates.
 */
export function TransactionFeed() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/transactions/feed`);
      setTransactions(data);
    } catch {
      // silent — feed unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-purple-400 text-sm">
        <span className="inline-block w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2" />
        Connecting to SOLANA network…
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        No transactions yet. Scan an item to create the first one.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-start gap-3 bg-gray-900/60 border border-gray-700/50 rounded-xl px-3 py-2 text-xs"
        >
          <span className="text-green-400 mt-0.5 shrink-0">✓</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-white truncate">{tx.item_label}</span>
              <span className="text-gray-400 shrink-0">
                ${tx.consumer_price?.toFixed(2)}
                <span className="text-green-400 ml-1">↓25%</span>
              </span>
            </div>
            <div className="text-gray-500 font-mono truncate mt-0.5">{tx.tx_hash}</div>
            <div className="text-gray-600 mt-0.5">
              {new Date(tx.timestamp).toLocaleTimeString()} · SOLANA
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
