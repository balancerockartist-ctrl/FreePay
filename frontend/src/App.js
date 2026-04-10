import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FreePayDashboard from "@/components/FreePayDashboard";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FreePayDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
