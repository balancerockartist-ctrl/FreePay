import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [healthy, setHealthy] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get(`${API}/`);
        if (response.data.message) {
          setHealthy(true);
        }
      } catch (e) {
        console.error(e, "errored out requesting / api");
        setHealthy(false);
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center text-white px-6">
      {/* Logo / Brand */}
      <div className="mb-8 flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-indigo-500 flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-500/30">
          F
        </div>
        <h1 className="text-4xl font-bold tracking-tight">FreePay</h1>
      </div>

      {/* Tagline */}
      <p className="text-lg text-slate-400 mb-10 text-center max-w-md">
        Open-source payments, organized by <span className="text-indigo-400 font-medium">Claudia&nbsp;AI</span>.
      </p>

      {/* Status badge */}
      <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm backdrop-blur">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            healthy === true
              ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
              : healthy === false
              ? "bg-red-400 shadow-sm shadow-red-400/50"
              : "bg-yellow-400 animate-pulse"
          }`}
        />
        <span className="text-slate-300">
          {healthy === true
            ? "API connected"
            : healthy === false
            ? "API unreachable"
            : "Checking API…"}
        </span>
      </div>

      {/* Feature cards */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
        {[
          {
            title: "Fast",
            desc: "Async Python backend powered by FastAPI.",
          },
          {
            title: "Modern",
            desc: "React 19 frontend with Tailwind CSS & shadcn/ui.",
          },
          {
            title: "Scalable",
            desc: "MongoDB for flexible, document-based storage.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur"
          >
            <h3 className="text-base font-semibold text-indigo-300 mb-1">
              {card.title}
            </h3>
            <p className="text-sm text-slate-400">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-16 text-xs text-slate-600">
        © {new Date().getFullYear()} FreePay · Organized by Claudia AI
      </p>
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
