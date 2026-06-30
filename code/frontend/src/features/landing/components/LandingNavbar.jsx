import React from 'react';
import { Link } from 'react-router-dom';

const LandingNavbar = () => {
  return (
    <>
      <nav className="landing-nav">
        <a href="#" className="nlogo">
            <div className="lmark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            DevTrack<span style={{ color: "var(--t)", marginLeft: "2px" }}>AI</span>
        </a>
        <ul className="nlinks">
            <li><a href="#features">Features</a></li>
            <li><a href="#classroom">Classroom</a></li>
            <li><a href="#codeinsight">Code Insight</a></li>
            <li><a href="#gallery">Preview</a></li>
            <li><a href="#team">Team</a></li>
        </ul>
        <div className="nact">
            <Link to="/login" className="bng">Log in</Link>
            <Link to="/dashboard" className="bnp">Get Started →</Link>
        </div>
      </nav>
    </>
  );
};

export default LandingNavbar;
