import { useState } from "react";
import { ExternalLink, Copy, CheckCheck, Loader2, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  idle:      { label: "Not Started",  variant: "secondary",    animate: false },
  pending:   { label: "Pending",      variant: "outline",      animate: true  },
  confirmed: { label: "Confirmed",    variant: "default",      animate: false },
  error:     { label: "Failed",       variant: "destructive",  animate: false },
};

const EXPLORER_BASE = "https://explorer.solana.com";

/**
 * SolanaTransactionCard
 *
 * Displays real-time status and metadata for a Solana transaction.
 * Uses the solana-foundation/explorer URL pattern to link directly to the
 * transaction on the official Solana Explorer.
 *
 * Props
 * ─────
 * signature    – base-58 transaction signature (required to show explorer link)
 * status       – "idle" | "pending" | "confirmed" | "error"
 * amount       – SOL amount transferred
 * fromAddress  – sender public key (base-58)
 * toAddress    – recipient public key (base-58)
 * cluster      – "mainnet-beta" | "devnet" | "testnet"  (default "devnet")
 * itemLabel    – optional item/category label
 * className    – optional Tailwind classes
 */
export default function SolanaTransactionCard({
  signature = null,
  status = "idle",
  amount = null,
  fromAddress = null,
  toAddress = null,
  cluster = "devnet",
  itemLabel = null,
  className,
}) {
  const [copied, setCopied] = useState(false);

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;

  const explorerUrl = signature
    ? `${EXPLORER_BASE}/tx/${signature}?cluster=${cluster}`
    : null;

  const handleCopy = async () => {
    if (!signature) return;
    await navigator.clipboard.writeText(signature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortSig = signature
    ? `${signature.slice(0, 8)}…${signature.slice(-8)}`
    : null;

  const shortAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-6)}` : null;

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            Solana Transaction
          </span>
          <Badge
            variant={cfg.variant}
            className={cn("text-xs", cfg.animate && "animate-pulse")}
          >
            {cfg.animate && (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            )}
            {cfg.label}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Network badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Network</span>
          <Badge variant="outline" className="text-xs capitalize">
            {cluster}
          </Badge>
        </div>

        {/* Item label */}
        {itemLabel && (
          <InfoRow label="Item" value={itemLabel} />
        )}

        {/* Amount */}
        {amount !== null && (
          <InfoRow
            label="Amount"
            value={`${amount.toFixed(6)} SOL`}
          />
        )}

        <Separator />

        {/* Addresses */}
        {fromAddress && (
          <InfoRow label="From" value={shortAddr(fromAddress)} mono />
        )}
        {toAddress && (
          <InfoRow label="To" value={shortAddr(toAddress)} mono />
        )}

        {/* Signature */}
        {signature && (
          <>
            <Separator />
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Signature (hash)</span>
              <div className="flex items-center gap-2 bg-muted rounded px-3 py-1.5">
                <code className="text-xs font-mono flex-1 truncate text-foreground">
                  {shortSig}
                </code>
                <button
                  onClick={handleCopy}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Copy full signature"
                >
                  {copied
                    ? <CheckCheck className="w-4 h-4 text-green-500" />
                    : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Explorer link */}
        {explorerUrl && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
          >
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
              View on Solana Explorer
            </a>
          </Button>
        )}

        {!signature && status === "idle" && (
          <p className="text-xs text-center text-muted-foreground">
            Transaction details will appear here once a payment is initiated.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Helper ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn("truncate", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
