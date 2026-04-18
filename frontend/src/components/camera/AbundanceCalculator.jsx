import { useState, useEffect } from "react";
import { DollarSign, Percent, Gift, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const DEFAULT_DISCOUNT_RATE = 0.10; // 10 % instant discount
const DEFAULT_TIP_RATE = 0.90;      // 90 % voluntary tip suggestion

/**
 * AbundanceCalculator
 *
 * Displays the payment breakdown for a given `amount`:
 *  • 10 % instant discount applied at checkout
 *  • Voluntary tip prompt shown to the buyer (default 90 % of discounted price)
 *
 * Both rates are configurable via sliders so the user can see the
 * numbers change in real time.
 *
 * Props
 * ─────
 * amount        – numeric transaction total (USD)
 * currency      – currency code, default "USD"
 * itemLabel     – human-readable item name
 * className     – optional Tailwind classes
 * onCalculated  – optional callback({ consumerPrice, discountAmount, tipSuggestion })
 */
export default function AbundanceCalculator({
  amount = 0,
  currency = "USD",
  itemLabel = "Item",
  className,
  onCalculated,
}) {
  const [discountRate, setDiscountRate] = useState(DEFAULT_DISCOUNT_RATE);
  const [tipRate, setTipRate] = useState(DEFAULT_TIP_RATE);

  const discountAmount = parseFloat((amount * discountRate).toFixed(2));
  const consumerPrice = parseFloat((amount - discountAmount).toFixed(2));
  const tipSuggestion = parseFloat((consumerPrice * tipRate).toFixed(2));

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

  useEffect(() => {
    onCalculated?.({ consumerPrice, discountAmount, tipSuggestion });
  }, [consumerPrice, discountAmount, tipSuggestion, onCalculated]);

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="w-5 h-5 text-primary" />
          Payment Breakdown — {itemLabel}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Original amount */}
        <Row
          icon={<DollarSign className="w-4 h-4 text-muted-foreground" />}
          label="Original Price"
          value={fmt(amount)}
        />

        <Separator />

        {/* Discount */}
        <div className="space-y-2">
          <Row
            icon={<TrendingDown className="w-4 h-4 text-green-500" />}
            label={
              <span className="flex items-center gap-1">
                Instant Discount
                <Badge variant="secondary" className="text-xs ml-1">
                  {Math.round(discountRate * 100)} %
                </Badge>
              </span>
            }
            value={
              <span className="text-green-600 font-semibold">
                − {fmt(discountAmount)}
              </span>
            }
          />
          <Slider
            min={0}
            max={50}
            step={1}
            value={[Math.round(discountRate * 100)]}
            onValueChange={([v]) => setDiscountRate(v / 100)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Drag to adjust the discount rate (0 – 50 %)
          </p>
        </div>

        <Separator />

        {/* Consumer price */}
        <Row
          icon={<DollarSign className="w-4 h-4 text-primary" />}
          label={<span className="font-semibold">You Pay</span>}
          value={
            <span className="text-primary font-bold text-lg">{fmt(consumerPrice)}</span>
          }
        />

        <Separator />

        {/* Voluntary tip */}
        <div className="space-y-2">
          <Row
            icon={<Gift className="w-4 h-4 text-amber-500" />}
            label={
              <span className="flex items-center gap-1">
                Voluntary Tip Suggestion
                <Badge variant="secondary" className="text-xs ml-1">
                  {Math.round(tipRate * 100)} %
                </Badge>
              </span>
            }
            value={
              <span className="text-amber-600 font-semibold">{fmt(tipSuggestion)}</span>
            }
          />
          <Slider
            min={0}
            max={100}
            step={5}
            value={[Math.round(tipRate * 100)]}
            onValueChange={([v]) => setTipRate(v / 100)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            This tip is entirely voluntary — drag to adjust (0 – 100 %)
          </p>
        </div>

        <Separator />

        {/* Summary row */}
        <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount saved</span>
            <span className="text-green-600 font-medium">{fmt(discountAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount due</span>
            <span className="font-semibold">{fmt(consumerPrice)}</span>
          </div>
          {tipSuggestion > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tip suggestion</span>
              <span className="text-amber-600 font-medium">{fmt(tipSuggestion)}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          <Percent className="inline w-3 h-3 mr-1" />
          Rates are illustrative — final amounts are confirmed at checkout.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Helper ──────────────────────────────────────────────────────────────────

function Row({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-sm">
        {icon}
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
