import { useEffect, useState, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Format currency amounts
const formatAmount = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

// Format ISO date string
const formatDate = (isoString) => {
  return new Date(isoString).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// Status badge color map
const statusVariant = {
  completed: "default",
  pending: "secondary",
  failed: "destructive",
};

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [acctRes, txRes] = await Promise.all([
        axios.get(`${API}/accounts`),
        axios.get(`${API}/transactions`, {
          params: selectedAccount ? { account_id: selectedAccount } : {},
        }),
      ]);
      setAccounts(acctRes.data);
      setTransactions(txRes.data);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Failed to load data from the API.");
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <h1 className="text-3xl font-bold mb-6">FreePay Dashboard</h1>

      {error && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Balance summary cards */}
      <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAmount(totalBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {accounts.map((account) => (
          <Card
            key={account.id}
            className={`cursor-pointer transition-colors ${
              selectedAccount === account.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() =>
              setSelectedAccount(
                selectedAccount === account.id ? null : account.id
              )
            }
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {account.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatAmount(account.balance, account.currency)}
              </p>
              {account.owner && (
                <p className="text-xs text-muted-foreground mt-1">
                  {account.owner}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction list */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedAccount
              ? `Transactions — ${
                  accounts.find((a) => a.id === selectedAccount)?.name ??
                  "Account"
                }`
              : "All Transactions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 pr-4 text-left font-medium">Date</th>
                    <th className="py-2 pr-4 text-left font-medium">Description</th>
                    <th className="py-2 pr-4 text-left font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="py-2 pr-4">{tx.description || "—"}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={statusVariant[tx.status] ?? "outline"}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td
                        className={`py-2 text-right font-mono ${
                          tx.amount >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {formatAmount(tx.amount, tx.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />}>
            <Route index element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
