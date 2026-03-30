import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Wallet } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SendMoney() {
  const { currentUser, loading, refresh } = useCurrentUser();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`${API}/users`).then((r) => setUsers(r.data)).catch(console.error);
  }, []);

  const otherUsers = users.filter((u) => u.id !== currentUser?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!receiverId) { toast.error("Please select a recipient"); return; }
    if (!parsed || parsed <= 0) { toast.error("Enter a valid amount"); return; }

    setSubmitting(true);
    try {
      await axios.post(`${API}/transactions`, {
        sender_id: currentUser.id,
        receiver_id: receiverId,
        amount: parsed,
        note: note || undefined,
      });
      await refresh();
      toast.success("Payment sent successfully! 🎉");
      navigate("/transactions");
    } catch (err) {
      const detail = err.response?.data?.detail || "Payment failed";
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Send Money</h2>
        <p className="text-gray-500 text-sm mt-1">Transfer funds instantly to anyone on FreePay</p>
      </div>

      {/* Balance pill */}
      {currentUser && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
          <Wallet size={18} className="text-blue-500" />
          <span className="text-sm text-blue-700">
            Your balance: <strong>${currentUser.balance.toFixed(2)}</strong>
          </span>
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-700">Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Receiver */}
            <div className="space-y-1.5">
              <Label>Send To</Label>
              <Select value={receiverId} onValueChange={setReceiverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient…" />
                </SelectTrigger>
                <SelectContent>
                  {otherUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {otherUsers.length === 0 && (
                <p className="text-xs text-gray-400">No other users found. Add contacts first.</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                  required
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Rent, Dinner, etc."
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2 font-semibold"
              disabled={submitting}
            >
              <Send size={16} />
              {submitting ? "Sending…" : "Send Money"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
