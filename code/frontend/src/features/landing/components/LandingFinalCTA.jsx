import React from 'react';
import { Link } from 'react-router-dom';

const LandingFinalCTA = () => {
  return (
    <>
      <div style={{ background: "var(--bg)", borderTop: "1px solid var(--g100)", padding: "56px 56px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "0", background: "radial-gradient(ellipse 60% 80% at 50% 100%,rgba(30,112,125,.1) 0%,transparent 70%)", pointerEvents: "none" }}></div>
        <div style={{ position: "relative", zIndex: "1", maxWidth: "680px", margin: "0 auto" }}>
            <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--g400)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px" }}>DevTrack AI · 2025</p>
            <h3 style={{ fontSize: "clamp(22px,3.5vw,38px)", fontWeight: "900", letterSpacing: "-1.5px", color: "var(--g900)", lineHeight: "1.15", marginBottom: "14px", position: "relative", isolation: "isolate" }} className="st-aura">Where software projects become<br /><span style={{ color: "var(--t)" }}>engineering excellence.</span></h3>
            <p style={{ fontSize: "14px", color: "var(--g400)", fontWeight: "500", maxWidth: "400px", margin: "0 auto 28px", lineHeight: "1.7" }}>AI-powered · Audit-ready · Built for university IT students who build like professionals.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <Link to="/dashboard" style={{ padding: "12px 28px", background: "var(--t)", color: "#fff", borderRadius: "10px", fontSize: "13px", fontWeight: "700", textDecoration: "none", boxShadow: "0 4px 16px rgba(30,112,125,.35)", transition: "all .2s" }}>
                    Get Started Free →
                </Link>
                <a href="#features" style={{ padding: "12px 22px", background: "transparent", border: "1.5px solid var(--g200)", color: "var(--g600)", borderRadius: "10px", fontSize: "13px", fontWeight: "600", textDecoration: "none", transition: "all .2s" }}>
                    Explore Features
                </a>
            </div>
        </div>
      </div>
    </>
  );
};

export default LandingFinalCTA;

