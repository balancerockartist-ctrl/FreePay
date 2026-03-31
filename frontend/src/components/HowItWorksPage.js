import { ArrowRight, Zap, QrCode, CreditCard, Smartphone, Globe } from "lucide-react";
import { Link } from "react-router-dom";

function Step({ number, icon, title, description, color }) {
  return (
    <div className="relative flex flex-col items-center text-center px-4">
      <div className={`w-16 h-16 rounded-full ${color} flex items-center justify-center shadow-lg mb-4`}>
        {icon}
      </div>
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow text-xs font-bold text-gray-700 flex items-center justify-center border border-gray-100">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function FAQItem({ question, answer }) {
  return (
    <div className="border-b border-gray-100 pb-5">
      <h4 className="font-semibold text-gray-900 mb-2">{question}</h4>
      <p className="text-sm text-gray-500 leading-relaxed">{answer}</p>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Page header */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white pt-16 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            How FreePay Works
          </h1>
          <p className="text-blue-100 text-lg">
            A complete guide to quantum-powered payments — from scan to confirmation.
          </p>
        </div>
        <div className="relative h-12 -mb-1">
          <svg viewBox="0 0 1440 48" fill="none" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" fill="rgb(249 250 251)" />
          </svg>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">The Payment Journey</h2>
          <p className="text-gray-500">Five steps from zero knowledge to completed transaction.</p>
        </div>

        <div className="relative grid md:grid-cols-5 gap-8">
          {/* Connecting line */}
          <div className="hidden md:block absolute h-0.5 bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300 opacity-30 pointer-events-none" style={{top:"32px", left:"10%", right:"10%"}} />

          {[
            {
              number: "1",
              icon: <QrCode className="w-7 h-7 text-white" />,
              title: "Discover",
              description: "Scan a FreePay QR code or see FreePay listed as a payment option at checkout.",
              color: "bg-gradient-to-br from-blue-400 to-blue-600",
            },
            {
              number: "2",
              icon: <Smartphone className="w-7 h-7 text-white" />,
              title: "Open",
              description: "An instant web app opens — no download needed. Works on any iOS or Android browser.",
              color: "bg-gradient-to-br from-indigo-400 to-indigo-600",
            },
            {
              number: "3",
              icon: <Zap className="w-7 h-7 text-white" />,
              title: "Connect",
              description: "Your device is linked to the FreePay quantum network in seconds.",
              color: "bg-gradient-to-br from-purple-400 to-purple-600",
            },
            {
              number: "4",
              icon: <CreditCard className="w-7 h-7 text-white" />,
              title: "Pay",
              description: "Enter an amount, confirm, and the quantum economic layer processes the transaction.",
              color: "bg-gradient-to-br from-pink-400 to-rose-600",
            },
            {
              number: "5",
              icon: <Globe className="w-7 h-7 text-white" />,
              title: "Done",
              description: "Both parties receive confirmation. No waiting, no unnecessary fees.",
              color: "bg-gradient-to-br from-orange-400 to-red-500",
            },
          ].map((step) => (
            <Step key={step.number} {...step} />
          ))}
        </div>
      </section>

      {/* What is quantum economics */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What is Quantum Economics?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              The principle behind FreePay — a new way of thinking about value exchange.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-2">Value is Universal</h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Quantum economics recognizes that value flows in multiple directions simultaneously.
                  Every participant in a transaction can receive benefit — not just the seller.
                </p>
              </div>
              <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-2">Network Effect Multiplier</h4>
                <p className="text-sm text-purple-700 leading-relaxed">
                  Each new user and device strengthens the entire network. FreePay grows
                  more powerful and more useful as more people use it — like a quantum
                  entanglement of economic energy.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                <h4 className="font-semibold text-orange-900 mb-2">Accessibility First</h4>
                <p className="text-sm text-orange-700 leading-relaxed">
                  Traditional payment systems gatekeep access. FreePay's quantum model ensures
                  anyone can participate — whether they have a bank account, crypto wallet,
                  or just a phone.
                </p>
              </div>
              <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
                <h4 className="font-semibold text-green-900 mb-2">AI-Powered by Claudia AI</h4>
                <p className="text-sm text-green-700 leading-relaxed">
                  The Claudia AI engine manages routing, trust scoring, and conversion across
                  the FreePay network in real time, ensuring every transaction is optimal
                  for all parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* E-commerce integration */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-3">For E-Commerce Merchants</h2>
          <p className="text-slate-300 mb-6 text-sm leading-relaxed">
            Add FreePay as a payment option on your store and reach customers who may not
            have traditional payment methods — or who simply prefer the quantum way.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: "⚡", title: "One-line embed", desc: "Add a single script tag to your checkout page." },
              { icon: "🌐", title: "Zero friction", desc: "Customers don't need an account to pay you via FreePay." },
              { icon: "🔒", title: "Instant confirm", desc: "Transactions confirm in real time — no chargebacks." },
            ].map((item) => (
              <div key={item.title} className="bg-white/10 rounded-2xl p-4">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link
            to="/pay"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Try a Payment <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FAQItem
              question="Do I need an account to use FreePay?"
              answer="No. Guest payments require no account at all. Simply visit, confirm the amount, and pay. Members get additional features like transaction history and priority routing."
            />
            <FAQItem
              question="What currencies does FreePay support?"
              answer="FreePay is designed to handle any form of value exchange. The quantum economic layer manages conversion between currencies, tokens, and other value forms automatically."
            />
            <FAQItem
              question="How do I add FreePay to my online store?"
              answer="Contact us via the FreePay network to get your merchant embed code. A single script tag added to your checkout page makes FreePay appear as an automatic payment option."
            />
            <FAQItem
              question="What is Claudia AI's role?"
              answer="Claudia AI is the intelligence layer of FreePay. It handles transaction routing, trust scoring, fraud prevention, and real-time optimization across the entire quantum economic network."
            />
            <FAQItem
              question="What is the godworld.org connection?"
              answer="godworld.org is the broader ecosystem that FreePay is part of — a quantum economic network exploring new forms of value creation and exchange. Scan the QR code to learn more."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-14 text-white text-center px-4">
        <h2 className="text-3xl font-bold mb-4">Start using FreePay today</h2>
        <p className="text-blue-100 mb-6 max-w-xl mx-auto">
          No account needed. No barriers. Just quantum-powered payments for everyone.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/pay"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white text-blue-700 rounded-full font-bold hover:bg-blue-50 transition"
          >
            Pay Now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/link"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white/15 rounded-full font-semibold hover:bg-white/25 transition border border-white/30"
          >
            <QrCode className="w-4 h-4" /> Link My Device
          </Link>
        </div>
      </section>
    </div>
  );
}
