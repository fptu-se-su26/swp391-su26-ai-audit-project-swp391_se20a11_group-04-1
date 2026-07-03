import React from 'react';

const LandingFooter = () => {
  return (
    <>
      <style>{`
        .lf-wrapper {
            background-color: #082226; /* Darker, almost black teal */
            border-top: 1px solid #10444C;
            padding: 30px 5% 16px; 
            color: #bce4e8;
        }
        
        .lf-container {
            max-width: 100%; 
            margin: 0 auto;
            display: grid;
            grid-template-columns: 2.2fr 0.9fr 0.9fr 1.7fr; 
            gap: 30px;
        }

        /* Column 1 */
        .lf-brand-col {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .lf-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
            text-decoration: none;
            letter-spacing: -0.5px;
        }

        .lf-slogan {
            font-size: 13.5px;
            line-height: 1.5;
            color: #bce4e8;
        }
        .lf-badges {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 2px;
        }
        .lf-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 12px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 600;
            border: 1px solid #10444C;
            background: #05161A;
            color: #a5f3fc;
        }
        .lf-badge.green {
            color: #6ee7b7;
            background: rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.3);
        }
        .lf-badge.purple {
            color: #d8b4fe;
            background: rgba(192, 132, 252, 0.15);
            border-color: rgba(192, 132, 252, 0.3);
        }
        .lf-socials {
            display: flex;
            gap: 14px;
            margin-top: 8px;
        }
        .lf-social {
            color: #8bd4db;
            transition: color 0.2s ease;
        }
        .lf-social:hover {
            color: #ffffff;
        }
        .lf-social svg {
            width: 18px; height: 18px;
        }

        /* Link Columns */
        .lf-col {
            display: flex;
            flex-direction: column;
        }
        .lf-col h4 {
            color: #ffffff;
            font-size: 12.5px;
            font-weight: 700;
            margin-bottom: 16px; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .lf-links {
            display: flex;
            flex-direction: column;
            gap: 12px; 
        }
        .lf-links a {
            color: #a5f3fc;
            text-decoration: none;
            font-size: 13.5px;
            font-weight: 500;
            transition: color 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .lf-links a:hover {
            color: #ffffff;
        }
        .lf-links a svg {
            width: 14px; height: 14px; opacity: 0.8;
        }

        /* Newsletter Box - Compact & Unified */
        .lf-newsletter {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 12px 14px; 
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
        }
        .lf-newsletter h5 {
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 4px;
            letter-spacing: 0.3px;
        }
        .lf-newsletter p {
            font-size: 12px;
            color: #8bd4db;
            margin-bottom: 12px;
            line-height: 1.4;
        }
        .lf-form {
            display: flex;
            background: #030D0F;
            border: 1px solid #10444C;
            border-radius: 6px;
            padding: 3px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .lf-form:focus-within {
            border-color: #2DD4BF;
            box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.1);
        }
        .lf-input {
            flex: 1;
            background: transparent;
            border: none;
            padding: 6px 10px; 
            font-size: 12px;
            color: #ffffff;
            outline: none;
            min-width: 0;
        }
        .lf-input::placeholder {
            color: #4a757c;
        }
        .lf-btn {
            background: #2DD4BF;
            color: #030D0F;
            border: none;
            padding: 0 12px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.2s;
        }
        .lf-btn:hover {
            opacity: 0.85;
        }
        .lf-btn svg { width: 14px; height: 14px; stroke-width: 2.5px; }

        /* Bottom Row */
        .lf-bottom {
            max-width: 100%; 
            margin: 30px auto 0; 
            padding-top: 20px;
            border-top: 1px solid #10444C;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            font-size: 13px;
            color: #8bd4db;
        }
        .lf-bottom-links {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
        }
        .lf-bottom-links a {
            color: #8bd4db;
            text-decoration: none;
            transition: color 0.2s;
        }
        .lf-bottom-links a:hover {
            color: #ffffff;
        }
        .lf-status {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #5eead4;
            font-weight: 500;
        }
        .lf-status-dot {
            width: 6px; height: 6px;
            background: #34d399;
            border-radius: 50%;
        }
        
        .lf-powered {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
            color: #8bd4db;
            font-size: 13px;
        }
        .lf-powered svg {
            color: #2DD4BF;
        }

        @media (max-width: 992px) {
            .lf-container { grid-template-columns: 1fr 1fr; gap: 40px; }
        }
        @media (max-width: 600px) {
            .lf-container { grid-template-columns: 1fr; }
            .lf-bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <footer className="lf-wrapper">
        <div className="lf-container">
            {/* Column 1: Brand */}
            <div className="lf-brand-col">
                <a href="#" className="lf-logo">
                    DevTrack<span style={{color: '#2DD4BF'}}>AI</span>
                </a>
                <p className="lf-slogan">
                    AI-powered software project management platform built for IT university students. From requirements to full audit trail — automated.
                </p>
                <div className="lf-badges">
                    <div className="lf-badge">
                        <span style={{fontFamily: 'monospace', fontWeight: 'bold', color: '#2DD4BF'}}>$</span>
                         AI Power
                    </div>
                    <div className="lf-badge green">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        Free for Students
                    </div>
                    <div className="lf-badge purple">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Audit-Ready
                    </div>
                </div>
                <div className="lf-socials">
                    <a href="#" className="lf-social" title="Twitter/X"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
                    <a href="#" className="lf-social" title="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
                    <a href="#" className="lf-social" title="GitHub"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg></a>
                </div>
            </div>

            {/* Column 2: Resources */}
            <div className="lf-col">
                <h4>Resources</h4>
                <div className="lf-links">
                    <a href="#">Documentation</a>
                    <a href="#">API Reference</a>
                    <a href="#">Video Tutorials</a>
                    <a href="#">Changelog</a>
                </div>
            </div>

            {/* Column 3: Community */}
            <div className="lf-col">
                <h4>Community</h4>
                <div className="lf-links">
                    <a href="#">Discord Server</a>
                    <a href="#">Developer Forum</a>
                    <a href="#">Open Source</a>
                    <a href="#">Campus Ambassadors</a>
                </div>
            </div>

            {/* Column 3: Newsletter */}
            <div className="lf-col">
                <div className="lf-newsletter">
                    <h5>Stay updated</h5>
                    <p>Get notified on new modules & updates.</p>
                    <div className="lf-form">
                        <input type="email" placeholder="your@email.com" className="lf-input" />
                        <button className="lf-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="lf-bottom">
            <div className="lf-status">
                <div className="lf-status-dot"></div>
                All systems operational
            </div>
            
            <div>© 2026 DevTrack AI · Built with ❤️ for IT students</div>
            
            <div className="lf-bottom-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Use</a>
                <a href="#">Cookie Policy</a>
            </div>
        </div>
      </footer>
    </>
  );
};

export default LandingFooter;;
