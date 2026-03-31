import { Link } from "react-router-dom";
import { ArrowRight, QrCode, CreditCard, Globe, Zap, Users, Infinity } from "lucide-react";

function GradientIcon({ children, from, to }) {
  return (
    <div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${from} ${to} shadow-lg`}
    >
      {children}
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold flex items-center justify-center shadow">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const siteUrl = window.location.origin;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(siteUrl)}&ecc=H`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-orange-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 pt-32 pb-24 text-center">
          {/* Infinity icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <Infinity className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300 bg-clip-text text-transparent">
              Quantum Economics
            </span>
            <br />
            <span className="text-white">Meets Payments</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            FreePay is a universal payment system built on quantum economic principles — open
            to everyone, whether you're a member or not. Just scan, tap, and pay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pay"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-semibold text-lg hover:opacity-90 transition shadow-xl"
            >
              Pay with FreePay <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/link"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur rounded-full font-semibold text-lg hover:bg-white/20 transition border border-white/20"
            >
              <QrCode className="w-5 h-5" /> Link My Device
            </Link>
          </div>
        </div>
        {/* Wave */}
        <div className="relative h-16">
          <svg viewBox="0 0 1440 64" fill="none" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,64 C360,0 1080,0 1440,64 L1440,64 L0,64 Z" fill="rgb(249 250 251)" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Everyone
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            No account required. No barriers to entry. FreePay works for any person, any
            device, any e-commerce platform — automatically.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={
              <GradientIcon from="from-blue-400" to="to-blue-600">
                <QrCode className="w-7 h-7 text-white" />
              </GradientIcon>
            }
            title="Instant QR Access"
            description="Scan a QR code and you're in. No app download required — works as an instant web app on any smartphone."
          />
          <FeatureCard
            icon={
              <GradientIcon from="from-purple-400" to="to-purple-600">
                <Users className="w-7 h-7 text-white" />
              </GradientIcon>
            }
            title="Member & Non-Member"
            description="Whether you've heard of FreePay or not, it works for you. It surfaces automatically as a payment option at checkout."
          />
          <FeatureCard
            icon={
              <GradientIcon from="from-orange-400" to="to-red-500">
                <Globe className="w-7 h-7 text-white" />
              </GradientIcon>
            }
            title="Universal E-Commerce"
            description="Embed FreePay as a payment option on any online store. Powered by quantum economic principles that benefit every participant."
          />
          <FeatureCard
            icon={
              <GradientIcon from="from-green-400" to="to-emerald-600">
                <Zap className="w-7 h-7 text-white" />
              </GradientIcon>
            }
            title="Quantum Speed"
            description="Transactions resolve instantly using a distributed trust network. No waiting, no unnecessary fees, no friction."
          />
          <FeatureCard
            icon={
              <GradientIcon from="from-pink-400" to="to-rose-600">
                <CreditCard className="w-7 h-7 text-white" />
              </GradientIcon>
            }
            title="Any Currency"
            description="Pay in whatever form of value you have. FreePay's quantum economic layer handles conversion automatically."
          />
          <FeatureCard
            icon={
              <GradientIcon from="from-cyan-400" to="to-blue-500">
                <Infinity className="w-7 h-7 text-white" />
              </GradientIcon>
            }
            title="Claudia AI Powered"
            description="Claudia AI provides intelligent transaction routing and real-time fraud prevention within the FreePay network."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How FreePay Works
            </h2>
            <p className="text-gray-500">Three simple steps to quantum-powered payments.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <StepCard
                number="1"
                title="Scan or Visit"
                description="Scan a FreePay QR code with any smartphone camera or visit the site directly. No app install needed — it works as an instant web app."
              />
              <StepCard
                number="2"
                title="Link Your Device"
                description="Your device is registered to the FreePay network in seconds. Members get enhanced features; non-members get full payment functionality by default."
              />
              <StepCard
                number="3"
                title="Pay Anywhere"
                description="FreePay appears as a payment option on participating e-commerce sites. Click it, confirm, and the quantum economic engine does the rest."
              />
            </div>
            {/* QR Code display */}
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gray-50 border-2 border-dashed border-blue-200 rounded-3xl p-8 flex flex-col items-center gap-4">
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                  Scan to Get Started
                </p>
                <img
                  src={qrUrl}
                  alt="FreePay QR Code"
                  className="w-[220px] h-[220px] rounded-xl"
                />
                <p className="text-xs text-gray-400 text-center">
                  Works on any iOS or Android device
                </p>
              </div>
              <Link
                to="/link"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Or link your device manually →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-16 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to experience Quantum Economics?
          </h2>
          <p className="text-blue-100 mb-8">
            FreePay is free to use, free to access, and designed to help everyone — regardless
            of prior knowledge or membership status.
          </p>
          <Link
            to="/pay"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-full font-bold text-lg hover:bg-blue-50 transition shadow-xl"
          >
            Try a Payment <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-10 text-center text-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-semibold">FreePay</span>
          </div>
          <p>Quantum Economics • Universal Payments • Powered by Claudia AI</p>
          <p className="mt-2">© {new Date().getFullYear()} FreePay. Open to everyone.</p>
        </div>
      </footer>
    </div>
  );
}
