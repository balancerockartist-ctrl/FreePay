import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import api from "@/lib/api";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Transfers() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/transfers").then(({ data }) => setItems(data)).catch(() => setError("Failed to load transfers"));
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Transfers</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>All Transfers</CardTitle>
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
                {items.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4 font-mono text-xs text-gray-400">
                      {t.id.slice(0, 8)}…
                    </td>
                    <td className="py-2 pr-4 truncate max-w-[120px]">{t.from_account}</td>
                    <td className="py-2 pr-4 truncate max-w-[120px]">{t.to_account}</td>
                    <td className="py-2 pr-4 text-right font-mono">{t.amount.toFixed(2)}</td>
                    <td className="py-2 pr-4">{t.currency}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-2 text-gray-400 text-xs">
                      {t.created_at ? format(parseISO(t.created_at), "MM/dd HH:mm") : "—"}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No transfers yet
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
