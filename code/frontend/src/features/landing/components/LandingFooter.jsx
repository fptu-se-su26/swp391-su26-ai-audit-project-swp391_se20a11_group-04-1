import React from 'react';

const LandingFooter = () => {
  return (
    <>
      <footer className="landing-footer">
        <a href="#" className="fl">
            <div className="lmark"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
            DevTrack AI
        </a>
        <div className="flinks">
            <a href="#">Features</a>
            <a href="#">Classroom</a>
            <a href="#">Code Insight</a>
            <a href="#">Docs</a>
            <a href="#">GitHub</a>
        </div>
        <div className="fcp">© 2025 DevTrack AI · Built for the next generation of engineers</div>
      </footer>
    </>
  );
};

export default LandingFooter;
