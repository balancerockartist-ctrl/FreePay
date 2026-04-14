import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import api from "@/lib/api";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Agents() {
  const [report, setReport] = useState([]);
  const [lastRun, setLastRun] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const loadReport = () => {
    api.get("/agents/reconciliation-report").then(({ data }) => {
      setReport(data);
      setLastRun(new Date().toISOString());
    });
  };

  useEffect(() => {
    loadReport();
  }, []);

  const triggerReconciliation = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data } = await api.post("/agents/run-reconciliation");
      setResult(data);
      loadReport();
    } catch (err) {
      setResult({ error: err.response?.data?.detail || "Failed" });
    } finally {
      setRunning(false);
    }
  };

  // Group by from_account for spend breakdown
  const spendByAccount = report.reduce((acc, tx) => {
    acc[tx.from_account] = (acc[tx.from_account] || 0) + tx.amount;
    return acc;
  }, {});

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">AI Agent Monitor</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Last Reconciliation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {lastRun ? format(parseISO(lastRun), "PPpp") : "Never"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3 items-center">
            <Button onClick={triggerReconciliation} disabled={running}>
              {running ? "Running…" : "Run Reconciliation Now"}
            </Button>
            {result && (
              <span className="text-sm text-gray-600">
                {result.error
                  ? `Error: ${result.error}`
                  : `Reconciled: ${result.reconciled}, Flagged: ${result.flagged}`}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Spend breakdown */}
      {Object.keys(spendByAccount).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Spend Breakdown (flagged/failed)</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2 pr-4">Account</th>
                  <th className="text-right py-2">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(spendByAccount).map(([account, total]) => (
                  <tr key={account} className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">{account}</td>
                    <td className="py-2 text-right font-mono">{total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Flagged / failed transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Flagged &amp; Failed Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2 pr-4">ID</th>
                  <th className="text-right py-2 pr-4">Amount</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Flag reason</th>
                  <th className="text-left py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {report.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4 font-mono text-xs text-gray-400">
                      {tx.id.slice(0, 8)}…
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">{tx.amount.toFixed(2)}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-2 pr-4 text-xs text-gray-500 max-w-[240px] truncate">
                      {tx.flag_reason || "—"}
                    </td>
                    <td className="py-2 text-gray-400 text-xs">
                      {tx.created_at ? format(parseISO(tx.created_at), "MM/dd HH:mm") : "—"}
                    </td>
                  </tr>
                ))}
                {report.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No flagged or failed transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
