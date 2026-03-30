import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Send, TrendingUp, TrendingDown, Activity } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function SetupScreen({ onCreate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onCreate(name, email);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-blue-700">Welcome to FreePay</CardTitle>
          <p className="text-center text-gray-500 text-sm">Create your account to get started</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Creating…" : "Create Account (starts with $1,000)"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser, loading, needsSetup, createFirstUser } = useCurrentUser();
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setTxLoading(true);
    axios
      .get(`${API}/transactions/user/${currentUser.id}`)
      .then((r) => setTransactions(r.data))
      .catch(console.error)
      .finally(() => setTxLoading(false));
  }, [currentUser]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  }

  if (needsSetup) {
    return <SetupScreen onCreate={createFirstUser} />;
  }

  const sent = transactions.filter((t) => t.sender_id === currentUser.id);
  const received = transactions.filter((t) => t.receiver_id === currentUser.id);
  const totalSent = sent.reduce((s, t) => s + t.amount, 0);
  const totalReceived = received.reduce((s, t) => s + t.amount, 0);
  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Hello, {currentUser.name} 👋</h2>
        <p className="text-gray-500 text-sm mt-1">Here's your financial overview</p>
      </div>

      {/* Balance card */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
        <CardContent className="pt-6 pb-6">
          <p className="text-blue-200 text-sm font-medium mb-1">Available Balance</p>
          <p className="text-5xl font-bold tracking-tight">
            ${currentUser.balance.toFixed(2)}
          </p>
          <p className="text-blue-200 text-xs mt-2">{currentUser.email}</p>
          <Link to="/send" className="mt-4 inline-block">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 font-semibold gap-2 mt-2">
              <Send size={16} /> Quick Send
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sent</p>
                <p className="text-2xl font-bold text-red-500">${totalSent.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <TrendingDown size={20} className="text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Received</p>
                <p className="text-2xl font-bold text-green-600">${totalReceived.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <TrendingUp size={20} className="text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Activity size={20} className="text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
          <Link to="/transactions" className="text-blue-600 text-sm hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-gray-400 text-sm">No transactions yet. <Link to="/send" className="text-blue-600 hover:underline">Send your first payment →</Link></p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map((tx) => {
                const isSent = tx.sender_id === currentUser.id;
                return (
                  <li key={tx.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${isSent ? "bg-red-50" : "bg-green-50"}`}>
                        {isSent ? <ArrowUpRight size={16} className="text-red-400" /> : <ArrowDownLeft size={16} className="text-green-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {isSent ? `To ${tx.receiver_name}` : `From ${tx.sender_name}`}
                        </p>
                        {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${isSent ? "text-red-500" : "text-green-600"}`}>
                        {isSent ? "-" : "+"}${tx.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
