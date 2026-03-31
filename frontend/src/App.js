import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DualCLogo = ({ size = 80 }) => (
  <svg
    width={size}
    height={size * 0.5}
    viewBox="0 0 200 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Claudia AI Dual C logo"
  >
    <defs>
      <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#D65856" />
        <stop offset="20%" stopColor="#F97316" />
        <stop offset="40%" stopColor="#FBBF24" />
        <stop offset="60%" stopColor="#22C55E" />
        <stop offset="80%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
      <linearGradient id="rainbowGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="20%" stopColor="#3B82F6" />
        <stop offset="40%" stopColor="#22C55E" />
        <stop offset="60%" stopColor="#FBBF24" />
        <stop offset="80%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#D65856" />
      </linearGradient>
    </defs>
    {/* Left C arc */}
    <path
      d="M 95 50
         C 95 22 75 8 55 8
         C 30 8 10 26 10 50
         C 10 74 30 92 55 92
         C 75 92 95 78 95 50 Z"
      fill="none"
      stroke="url(#rainbowGrad)"
      strokeWidth="14"
      strokeLinecap="round"
      strokeDasharray="170 300"
      strokeDashoffset="-10"
    />
    {/* Right C arc (mirrored) */}
    <path
      d="M 105 50
         C 105 22 125 8 145 8
         C 170 8 190 26 190 50
         C 190 74 170 92 145 92
         C 125 92 105 78 105 50 Z"
      fill="none"
      stroke="url(#rainbowGrad2)"
      strokeWidth="14"
      strokeLinecap="round"
      strokeDasharray="170 300"
      strokeDashoffset="-10"
    />
  </svg>
);

const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{description}</p>
  </div>
);

const Home = () => {
  useEffect(() => {
    const ping = async () => {
      try {
        const response = await axios.get(`${API}/`);
        console.log(response.data.message);
      } catch (e) {
        console.error(e, `errored out requesting / api`);
      }
    };
    ping();
  }, []);

  return (
    <div className="claudia-root">
      {/* Navigation */}
      <nav className="claudia-nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <DualCLogo size={56} />
            <div className="nav-brand-text">
              <span className="nav-brand-name">Claudia AI</span>
              <span className="nav-brand-sub">Dual C Technology</span>
            </div>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#solutions" className="nav-link">Solutions</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-cta-btn">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="claudia-hero">
        <div className="hero-inner">
          <div className="hero-logo-wrap">
            <DualCLogo size={200} />
          </div>
          <h1 className="hero-headline">
            <span className="gradient-text">Claudia AI</span>
          </h1>
          <p className="hero-sub">Dual C Technology</p>
          <p className="hero-description">
            Powering the future with intelligent, adaptive AI solutions.<br />
            Where innovation meets infinite possibility.
          </p>
          <div className="hero-actions">
            <a href="#features" className="btn-primary">Explore Solutions</a>
            <a href="#about" className="btn-secondary">Learn More</a>
          </div>
        </div>
        <div className="hero-bg-orb orb1" aria-hidden="true" />
        <div className="hero-bg-orb orb2" aria-hidden="true" />
      </section>

      {/* Features */}
      <section id="features" className="claudia-features">
        <div className="section-inner">
          <h2 className="section-title">Built for the Future</h2>
          <p className="section-sub">Dual C Technology brings together two pillars of modern AI — Cognition and Creation.</p>
          <div className="features-grid">
            <FeatureCard
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" stroke="url(#f1)" strokeWidth="2.5" />
                  <path d="M10 16 L14 20 L22 12" stroke="url(#f1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="f1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F97316" /><stop offset="1" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
              }
              title="Intelligent Cognition"
              description="Deep understanding and contextual reasoning that adapts to your unique workflows and challenges."
            />
            <FeatureCard
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="4" width="24" height="24" rx="5" stroke="url(#f2)" strokeWidth="2.5" />
                  <path d="M10 22 L16 10 L22 22" stroke="url(#f2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 18 L20 18" stroke="url(#f2)" strokeWidth="2" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="f2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#22C55E" /><stop offset="1" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
              }
              title="Creative Generation"
              description="Unleash limitless creative potential with AI-driven content, design, and code generation at scale."
            />
            <FeatureCard
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4 L28 10 L28 22 L16 28 L4 22 L4 10 Z" stroke="url(#f3)" strokeWidth="2.5" strokeLinejoin="round" />
                  <circle cx="16" cy="16" r="4" stroke="url(#f3)" strokeWidth="2.5" />
                  <defs>
                    <linearGradient id="f3" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FBBF24" /><stop offset="1" stopColor="#D65856" />
                    </linearGradient>
                  </defs>
                </svg>
              }
              title="Seamless Integration"
              description="Connect effortlessly with your existing tools, platforms, and data pipelines through our open API."
            />
            <FeatureCard
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M6 16 C6 10 10 6 16 6 C22 6 26 10 26 16 C26 22 22 26 16 26" stroke="url(#f4)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M16 26 C13 26 10 24 9 21" stroke="url(#f4)" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="16" cy="16" r="3" fill="url(#f4)" />
                  <defs>
                    <linearGradient id="f4" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3B82F6" /><stop offset="1" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
              }
              title="Infinite Scalability"
              description="From startups to enterprise, Claudia AI scales with you — delivering consistent performance at any size."
            />
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="claudia-solutions">
        <div className="section-inner">
          <h2 className="section-title light">Our Solutions</h2>
          <p className="section-sub light">Two platforms. One vision. Infinite impact.</p>
          <div className="solutions-grid">
            <div className="solution-card">
              <div className="solution-logo">
                <DualCLogo size={60} />
                <span>Metris App</span>
              </div>
              <p>Analytics and intelligence platform for real-time insights and data-driven decision making.</p>
              <a href="#contact" className="solution-link">Learn More →</a>
            </div>
            <div className="solution-card solution-card-dark">
              <div className="solution-logo">
                <DualCLogo size={60} />
                <span>MatKe App</span>
              </div>
              <p>AI-powered marketing engine that crafts, personalizes, and deploys campaigns at scale.</p>
              <a href="#contact" className="solution-link">Learn More →</a>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="claudia-about">
        <div className="section-inner about-inner">
          <div className="about-text">
            <h2 className="section-title">About Claudia AI</h2>
            <p>
              Claudia AI is built on the principle that intelligence and creativity are inseparable.
              Our Dual C Technology framework unites Cognitive AI with Creative AI into a single,
              coherent platform — giving teams the power to think deeper and build faster.
            </p>
            <p>
              With a commitment to openness, inclusivity, and human-centred design, Claudia AI
              empowers individuals and organisations to achieve what was once impossible.
            </p>
            <a href="#contact" className="btn-primary">Join the Journey</a>
          </div>
          <div className="about-palette">
            <h3>Brand Colors</h3>
            <div className="palette-row">
              {["#D65856","#F97316","#FBBF24","#22C55E","#3B82F6","#8B5CF6"].map(c => (
                <div key={c} className="palette-swatch" style={{ background: c }} title={c} />
              ))}
            </div>
            <div className="palette-row mt-2">
              {["#FFFFFF","#E5DEFE","#634550","#234880","#444444"].map(c => (
                <div key={c} className="palette-swatch neutral-swatch" style={{ background: c }} title={c} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="claudia-cta">
        <div className="section-inner cta-inner">
          <DualCLogo size={120} />
          <h2 className="cta-headline gradient-text">Ready to get started?</h2>
          <p className="cta-sub">Join thousands of teams already using Claudia AI to transform their workflows.</p>
          <a href="mailto:hello@claudia.ai" className="btn-primary btn-large">Contact Us</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="claudia-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <DualCLogo size={40} />
            <div>
              <div className="footer-name">Claudia AI</div>
              <div className="footer-tagline">Dual C Technology</div>
            </div>
          </div>
          <div className="footer-copy">© {new Date().getFullYear()} Claudia AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
