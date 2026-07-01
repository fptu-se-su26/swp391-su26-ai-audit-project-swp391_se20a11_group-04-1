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
            <li><a href="#codeinsight">Code Insight</a></li>
            <li><a href="#classroom">Classroom</a></li>
            <li><a href="#gallery">Preview</a></li>
            <li><a href="#team">Team</a></li>
        </ul>
        <style>{`
          .nav-auth {
              display: flex;
              align-items: center;
              background: rgba(30, 112, 125, 0.05);
              border: 1px solid rgba(30, 112, 125, 0.15);
              border-radius: 100px;
              padding: 3px;
              backdrop-filter: blur(8px);
              transition: all 0.3s ease;
              margin-left: 12px;
          }
          .nav-auth:hover {
              background: rgba(30, 112, 125, 0.08);
              border-color: rgba(30, 112, 125, 0.25);
              box-shadow: 0 4px 16px rgba(30, 112, 125, 0.12);
          }
          .auth-btn {
              font-size: 13.5px;
              font-weight: 700;
              padding: 6px 14px;
              border-radius: 100px;
              text-decoration: none;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              display: flex;
              align-items: center;
          }
          .auth-login {
              color: var(--g700);
          }
          .auth-login:hover {
              color: var(--t);
              background: rgba(255, 255, 255, 0.9);
              box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          }
          .auth-register {
              color: #fff;
              background: linear-gradient(135deg, var(--t) 0%, var(--c) 100%);
              box-shadow: 0 2px 8px rgba(30,112,125,0.3);
          }
          .auth-register:hover {
              box-shadow: 0 6px 16px rgba(30,112,125,0.4);
              transform: translateY(-1px);
              filter: brightness(1.1);
          }
          .auth-divider {
              width: 1.5px;
              height: 12px;
              background: rgba(30, 112, 125, 0.15);
              margin: 0 4px;
              border-radius: 2px;
          }
        `}</style>
        <div className="nav-auth">
            <Link to="/login" className="auth-btn auth-login">Login</Link>
            <div className="auth-divider"></div>
            <Link to="/register" className="auth-btn auth-register">
                Register
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: 4}}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
        </div>
      </nav>
    </>
  );
};

export default LandingNavbar;
