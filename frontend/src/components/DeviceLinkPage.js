import { useState, useEffect } from "react";
import { Smartphone, CheckCircle, Loader2, QrCode, Link2 } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function generateDeviceId() {
  const stored = localStorage.getItem("freepay_device_id");
  if (stored) return stored;
  const id =
    "dev_" +
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "")
      : Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""));
  localStorage.setItem("freepay_device_id", id);
  return id;
}

export default function DeviceLinkPage() {
  const [deviceId] = useState(() => generateDeviceId());
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [linked, setLinked] = useState(false);

  const siteUrl = `${window.location.origin}/pay?device=${deviceId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(siteUrl)}&ecc=H&color=4f46e5&bgcolor=ffffff`;

  // Check if this device was previously linked
  useEffect(() => {
    const wasLinked = localStorage.getItem("freepay_linked");
    if (wasLinked === "true") setLinked(true);
  }, []);

  const handleLink = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      await axios.post(`${API}/device/register`, {
        device_id: deviceId,
        nickname: nickname || "My Device",
        user_agent: navigator.userAgent,
      });
      localStorage.setItem("freepay_linked", "true");
      setLinked(true);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to link device. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4 pb-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Link2 className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Link Your Device</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Connect your device to the FreePay quantum network. Once linked, you can use
            FreePay payments anywhere with a single tap.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 uppercase tracking-wide">
              <QrCode className="w-4 h-4" /> Your Personal QR Code
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4">
              <img
                src={qrUrl}
                alt="Personal FreePay QR Code"
                className="w-[200px] h-[200px] rounded-xl"
              />
            </div>
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Share this QR code so others can pay you instantly via FreePay — no account
              needed on their end.
            </p>
            <div className="w-full bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-xs text-gray-400 mb-1">Device ID</p>
              <p className="font-mono text-xs text-gray-600 break-all">{deviceId}</p>
            </div>
          </div>

          {/* Link form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {linked ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Device Linked!</h3>
                <p className="text-sm text-gray-500">
                  This device is registered on the FreePay network. You can now use FreePay
                  as a payment option anywhere it's offered.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 w-full">
                  <p className="text-xs text-green-700 font-medium">
                    ✓ Network status: Active
                  </p>
                  <p className="text-xs text-green-600 mt-1">Device ID: {deviceId}</p>
                </div>
                <button
                  onClick={() => { setLinked(false); localStorage.removeItem("freepay_linked"); }}
                  className="text-sm text-gray-400 hover:text-gray-600 underline"
                >
                  Unlink this device
                </button>
              </div>
            ) : (
              <form onSubmit={handleLink} className="space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Register Device</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Nickname <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. My iPhone, Work Laptop"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-blue-700">
                    <strong>What happens when you link?</strong>
                    <br />
                    Your device is registered on the FreePay network. This lets you use
                    FreePay as a one-tap payment option on any participating site.
                  </p>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Linking…</>
                  ) : (
                    <><Link2 className="w-5 h-5" /> Link This Device</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Explainer */}
        <div className="mt-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-3">Why Link Your Device?</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              Your personal QR code lets others pay you instantly with no friction.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              Linked devices get priority routing through the FreePay quantum network.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">•</span>
              Share your QR at markets, events, or embed it on your website to accept
              FreePay from anyone.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">•</span>
              Non-members can still pay — no account required on the sender's side.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
