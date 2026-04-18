import { useState, useCallback } from "react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const SOLANA_CLUSTER = "devnet";
const RPC_URL = `https://api.${SOLANA_CLUSTER}.solana.com`;

/**
 * useSolana – lightweight hook for building and broadcasting SOL transfers.
 *
 * Wallet addresses are always provided by the caller; this hook never
 * hard-codes any destination address.
 */
export function useSolana() {
  const [connection] = useState(() => new Connection(RPC_URL, "confirmed"));
  const [txSignature, setTxSignature] = useState(null);
  const [txStatus, setTxStatus] = useState("idle"); // idle | pending | confirmed | error
  const [error, setError] = useState(null);

  /**
   * Prepare (but do not sign/send) a SOL transfer transaction so the caller's
   * wallet adapter can sign it.
   *
   * @param {string} fromPubkeyStr  – base-58 sender address
   * @param {string} toPubkeyStr   – base-58 recipient address
   * @param {number} lamports      – amount in lamports (1 SOL = 1e9 lamports)
   * @returns {Transaction}
   */
  const buildTransferTransaction = useCallback(
    async (fromPubkeyStr, toPubkeyStr, lamports) => {
      const fromPubkey = new PublicKey(fromPubkeyStr);
      const toPubkey = new PublicKey(toPubkeyStr);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const tx = new Transaction({
        blockhash,
        lastValidBlockHeight,
        feePayer: fromPubkey,
      }).add(
        SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
      );

      return tx;
    },
    [connection]
  );

  /**
   * Fetch the current SOL balance (in SOL, not lamports) for an address.
   *
   * @param {string} pubkeyStr – base-58 public key
   * @returns {Promise<number>}
   */
  const getBalance = useCallback(
    async (pubkeyStr) => {
      const pubkey = new PublicKey(pubkeyStr);
      const lamports = await connection.getBalance(pubkey);
      return lamports / LAMPORTS_PER_SOL;
    },
    [connection]
  );

  /**
   * Confirm a previously submitted transaction by its signature.
   *
   * @param {string} signature
   * @returns {Promise<object>} confirmation object
   */
  const confirmTransaction = useCallback(
    async (signature) => {
      setTxStatus("pending");
      setTxSignature(signature);
      try {
        const latestBlock = await connection.getLatestBlockhash();
        const result = await connection.confirmTransaction(
          {
            signature,
            blockhash: latestBlock.blockhash,
            lastValidBlockHeight: latestBlock.lastValidBlockHeight,
          },
          "confirmed"
        );
        setTxStatus("confirmed");
        return result;
      } catch (err) {
        setError(err.message);
        setTxStatus("error");
        throw err;
      }
    },
    [connection]
  );

  /** Explorer URL for the current transaction (if any). */
  const explorerUrl = txSignature
    ? `https://explorer.solana.com/tx/${txSignature}?cluster=${SOLANA_CLUSTER}`
    : null;

  return {
    connection,
    txSignature,
    txStatus,
    error,
    explorerUrl,
    buildTransferTransaction,
    getBalance,
    confirmTransaction,
  };
}
