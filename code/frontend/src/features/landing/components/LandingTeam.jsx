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

          {/*  3D FAN CAROUSEL  */}
          <style>{`
              .fan-stage{
              position:relative;height:540px;overflow:hidden;
              perspective: 1200px;
              /* teal fog top and bottom */
              mask-image:linear-gradient(180deg,
              rgba(30,112,125,.15) 0%,
              transparent 12%,
              black 20%,
              black 80%,
              transparent 92%,
              rgba(30,112,125,.12) 100%
              );
              -webkit-mask-image:linear-gradient(180deg,
              rgba(30,112,125,.15) 0%,
              transparent 12%,
              black 20%,
              black 80%,
              transparent 92%,
              rgba(30,112,125,.12) 100%
              );
          }
              /* teal overlay top/bottom */
              .fan-stage::before{
              content:'';position:absolute;top:0;left:0;right:0;height:80px;
              background:linear-gradient(180deg,rgba(30,112,125,.14) 0%,transparent 100%);
              z-index:20;pointer-events:none;
          }
              .fan-stage::after{
              content:'';position:absolute;bottom:0;left:0;right:0;height:80px;
              background:linear-gradient(0deg,rgba(30,112,125,.12) 0%,transparent 100%);
              z-index:20;pointer-events:none;
          }
              /* fade left right */
              .fan-fade-l,.fan-fade-r{position:absolute;top:0;bottom:0;width:220px;z-index:15;pointer-events:none}
              .fan-fade-l{left:0;background:linear-gradient(90deg,rgba(245,250,251,.95) 0%,transparent 100%)}
              .fan-fade-r{right:0;background:linear-gradient(270deg,rgba(245,250,251,.95) 0%,transparent 100%)}

              .fan-inner{
              position:absolute;inset:0;
              display:flex;align-items:center;justify-content:center;
              transform-style:preserve-3d;
          }
              @keyframes fanFlow {
              0% { transform: translateX(580px) translateZ(-120px) rotateY(-35deg) scale(.82); opacity: .55; filter: saturate(.5); box-shadow: 0 6px 20px rgba(0,0,0,.08); border: 1.5px solid var(--g200); }
              20% { transform: translateX(320px) translateZ(0px) rotateY(-20deg) scale(.93); opacity: .85; filter: saturate(.8); box-shadow: 0 10px 32px rgba(0,0,0,.1); border: 1.5px solid var(--g200); }
              40% { transform: translateX(0) translateZ(80px) rotateY(0deg) scale(1.05); opacity: 1; filter: saturate(1); box-shadow: 0 24px 64px rgba(0,0,0,.16), 0 0 0 2px rgba(30,112,125,.4); border: 1.5px solid rgba(30,112,125,.35); }
              60% { transform: translateX(-320px) translateZ(0px) rotateY(20deg) scale(.93); opacity: .85; filter: saturate(.8); box-shadow: 0 10px 32px rgba(0,0,0,.1); border: 1.5px solid var(--g200); }
              80% { transform: translateX(-580px) translateZ(-120px) rotateY(35deg) scale(.82); opacity: .55; filter: saturate(.5); box-shadow: 0 6px 20px rgba(0,0,0,.08); border: 1.5px solid var(--g200); }
              85% { transform: translateX(-580px) translateZ(-300px) rotateY(0deg) scale(.5); opacity: 0; filter: saturate(.5); border: 1.5px solid var(--g200); }
              95% { transform: translateX(580px) translateZ(-300px) rotateY(0deg) scale(.5); opacity: 0; filter: saturate(.5); border: 1.5px solid var(--g200); }
              100% { transform: translateX(580px) translateZ(-120px) rotateY(-35deg) scale(.82); opacity: .55; filter: saturate(.5); box-shadow: 0 6px 20px rgba(0,0,0,.08); border: 1.5px solid var(--g200); }
          }
              .fan-card{
              position:absolute;
              width:290px;
              background:#fff;
              border-radius:24px;
              overflow:hidden;
              cursor:pointer;
              animation: fanFlow 25s linear infinite;
              transform-origin:center bottom;
          }
              .fan-card[data-fi="0"] { animation-delay: -10s; }
              .fan-card[data-fi="1"] { animation-delay: -5s; }
              .fan-card[data-fi="2"] { animation-delay: -0s; }
              .fan-card[data-fi="3"] { animation-delay: -20s; }
              .fan-card[data-fi="4"] { animation-delay: -15s; }
              /* photo area — taller now, info box below shortened */
              .fc-photo{
              width:100%;height:268px;
              position:relative;overflow:hidden;
              display:flex;align-items:center;justify-content:center;
          }
              .fc-ph{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
              .fc-av{
              width:86px;height:86px;border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              font-size:28px;font-weight:900;color:#fff;
              border:4px solid rgba(255,255,255,.6);
              box-shadow:0 6px 24px rgba(0,0,0,.2);
          }
              .fc-hint{font-size:11px;color:rgba(255,255,255,.7);font-weight:600;letter-spacing:.3px}
              .fc-photo::before{content:'';position:absolute;inset:12px;border:1.5px dashed rgba(255,255,255,.3);border-radius:12px;pointer-events:none;z-index:1}
              .fc-photo::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.18) 100%);pointer-events:none}
              .fc-bdg{
              position:absolute;top:14px;right:14px;
              color:#fff;border-radius:100px;
              padding:4px 12px;font-size:10px;font-weight:800;z-index:5;
              letter-spacing:.5px;
              backdrop-filter:blur(8px);
              box-shadow:0 2px 8px rgba(0,0,0,.2);
          }
              .fc-shimmer{position:absolute;inset:0;background:linear-gradient(135deg,transparent 35%,rgba(255,255,255,.25) 50%,transparent 65%);transform:translateX(-100%);transition:transform .7s ease;z-index:3}
              .fan-card:hover .fc-shimmer{animation:shimmer-once .8s ease forwards}
              @keyframes shimmer-once{to{transform:translateX(100%)}}
              .fc-info{padding:10px 18px 14px}
              .fc-name{font-size:14px;font-weight:800;color:var(--g900);margin-bottom:2px;letter-spacing:-.3px}
              .fc-role{font-size:11px;color:var(--t);font-weight:700;margin-bottom:7px}
              .fc-skills{display:flex;flex-wrap:wrap;gap:5px}
              .fc-sk{display:inline-block;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;background:var(--g50);color:var(--g600);border:1px solid var(--g200)}
              /* nav */
              .fan-nav{display:flex;justify-content:center;align-items:center;gap:16px;padding:20px 0 32px}
              .fan-btn{width:42px;height:42px;border-radius:50%;background:#fff;border:1.5px solid var(--g200);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:17px;box-shadow:0 3px 12px rgba(0,0,0,.07);transition:all .2s;color:var(--g700)}
              .fan-btn:hover{background:var(--t);border-color:var(--t);color:#fff;transform:scale(1.1)}
              .fan-dot{width:7px;height:7px;border-radius:50%;background:var(--g300);cursor:pointer;transition:all .3s}
              .fan-dot.a{background:var(--t);width:22px;border-radius:100px}
          `}</style>

          <div className="fan-stage" id="teamStage">
              <div className="fan-fade-l"></div>
              <div className="fan-fade-r"></div>
              <div className="fan-inner" id="fanInner">
                  {/*  Card 0: KH  */}
                  <div className="fan-card" data-fi="0">
                      <div className="fc-photo" style={{background:"linear-gradient(135deg,#b2dfe5,#7cc5cf)"}}>
                          <div className="fc-ph"><div className="fc-av" style={{background:"linear-gradient(135deg,var(--t),var(--c))"}}>KH</div><div className="fc-hint">Add photo here</div></div>
                          <div className="fc-bdg" style={{background:"rgba(30,112,125,.75)"}}>LEADER</div>
                          <div className="fc-shimmer"></div>
                      </div>
                      <div className="fc-info">
                          <div className="fc-name">Khanh Hoang</div>
                          <div className="fc-role">Project Lead & Fullstack Dev</div>
                          <div className="fc-skills"><span className="fc-sk">React</span><span className="fc-sk">Node.js</span><span className="fc-sk">Lead</span></div>
                      </div>
                  </div>
                  {/*  Card 1: NT  */}
                  <div className="fan-card" data-fi="1">
                      <div className="fc-photo" style={{background:"linear-gradient(135deg,#c9c0f0,#a095e8)"}}>
                          <div className="fc-ph"><div className="fc-av" style={{background:"linear-gradient(135deg,var(--purple),var(--indigo))"}}>NT</div><div className="fc-hint">Add photo here</div></div>
                          <div className="fc-bdg" style={{background:"rgba(99,102,241,.8)"}}>AI ENG</div>
                          <div className="fc-shimmer"></div>
                      </div>
                      <div className="fc-info">
                          <div className="fc-name">Nam Tran</div>
                          <div className="fc-role">AI Engineer</div>
                          <div className="fc-skills"><span className="fc-sk">Gemini</span><span className="fc-sk">Python</span><span className="fc-sk">LLM</span></div>
                      </div>
                  </div>
                  {/*  Card 2: TL  */}
                  <div className="fan-card" data-fi="2">
                      <div className="fc-photo" style={{background:"linear-gradient(135deg,#a8e6c1,#6dd4a0)"}}>
                          <div className="fc-ph"><div className="fc-av" style={{background:"linear-gradient(135deg,var(--green),#16a34a)"}}>TL</div><div className="fc-hint">Add photo here</div></div>
                          <div className="fc-bdg" style={{background:"rgba(34,197,94,.8)"}}>BACKEND</div>
                          <div className="fc-shimmer"></div>
                      </div>
                      <div className="fc-info">
                          <div className="fc-name">Thien Le</div>
                          <div className="fc-role">Backend Engineer</div>
                          <div className="fc-skills"><span className="fc-sk">Spring</span><span className="fc-sk">MySQL</span><span className="fc-sk">DevOps</span></div>
                      </div>
                  </div>
                  {/*  Card 3: MN  */}
                  <div className="fan-card" data-fi="3">
                      <div className="fc-photo" style={{background:"linear-gradient(135deg,#fde68a,#fbbf24)"}}>
                          <div className="fc-ph"><div className="fc-av" style={{background:"linear-gradient(135deg,var(--amber),#d97706)"}}>MN</div><div className="fc-hint">Add photo here</div></div>
                          <div className="fc-bdg" style={{background:"rgba(245,158,11,.85)"}}>UI/UX</div>
                          <div className="fc-shimmer"></div>
                      </div>
                      <div className="fc-info">
                          <div className="fc-name">Minh Nguyen</div>
                          <div className="fc-role">UI/UX Designer</div>
                          <div className="fc-skills"><span className="fc-sk">Figma</span><span className="fc-sk">Design</span><span className="fc-sk">FE</span></div>
                      </div>
                  </div>
                  {/*  Card 4: LP  */}
                  <div className="fan-card" data-fi="4">
                      <div className="fc-photo" style={{background:"linear-gradient(135deg,#fca5a5,#f87171)"}}>
                          <div className="fc-ph"><div className="fc-av" style={{background:"linear-gradient(135deg,var(--red),#dc2626)"}}>LP</div><div className="fc-hint">Add photo here</div></div>
                          <div className="fc-bdg" style={{background:"rgba(239,68,68,.8)"}}>QA</div>
                          <div className="fc-shimmer"></div>
                      </div>
                      <div className="fc-info">
                          <div className="fc-name">Lan Pham</div>
                          <div className="fc-role">QA & Testing Lead</div>
                          <div className="fc-skills"><span className="fc-sk">Selenium</span><span className="fc-sk">Jest</span><span className="fc-sk">QA</span></div>
                      </div>
                  </div>
              </div>
          </div>
      </section>
    </>
  );
};

export default LandingTeam;
