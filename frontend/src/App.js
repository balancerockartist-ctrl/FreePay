import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "@/components/Navigation";
import LandingPage from "@/components/LandingPage";
import HowItWorksPage from "@/components/HowItWorksPage";
import PaymentPage from "@/components/PaymentPage";
import DeviceLinkPage from "@/components/DeviceLinkPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pay" element={<PaymentPage />} />
          <Route path="/link" element={<DeviceLinkPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
