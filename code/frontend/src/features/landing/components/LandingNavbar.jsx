import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingNavbar = () => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('landing-theme') === 'dark');

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('landing-theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.body.classList.add('landing-dark');
    }

    // Cleanup: Remove the class when leaving the landing page so it doesn't affect the internal app
    return () => {
      document.body.classList.remove('landing-dark');
    };
  }, []);

  const toggleDark = (e) => {
    e.preventDefault();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isGoingDark = !isDark;

    const completeToggle = () => {
        if (isGoingDark) {
            document.body.classList.add('landing-dark');
            localStorage.setItem('landing-theme', 'dark');
        } else {
            document.body.classList.remove('landing-dark');
            localStorage.setItem('landing-theme', 'light');
        }
        setIsDark(isGoingDark);
    };

    if (prefersReducedMotion) {
        completeToggle();
        return;
    }

    if (document.documentElement.classList.contains('theme-animating')) return;
    document.documentElement.classList.add('theme-animating');

    // Create full screen overlay with blur
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '999999';
    overlay.style.pointerEvents = 'none';
    overlay.style.overflow = 'hidden';
    overlay.style.transition = 'backdrop-filter 0.6s ease, background-color 0.6s ease';
    overlay.style.backdropFilter = 'blur(0px)';
    overlay.style.backgroundColor = 'rgba(0,0,0,0)';
    
    if (!document.getElementById('theme-cloud-keyframes')) {
        const style = document.createElement('style');
        style.id = 'theme-cloud-keyframes';
        style.innerHTML = `
            @keyframes slideCloudL {
                0% { transform: translateX(-150vw); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateX(150vw); opacity: 0; }
            }
            @keyframes slideCloudR {
                0% { transform: translateX(150vw); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateX(-150vw); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    const cBase = isGoingDark ? '15, 23, 42' : '241, 245, 249'; // Slate 900 or Slate 100
    const cGlow = '14, 165, 233'; // Cyan
    
    // Translucent cloud mask (max alpha 0.5)
    const cloudShape = `
        radial-gradient(circle at 20% 50%, rgba(${cBase}, 0.3) 0%, rgba(${cBase}, 0) 35%),
        radial-gradient(circle at 80% 50%, rgba(${cBase}, 0.3) 0%, rgba(${cBase}, 0) 35%),
        radial-gradient(circle at 35% 35%, rgba(${cBase}, 0.4) 0%, rgba(${cBase}, 0) 40%),
        radial-gradient(circle at 65% 65%, rgba(${cBase}, 0.4) 0%, rgba(${cBase}, 0) 40%),
        radial-gradient(circle at 50% 50%, rgba(${cBase}, 0.5) 0%, rgba(${cGlow}, 0.2) 30%, rgba(${cBase}, 0) 50%)
    `;

    // Translucent left cloud
    const cloudL = document.createElement('div');
    cloudL.style.position = 'absolute';
    cloudL.style.width = '150vw';
    cloudL.style.height = '150vh';
    cloudL.style.left = '-25vw';
    cloudL.style.top = '-25vh';
    cloudL.style.background = cloudShape;
    cloudL.style.filter = 'blur(20px)';
    cloudL.style.animation = 'slideCloudL 1.4s ease-in-out forwards';

    // Translucent right cloud
    const cloudR = document.createElement('div');
    cloudR.style.position = 'absolute';
    cloudR.style.width = '150vw';
    cloudR.style.height = '150vh';
    cloudR.style.left = '-25vw';
    cloudR.style.top = '-25vh';
    cloudR.style.background = cloudShape;
    cloudR.style.filter = 'blur(20px)';
    cloudR.style.animation = 'slideCloudR 1.4s ease-in-out forwards';

    overlay.appendChild(cloudL);
    overlay.appendChild(cloudR);
    document.body.appendChild(overlay);

    // Fade in a VERY mild global blur so the website is perfectly visible, just slightly softened
    requestAnimationFrame(() => {
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.backgroundColor = isGoingDark ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    });

    // Swap at exactly 50% of 1.4s = 700ms
    setTimeout(() => {
        completeToggle();
        
        // Update cloud colors to blend with new theme as they slide away
        const nBase = isGoingDark ? '9, 9, 11' : '255, 255, 255';
        const newShape = `
            radial-gradient(circle at 20% 50%, rgba(${nBase}, 0.3) 0%, rgba(${nBase}, 0) 35%),
            radial-gradient(circle at 80% 50%, rgba(${nBase}, 0.3) 0%, rgba(${nBase}, 0) 35%),
            radial-gradient(circle at 35% 35%, rgba(${nBase}, 0.4) 0%, rgba(${nBase}, 0) 40%),
            radial-gradient(circle at 65% 65%, rgba(${nBase}, 0.4) 0%, rgba(${nBase}, 0) 40%),
            radial-gradient(circle at 50% 50%, rgba(${nBase}, 0.5) 0%, rgba(${cGlow}, 0.2) 30%, rgba(${nBase}, 0) 50%)
        `;
        cloudL.style.background = newShape;
        cloudR.style.background = newShape;
        
        overlay.style.backdropFilter = 'blur(0px)';
        overlay.style.backgroundColor = 'rgba(0,0,0,0)';
    }, 700);

    setTimeout(() => {
        overlay.remove();
        document.documentElement.classList.remove('theme-animating');
    }, 1400);
  };

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
            .theme-switch {
                display: flex;
                align-items: center;
                background: rgba(30, 112, 125, 0.05);
                border: 1px solid rgba(30, 112, 125, 0.15);
                border-radius: 100px;
                padding: 3px;
                gap: 2px;
                backdrop-filter: blur(12px);
                position: fixed;
                top: 88px;
                right: 56px;
                z-index: 998;
                box-shadow: 0 4px 16px rgba(0,0,0,0.06);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .theme-switch:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0,0,0,0.1);
            }
            body.landing-dark .theme-switch {
                background: rgba(255, 255, 255, 0.03);
                border-color: rgba(255, 255, 255, 0.1);
            }
            .theme-switch-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 6px;
                border-radius: 100px;
                color: var(--g600);
                opacity: 0.5;
                background: transparent;
                border: none;
                width: 28px;
                height: 28px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .theme-switch-btn:hover {
                opacity: 0.8;
                transform: scale(1.05);
            }
            body.landing-dark .theme-switch-btn {
                color: #94a3b8;
            }
            
            .theme-switch-btn.active-light {
                opacity: 1;
                color: #d97706; /* Amber-600 */
                background: linear-gradient(145deg, #fef3c7, #fde68a); /* Amber-50 to Amber-200 */
                box-shadow: 0 2px 8px rgba(217, 119, 6, 0.25), inset 0 1px 0 #ffffff;
                transform: scale(1);
            }
            .theme-switch-btn.active-dark {
                opacity: 1;
                color: #a5b4fc; /* Indigo-300 */
                background: linear-gradient(145deg, #3730a3, #312e81); /* Indigo-800 to Indigo-900 */
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1);
                transform: scale(1);
            }
            
            body.landing-dark .auth-login {
                color: #e2e8f0;
            }
            body.landing-dark .auth-login:hover {
                color: var(--c);
                background: rgba(255, 255, 255, 0.1);
            }
          
          /* THEME TRANSITION OVERLAY */
          .theme-overlay {
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              background: var(--bg);
              z-index: 99999;
              pointer-events: none;
              opacity: 0;
              transition: opacity 0.4s ease;
          }
          .theme-overlay.active {
              opacity: 1;
              transition: opacity 0.1s ease;
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
      {/* TRANSITION OVERLAY */}
      <div id="theme-transition-overlay" className="theme-overlay"></div>
      {/* FLOATING THEME SWITCH */}
      <div className="theme-switch" aria-label="Theme Switch">
          <button onClick={(e) => { if(isDark) toggleDark(e); }} className={`theme-switch-btn ${!isDark ? 'active-light' : ''}`} aria-label="Light Mode">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
          </button>
          <button onClick={(e) => { if(!isDark) toggleDark(e); }} className={`theme-switch-btn ${isDark ? 'active-dark' : ''}`} aria-label="Dark Mode">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
          </button>
      </div>
    </>
  );
};

export default LandingNavbar;
