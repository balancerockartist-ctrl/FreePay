import { useState, useCallback } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";

const SOLANA_NETWORK = "devnet";

/**
 * Hook for sending SOL payments via a browser-injected Solana wallet (e.g. Phantom).
 *
 * Returns:
 *   sendPayment({ recipientAddress, amountSol, memo }) – initiates a transfer
 *   status  – 'idle' | 'connecting' | 'pending' | 'confirmed' | 'error'
 *   signature – confirmed transaction signature string, or null
 *   error   – error message string, or null
 *   reset   – resets state back to 'idle'
 */
export function useSolanaPayment() {
  const [status, setStatus] = useState("idle");
  const [signature, setSignature] = useState(null);
  const [error, setError] = useState(null);

  const sendPayment = useCallback(async ({ recipientAddress, amountSol }) => {
    setStatus("connecting");
    setError(null);
    setSignature(null);

    try {
      // Resolve the injected wallet provider (Phantom, Backpack, etc.)
      const provider =
        window.solana ||
        (window.phantom && window.phantom.solana) ||
        null;

      if (!provider) {
        throw new Error(
          "No Solana wallet detected. Install Phantom or another Solana wallet extension."
        );
      }

      await provider.connect();
      const walletPublicKey = provider.publicKey;
      if (!walletPublicKey) {
        throw new Error("Wallet connected but no public key available.");
      }

      const connection = new Connection(
        clusterApiUrl(SOLANA_NETWORK),
        "confirmed"
      );
      const recipient = new PublicKey(recipientAddress);
      const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: walletPublicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: recipient,
          lamports,
        })
      );

      setStatus("pending");

      const { signature: sig } = await provider.signAndSendTransaction(tx);

      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      setSignature(sig);
      setStatus("confirmed");
      return sig;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Payment failed. Please retry.";
      setError(message);
      setStatus("error");
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setSignature(null);
    setError(null);
  }, []);

  return { sendPayment, status, signature, error, reset };
}
