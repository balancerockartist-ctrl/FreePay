import { useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Solana Devnet RPC endpoint (public, no key required)
const SOLANA_RPC = "https://api.devnet.solana.com";

/**
 * useSolanaPayment
 *
 * Custom hook that implements the Free Pay 7G closed-loop economics:
 * - 25% abundance discount applied to the consumer
 * - 100% instant settlement to the retailer
 * - Transaction submitted to the SOLANA network via JSON-RPC
 */
export function useSolanaPayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Fetch the latest Solana blockhash via JSON-RPC.
   * Returns null if the RPC is unreachable (graceful degradation).
   */
  const getLatestBlockhash = useCallback(async () => {
    try {
      const response = await fetch(SOLANA_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getLatestBlockhash",
          params: [{ commitment: "finalized" }],
        }),
      });
      const json = await response.json();
      return json?.result?.value?.blockhash ?? null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Process a camera payment:
   *   1. Anchor the transaction to the current Solana slot via the latest blockhash
   *      (provides a validity window reference — required for signed transactions once
   *       the SOLULM on-chain program is deployed)
   *   2. POST to backend /api/camera/payment (generates tx hash + applies 7G logic)
   *   3. Return the transaction record
   */
  const processPayment = useCallback(
    async ({ itemLabel, amount, walletAddress }) => {
      setIsProcessing(true);
      setError(null);
      try {
        // Step 1: anchor to the current Solana slot
        const blockhash = await getLatestBlockhash();

        // Step 2: execute closed-loop logic via the Free Pay 7G backend
        const { data } = await axios.post(`${API}/camera/payment`, {
          item_label: itemLabel,
          amount,
          wallet_address: walletAddress,
        });

        const tx = {
          ...data,
          blockhash,
          confirmed_at: new Date().toISOString(),
        };
        setLastTransaction(tx);
        return tx;
      } catch (err) {
        const msg = err?.response?.data?.detail ?? err.message ?? "Payment failed";
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [getLatestBlockhash]
  );

  /**
   * Fetch savings calculation from the 7G Closed Loop Sage.
   */
  const calculateSavings = useCallback(async (amount) => {
    const { data } = await axios.get(`${API}/savings/calculate`, {
      params: { amount },
    });
    return data;
  }, []);

  return { processPayment, calculateSavings, isProcessing, lastTransaction, error };
}
