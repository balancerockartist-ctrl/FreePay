import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  settled: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  flagged: "bg-orange-100 text-orange-800",
  // PaymentIntent statuses
  requires_payment_method: "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-800",
  succeeded: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
  // Transfer statuses
  completed: "bg-green-100 text-green-800",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        STATUS_STYLES[status] || "bg-gray-100 text-gray-700"
      )}
    >
      {status}
    </span>
  );
}
