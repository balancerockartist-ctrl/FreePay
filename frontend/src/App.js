import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PaymentFlow } from "@/components/PaymentFlow";

const Home = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">FreePay</h1>
        <span className="text-xs text-muted-foreground">Solana · Devnet</span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 gap-6">
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Scan an item with your camera, select its category, then send a
          Solana payment directly from your wallet.
        </p>
        <PaymentFlow />
      </main>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
