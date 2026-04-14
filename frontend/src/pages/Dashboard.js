import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, parseISO, startOfDay } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // ── Fetch accounts ────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/accounts").then(({ data }) => {
      setAccounts(data);
      if (data.length > 0) setSelectedAccount(data[0].id);
    });
  }, []);

  // ── Fetch balance for selected account ───────────────────────────────────
  useEffect(() => {
    if (!selectedAccount) return;
    api.get(`/accounts/${selectedAccount}`).then(({ data }) => setBalance(data));
  }, [selectedAccount]);

  // ── Fetch transactions ────────────────────────────────────────────────────
  const loadTx = useCallback(() => {
    const params = { skip: page * PAGE_SIZE, limit: PAGE_SIZE };
    if (statusFilter) params.status = statusFilter;
    api.get("/transactions", { params }).then(({ data }) => setTransactions(data));
  }, [page, statusFilter]);

  useEffect(() => {
    loadTx();
  }, [loadTx]);

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCsv = async () => {
    const resp = await api.get("/transactions", {
      params: { format: "csv" },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([resp.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ── Chart data — volume per day ───────────────────────────────────────────
  const chartData = (() => {
    const byDay = {};
    transactions.forEach((tx) => {
      const day = format(startOfDay(parseISO(tx.created_at)), "MM/dd");
      byDay[day] = (byDay[day] || 0) + tx.amount;
    });
    return Object.entries(byDay).map(([date, amount]) => ({ date, amount }));
  })();

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Balance card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Account Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {balance ? (
              <>
                <p className="text-3xl font-bold">
                  {balance.currency} {balance.balance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{balance.label}</p>
                {accounts.length > 1 && (
                  <select
                    className="mt-2 text-sm border rounded px-2 py-1 w-full"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                )}
              </>
            ) : (
              <p className="text-gray-400">No accounts yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Signed in as</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium truncate">{user?.email}</p>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {user?.role}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Spend chart */}
      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Transactions table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <div className="flex gap-2">
            <select
              className="text-sm border rounded px-2 py-1"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
              <option value="failed">Failed</option>
              <option value="flagged">Flagged</option>
            </select>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2 pr-4">ID</th>
                  <th className="text-left py-2 pr-4">From</th>
                  <th className="text-left py-2 pr-4">To</th>
                  <th className="text-right py-2 pr-4">Amount</th>
                  <th className="text-left py-2 pr-4">Currency</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4 font-mono text-xs text-gray-400 truncate max-w-[100px]">
                      {tx.id.slice(0, 8)}…
                    </td>
                    <td className="py-2 pr-4 truncate max-w-[120px]">{tx.from_account}</td>
                    <td className="py-2 pr-4 truncate max-w-[120px]">{tx.to_account}</td>
                    <td className="py-2 pr-4 text-right font-mono">{tx.amount.toFixed(2)}</td>
                    <td className="py-2 pr-4">{tx.currency}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-2 text-gray-400 text-xs">
                      {tx.created_at ? format(parseISO(tx.created_at), "MM/dd HH:mm") : "—"}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No transactions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={transactions.length < PAGE_SIZE}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
