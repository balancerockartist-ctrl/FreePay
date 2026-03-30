import { useEffect, useState } from "react";
import axios from "axios";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TransactionHistory() {
  const { currentUser, loading } = useCurrentUser();
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setTxLoading(true);
    axios
      .get(`${API}/transactions`)
      .then((r) => setTransactions(r.data))
      .catch(console.error)
      .finally(() => setTxLoading(false));
  }, [currentUser]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
        <p className="text-gray-500 text-sm mt-1">All platform transactions</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-700">
            All Transactions ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {txLoading ? (
            <p className="text-gray-400 text-sm p-6">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-400 text-sm p-6">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">From</th>
                    <th className="px-6 py-3">To</th>
                    <th className="px-6 py-3">Note</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => {
                    const isSent = currentUser && tx.sender_id === currentUser.id;
                    const isReceived = currentUser && tx.receiver_id === currentUser.id;
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${isSent ? "bg-red-50" : isReceived ? "bg-green-50" : "bg-gray-100"}`}>
                              {isSent ? (
                                <ArrowUpRight size={14} className="text-red-400" />
                              ) : isReceived ? (
                                <ArrowDownLeft size={14} className="text-green-500" />
                              ) : (
                                <ArrowUpRight size={14} className="text-gray-400" />
                              )}
                            </div>
                            <span className={`font-medium ${isSent ? "text-red-500" : isReceived ? "text-green-600" : "text-gray-600"}`}>
                              {isSent ? "Sent" : isReceived ? "Received" : "Transfer"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">{tx.sender_name}</td>
                        <td className="px-6 py-4 text-gray-700 font-medium">{tx.receiver_name}</td>
                        <td className="px-6 py-4 text-gray-400">{tx.note || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${isSent ? "text-red-500" : isReceived ? "text-green-600" : "text-gray-700"}`}>
                            {isSent ? "-" : isReceived ? "+" : ""}${tx.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 capitalize text-xs">
                            {tx.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
