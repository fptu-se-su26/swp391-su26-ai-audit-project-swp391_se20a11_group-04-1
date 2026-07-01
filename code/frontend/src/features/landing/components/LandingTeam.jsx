import React from 'react';

const LandingTeam = () => {
  return (
    <>
      <section id="team" className="tint-a" style={{background:"var(--g50)",padding:"72px 0 0",overflow:"hidden"}}>
          <div style={{textAlign:"center",marginBottom:"36px",padding:"0 56px"}}>
              <div className="s-eye sr" style={{justifyContent:"center"}}><div className="s-el"></div></div>
              <div className="sb sr" style={{display:"inline-flex"}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Meet the Team
              </div>
              <h2 className="st sr" style={{textAlign:"center"}}>Built by students,<br /><span style={{color:"var(--t)"}}>for students</span></h2>
              <p style={{fontSize:"15px",color:"var(--g500)",textAlign:"center",margin:"8px auto 0",maxWidth:"420px"}} className="sr">We felt the pain of every broken project process — so we built the solution.</p>
          </div>

          {/*  SEAMLESS FULL-COVER INFINITE MARQUEE  */}
          <style>{`
              .marquee-container {
                  position: relative;
                  height: 520px;
                  overflow: hidden;
                  display: flex;
                  align-items: center;
                  background: transparent;
                  margin-top: 30px;
              }
              
              /* fog edges */
              .marquee-fade-l, .marquee-fade-r {
                  position: absolute;
                  top: 0; bottom: 0;
                  width: 140px;
                  z-index: 10;
                  pointer-events: none;
              }
              .marquee-fade-l { left: 0; background: linear-gradient(90deg, #f5fafb 0%, transparent 100%); }
              .marquee-fade-r { right: 0; background: linear-gradient(270deg, #f5fafb 0%, transparent 100%); }

              .marquee-track {
                  display: flex;
                  gap: 20px;
                  padding-left: 20px;
                  /* NEVER pauses on hover! */
                  animation: marqueeScroll 30s linear infinite;
                  will-change: transform;
                  width: max-content;
              }
              
              @keyframes marqueeScroll {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
              }

              /* Unified Tall Card */
              .tall-card {
                  flex: 0 0 320px;
                  height: 460px;
                  border-radius: 24px;
                  position: relative;
                  overflow: visible; /* to show glowing border */
                  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                  cursor: pointer;
                  transition: all 0.4s ease;
              }
              .tall-card:hover {
                  transform: translateY(-6px);
                  box-shadow: 0 20px 40px rgba(30,112,125,0.25);
              }
              
              /* Animated Glowing Border */
              .tall-card::before {
                  content: '';
                  position: absolute;
                  inset: -2px;
                  border-radius: 26px;
                  background: linear-gradient(45deg, transparent 30%, rgba(30,112,125,0.8) 50%, transparent 70%);
                  background-size: 200% 200%;
                  animation: borderFlow 4s linear infinite;
                  z-index: 0;
                  opacity: 0.5;
                  transition: opacity 0.3s;
              }
              .tall-card:hover::before { opacity: 1; animation-duration: 2s; }
              @keyframes borderFlow {
                  0% { background-position: 200% 0%; }
                  100% { background-position: -200% 0%; }
              }

              .tc-inner {
                  position: absolute;
                  inset: 0;
                  border-radius: 24px;
                  background: #0f172a;
                  overflow: hidden;
                  z-index: 1;
              }

              /* Animated Background layer */
              .tc-bg {
                  position: absolute;
                  inset: -20px; /* buffer for movement */
                  background-color: #0f172a;
                  background-image: 
                      radial-gradient(circle at 80% 20%, rgba(30,112,125,0.5), transparent 50%),
                      radial-gradient(circle at 20% 80%, rgba(99,102,241,0.4), transparent 50%),
                      url("data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0H0v30' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E");
                  z-index: 1;
                  animation: bgPan 15s ease-in-out infinite alternate;
                  transition: filter 0.4s;
              }
              .tall-card:hover .tc-bg { filter: brightness(1.3) contrast(1.1); }
              
              @keyframes bgPan {
                  0% { transform: scale(1) translate(0, 0); }
                  100% { transform: scale(1.15) translate(-10px, 10px); }
              }

              /* Dark overlay for text readability */
              .tc-overlay {
                  position: absolute;
                  inset: 0;
                  background: linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.4) 40%, rgba(15,23,42,0.95) 100%);
                  z-index: 2;
              }

              /* Content layer */
              .tc-content {
                  position: relative;
                  z-index: 5;
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  padding: 30px 24px;
              }

              /* Top Badge */
              .tc-bdg {
                  align-self: flex-end;
                  background: rgba(255,255,255,0.1);
                  border: 1px solid rgba(255,255,255,0.15);
                  backdrop-filter: blur(8px);
                  color: #fff;
                  padding: 6px 14px;
                  border-radius: 100px;
                  font-size: 10px;
                  font-weight: 800;
                  letter-spacing: 0.5px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
              }

              /* Avatar */
              .tc-av-area {
                  display: flex;
                  justify-content: center;
                  margin-top: -30px;
              }
              .fc-av-wrapper {
                  position: relative;
                  width: 100px; height: 100px;
                  display: flex; align-items: center; justify-content: center;
              }
              .fc-av-ring {
                  position: absolute;
                  inset: 0;
                  border-radius: 50%;
                  padding: 2.5px; 
                  background: linear-gradient(135deg, var(--t), var(--purple), var(--c));
                  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                  -webkit-mask-composite: xor;
                  mask-composite: exclude;
                  animation: spinRing 5s linear infinite;
                  opacity: 0.7;
                  transition: all 0.3s ease;
              }
              .tall-card:hover .fc-av-ring {
                  animation-duration: 2s;
                  opacity: 1;
                  box-shadow: 0 0 25px rgba(30,112,125,0.7);
              }
              .fc-av { 
                  width: 86px; height: 86px; 
                  border-radius: 50%; 
                  background: linear-gradient(135deg, #1e293b, #0f172a);
                  display: flex; align-items: center; justify-content: center; 
                  font-size: 28px; font-weight: 900; color: #fff; 
                  border: 2px solid rgba(255,255,255,0.1); 
                  box-shadow: inset 0 2px 10px rgba(255,255,255,0.1), 0 8px 16px rgba(0,0,0,0.4);
                  transition: transform 0.3s ease;
              }
              .tall-card:hover .fc-av { transform: scale(1.08); }

              /* Text Info */
              .tc-info { text-align: center; }
              .tc-name { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 6px; letter-spacing: -0.3px; }
              .tc-role { font-size: 13.5px; color: var(--t); font-weight: 700; margin-bottom: 20px; }
              
              /* Skills */
              .tc-skills { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
              .tc-sk { 
                  display: inline-block; padding: 6px 14px; border-radius: 100px; 
                  font-size: 11px; font-weight: 700; 
                  background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); 
                  border: 1px solid rgba(255,255,255,0.1);
                  transition: all 0.3s ease;
              }
              .tall-card:hover .tc-sk {
                  border-color: rgba(30,112,125,0.5);
                  color: #fff;
                  background: rgba(30,112,125,0.25);
                  box-shadow: 0 0 15px rgba(30,112,125,0.2);
              }
          `}</style>

          <div className="marquee-container" id="teamStage">
              <div className="marquee-fade-l"></div>
              <div className="marquee-fade-r"></div>
              <div className="marquee-track">
                  {/* Render 2 identical sets of cards for a seamless infinite loop */}
                  {[...Array(2)].map((_, trackIndex) => (
                      <React.Fragment key={trackIndex}>
                          {/*  Card 0: KH  */}
                          <div className="tall-card">
                              <div className="tc-inner">
                                  <div className="tc-bg"></div>
                                  <div className="tc-overlay"></div>
                                  <div className="tc-content">
                                      <div className="tc-bdg">LEADER</div>
                                      <div className="tc-av-area">
                                          <div className="fc-av-wrapper">
                                              <div className="fc-av-ring"></div>
                                              <div className="fc-av">KH</div>
                                          </div>
                                      </div>
                                      <div className="tc-info">
                                          <div className="tc-name">Khanh Hoang</div>
                                          <div className="tc-role">Project Lead & Fullstack Dev</div>
                                          <div className="tc-skills"><span className="tc-sk">React</span><span className="tc-sk">Node.js</span><span className="tc-sk">Lead</span></div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          {/*  Card 1: NT  */}
                          <div className="tall-card">
                              <div className="tc-inner">
                                  <div className="tc-bg" style={{backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(99,102,241,0.5), transparent 50%), radial-gradient(circle at 20% 80%, rgba(139,92,246,0.4), transparent 50%), url("data:image/svg+xml,%3Csvg width=\\\'30\\\' height=\\\'30\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cpath d=\\\'M30 0H0v30\\\' fill=\\\'none\\\' stroke=\\\'rgba(255,255,255,0.03)\\\' stroke-width=\\\'1\\\'/%3E%3C/svg%3E")'}}></div>
                                  <div className="tc-overlay"></div>
                                  <div className="tc-content">
                                      <div className="tc-bdg">AI ENG</div>
                                      <div className="tc-av-area">
                                          <div className="fc-av-wrapper">
                                              <div className="fc-av-ring" style={{background: 'linear-gradient(135deg, var(--purple), var(--indigo))'}}></div>
                                              <div className="fc-av">NT</div>
                                          </div>
                                      </div>
                                      <div className="tc-info">
                                          <div className="tc-name">Nam Tran</div>
                                          <div className="tc-role">AI Engineer</div>
                                          <div className="tc-skills"><span className="tc-sk">Gemini</span><span className="tc-sk">Python</span><span className="tc-sk">LLM</span></div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          {/*  Card 2: TL  */}
                          <div className="tall-card">
                              <div className="tc-inner">
                                  <div className="tc-bg" style={{backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(34,197,94,0.4), transparent 50%), radial-gradient(circle at 20% 80%, rgba(16,185,129,0.3), transparent 50%), url("data:image/svg+xml,%3Csvg width=\\\'30\\\' height=\\\'30\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cpath d=\\\'M30 0H0v30\\\' fill=\\\'none\\\' stroke=\\\'rgba(255,255,255,0.03)\\\' stroke-width=\\\'1\\\'/%3E%3C/svg%3E")'}}></div>
                                  <div className="tc-overlay"></div>
                                  <div className="tc-content">
                                      <div className="tc-bdg">BACKEND</div>
                                      <div className="tc-av-area">
                                          <div className="fc-av-wrapper">
                                              <div className="fc-av-ring" style={{background: 'linear-gradient(135deg, var(--green), #16a34a)'}}></div>
                                              <div className="fc-av">TL</div>
                                          </div>
                                      </div>
                                      <div className="tc-info">
                                          <div className="tc-name">Thien Le</div>
                                          <div className="tc-role">Backend Engineer</div>
                                          <div className="tc-skills"><span className="tc-sk">Spring</span><span className="tc-sk">MySQL</span><span className="tc-sk">DevOps</span></div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          {/*  Card 3: MN  */}
                          <div className="tall-card">
                              <div className="tc-inner">
                                  <div className="tc-bg" style={{backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(245,158,11,0.4), transparent 50%), radial-gradient(circle at 20% 80%, rgba(217,119,6,0.3), transparent 50%), url("data:image/svg+xml,%3Csvg width=\\\'30\\\' height=\\\'30\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cpath d=\\\'M30 0H0v30\\\' fill=\\\'none\\\' stroke=\\\'rgba(255,255,255,0.03)\\\' stroke-width=\\\'1\\\'/%3E%3C/svg%3E")'}}></div>
                                  <div className="tc-overlay"></div>
                                  <div className="tc-content">
                                      <div className="tc-bdg">UI/UX</div>
                                      <div className="tc-av-area">
                                          <div className="fc-av-wrapper">
                                              <div className="fc-av-ring" style={{background: 'linear-gradient(135deg, var(--amber), #d97706)'}}></div>
                                              <div className="fc-av">MN</div>
                                          </div>
                                      </div>
                                      <div className="tc-info">
                                          <div className="tc-name">Minh Nguyen</div>
                                          <div className="tc-role">UI/UX Designer</div>
                                          <div className="tc-skills"><span className="tc-sk">Figma</span><span className="tc-sk">Design</span><span className="tc-sk">FE</span></div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          {/*  Card 4: LP  */}
                          <div className="tall-card">
                              <div className="tc-inner">
                                  <div className="tc-bg" style={{backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(239,68,68,0.4), transparent 50%), radial-gradient(circle at 20% 80%, rgba(220,38,38,0.3), transparent 50%), url("data:image/svg+xml,%3Csvg width=\\\'30\\\' height=\\\'30\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cpath d=\\\'M30 0H0v30\\\' fill=\\\'none\\\' stroke=\\\'rgba(255,255,255,0.03)\\\' stroke-width=\\\'1\\\'/%3E%3C/svg%3E")'}}></div>
                                  <div className="tc-overlay"></div>
                                  <div className="tc-content">
                                      <div className="tc-bdg">QA</div>
                                      <div className="tc-av-area">
                                          <div className="fc-av-wrapper">
                                              <div className="fc-av-ring" style={{background: 'linear-gradient(135deg, var(--red), #dc2626)'}}></div>
                                              <div className="fc-av">LP</div>
                                          </div>
                                      </div>
                                      <div className="tc-info">
                                          <div className="tc-name">Lan Pham</div>
                                          <div className="tc-role">QA & Testing Lead</div>
                                          <div className="tc-skills"><span className="tc-sk">Selenium</span><span className="tc-sk">Jest</span><span className="tc-sk">QA</span></div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </React.Fragment>
                  ))}
              </div>
          </div>
      </section>
    </>
  );
};

export default LandingTeam;
