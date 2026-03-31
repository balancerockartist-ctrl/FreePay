import { useState } from "react";
import { CreditCard, CheckCircle, Loader2, User, UserCheck, ChevronRight } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AmountInput({ value, onChange }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-semibold">$</span>
      <input
        type="number"
        min="0.01"
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-8 pr-4 py-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
      />
    </div>
  );
}

export default function PaymentPage() {
  const [isMember, setIsMember] = useState(false);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [merchant, setMerchant] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [session, setSession] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }
    setErrorMsg("");
    setStatus("loading");
    try {
      const payload = {
        amount: parseFloat(amount),
        currency: "USD",
        is_member: isMember,
        payer_name: name || "Anonymous",
        payer_email: email || null,
        merchant_name: merchant || "FreePay Checkout",
      };
      const res = await axios.post(`${API}/payment/initiate`, payload);
      setSession(res.data);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Payment failed. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success" && session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Initiated!</h2>
          <p className="text-gray-500 mb-6">
            Your FreePay session has been created. The quantum economic network is processing
            your transaction.
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Session ID</span>
              <span className="font-mono text-xs text-gray-700 truncate max-w-[180px]">{session.session_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-semibold text-gray-900">${session.amount.toFixed(2)} {session.currency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="font-semibold text-blue-600 capitalize">{session.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Account type</span>
              <span className="font-semibold text-gray-900">{session.is_member ? "Member" : "Guest"}</span>
            </div>
          </div>
          <button
            onClick={() => { setStatus("idle"); setSession(null); setAmount(""); }}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
          >
            Make Another Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4 pb-16">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pay with FreePay</h1>
          <p className="text-gray-500">Universal quantum payment — works for everyone.</p>
        </div>

        {/* Member / Non-member toggle */}
        <div className="bg-white rounded-2xl p-1 flex gap-1 shadow-sm border border-gray-100 mb-6">
          <button
            onClick={() => setIsMember(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition ${
              !isMember
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <User className="w-4 h-4" /> Guest / Non-Member
          </button>
          <button
            onClick={() => setIsMember(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition ${
              isMember
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <UserCheck className="w-4 h-4" /> Member
          </button>
        </div>

        {/* Payment form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <AmountInput value={amount} onChange={setAmount} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name {!isMember && <span className="text-gray-400 font-normal">(optional)</span>}
            </label>
            <input
              type="text"
              placeholder={isMember ? "Full name" : "Anonymous"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
            />
          </div>

          {isMember && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Merchant / Store <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Merchant or store name"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {status === "loading" ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
            ) : (
              <>Pay Now <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          FreePay is open to everyone. No account required for guest payments.
          {isMember ? " Member benefits applied." : ""}
        </p>
      </div>
    </div>
  );
}
