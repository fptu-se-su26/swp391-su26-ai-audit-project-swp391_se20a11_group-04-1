import React from 'react';
import { Link } from 'react-router-dom';

const LandingHero = () => {
  return (
    <>
<section className="hero" id="home">
    <div className="orb o1"></div>
    <div className="orb" style={{"width":"480px","height":"480px","background":"radial-gradient(circle,rgba(34,197,212,.05),transparent 65%)","top":"0","right":"-100px"}}></div>
    <div className="hero-dots" id="heroDots"></div>
    <div className="hero-amb"></div>

    <div className="hero-center">
        <div className="hbadge fu"><span className="bdot"></span>AI-Powered · Audit-Ready · For IT Students</div>
        <div className="hero-3d-title fu">
          {/* 3 lớp khói mờ phía sau chữ */}
          <div className="h3d-smoke h3d-smoke1"></div>
          <div className="h3d-smoke h3d-smoke2"></div>
          <div className="h3d-smoke h3d-smoke3"></div>

          {/* 1 vòng quỹ đạo nhẹ với vệ tinh sáng chạy quanh */}
          <div className="h3d-orbit"></div>
          {/* Vòng quỹ đạo thứ 2 chéo ngược */}
          <div className="h3d-orbit2"></div>

          {/* Bong bóng to & vừa */}
          <div className="h3d-bubble" style={{width:'50px',height:'50px',left:'-6%',top:'20%','--bdur':'9s','--bdel':'0s', opacity: 0.8}}></div>
          <div className="h3d-bubble" style={{width:'70px',height:'70px',right:'-8%',top:'55%','--bdur':'11s','--bdel':'1.2s', opacity: 0.6}}></div>
          <div className="h3d-bubble" style={{width:'40px',height:'40px',left:'10%',top:'110%','--bdur':'8.5s','--bdel':'2.5s', opacity: 0.7}}></div>
          <div className="h3d-bubble" style={{width:'45px',height:'45px',right:'15%',top:'105%','--bdur':'9.5s','--bdel':'0.8s', opacity: 0.7}}></div>

          {/* 10 bong bóng thủy tinh trôi nổi quanh tiêu đề, rải đủ 4 phía */}
          <div className="h3d-bubble" style={{width:'20px',height:'20px',left:'3%',top:'10%','--bdur':'6s','--bdel':'0s'}}></div>
          <div className="h3d-bubble" style={{width:'11px',height:'11px',left:'12%',top:'68%','--bdur':'7.5s','--bdel':'1.1s'}}></div>
          <div className="h3d-bubble" style={{width:'16px',height:'16px',right:'5%',top:'16%','--bdur':'6.8s','--bdel':'.6s'}}></div>
          <div className="h3d-bubble" style={{width:'10px',height:'10px',right:'13%',top:'72%','--bdur':'8s','--bdel':'1.8s'}}></div>
          <div className="h3d-bubble" style={{width:'8px',height:'8px',left:'-2%',top:'42%','--bdur':'5.5s','--bdel':'2.2s'}}></div>
          <div className="h3d-bubble" style={{width:'13px',height:'13px',left:'24%',top:'-5%','--bdur':'7s','--bdel':'1.5s'}}></div>
          <div className="h3d-bubble" style={{width:'9px',height:'9px',right:'-1%',top:'50%','--bdur':'6.2s','--bdel':'.9s'}}></div>
          <div className="h3d-bubble" style={{width:'14px',height:'14px',right:'24%',top:'-4%','--bdur':'7.8s','--bdel':'2.6s'}}></div>
          <div className="h3d-bubble" style={{width:'7px',height:'7px',left:'18%',top:'88%','--bdur':'5.8s','--bdel':'.4s'}}></div>
          <div className="h3d-bubble" style={{width:'12px',height:'12px',right:'18%',top:'90%','--bdur':'6.6s','--bdel':'1.9s'}}></div>

          {/* 3 đốm sáng cyan nhấp nháy */}
          <div className="h3d-speck" style={{left:'18%',top:'32%','--sdur':'2.6s','--sdel':'.2s'}}></div>
          <div className="h3d-speck" style={{right:'20%',top:'36%','--sdur':'2.3s','--sdel':'.9s'}}></div>
          <div className="h3d-speck" style={{left:'8%',top:'55%','--sdur':'2.8s','--sdel':'1.6s'}}></div>

          <div className="h3d-wrap">
            <span className="h3d-line1">Build Projects Like a</span>
            <span className="h3d-line2-wrap">
              <span className="h3d-line2">Real Engineering Team</span>
            </span>
          </div>
        </div>
        <p className="hsub fu">
          With DevTrack AI, experience real-world engineering.<br />
          Master professional workflows, teamwork, and data-backed evidence.
        </p>
        <div className="hctas fu" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Link to="/dashboard" className="bh1" style={{ boxShadow: '0 0 0 2px rgba(30,112,125,.3), 0 10px 32px rgba(30,112,125,.35)', padding: '16px 36px', fontSize: '16px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Get Started Free
            </Link>
        </div>

        <style>{`
            .htrust { position: relative; display: flex; align-items: center; justify-content: center; gap: 0; flex-wrap: wrap; margin: 8px auto 64px; padding: 11px 26px; max-width: fit-content; border-radius: 100px; background: rgba(255,255,255,.7); border: 1px solid rgba(30,112,125,.16); box-shadow: 0 6px 24px rgba(30,112,125,.08); backdrop-filter: blur(8px); }
            .htrust-line { position: absolute; inset: -1px; border-radius: 100px; background: linear-gradient(90deg,transparent,rgba(34,197,212,.5),transparent); background-size: 200% 100%; opacity: .5; filter: blur(6px); z-index: -1; animation: htrustFlow 3.5s linear infinite; }
            @keyframes htrustFlow { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
            .htrust-item { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: var(--g600); padding: 0 14px; white-space: nowrap; }
            .htrust-item svg { color: var(--t); flex-shrink: 0 }
            .htrust-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green, #22c55e); flex-shrink: 0; box-shadow: 0 0 0 0 rgba(34,197,94,.5); animation: htrustPulse 2s ease-in-out infinite; }
            @keyframes htrustPulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,.45) } 70% { box-shadow: 0 0 0 5px rgba(34,197,94,0) } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0) } }
            .htrust-sep { width: 1px; height: 16px; background: var(--g200); flex-shrink: 0 }
            @media (max-width: 760px) { .htrust { flex-direction: column; border-radius: 20px; gap: 8px; padding: 14px 20px } .htrust-sep { display: none } }
            
            .hpreview-cue { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; max-width: 640px; margin: 0 auto -40px; padding: 8px 24px 0; }
            .hpc-badge { position: relative; display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; letter-spacing: 1.4px; color: #1E707D; background: rgba(30,112,125,.08); border: 1px solid rgba(30,112,125,.22); border-radius: 100px; padding: 6px 16px 6px 14px; margin-bottom: 14px; }
            .hpc-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c5d4; flex-shrink: 0; position: relative; z-index: 1 }
            .hpc-radar { position: absolute; left: 14px; width: 6px; height: 6px; border-radius: 50%; background: #22c5d4; animation: hpcRadar 1.8s ease-out infinite; }
            @keyframes hpcRadar { 0% { box-shadow: 0 0 0 0 rgba(34,197,212,.55); transform: scale(1) } 100% { box-shadow: 0 0 0 11px rgba(34,197,212,0); transform: scale(1) } }
            .hpc-headline { font-size: clamp(20px,2.6vw,28px); font-weight: 800; letter-spacing: -.6px; line-height: 1.25; text-align: center; margin-bottom: 6px; background: linear-gradient(100deg,#0f1c1e 0%,#1E707D 55%,#22c5d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 4px 14px rgba(30,112,125,.18)); }
            .hpc-sub { font-size: 13.5px; color: #5b7f84; text-align: center; margin-bottom: 4px; }
            .hpc-connector { position: relative; display: flex; flex-direction: column; align-items: center; margin-top: 14px; height: 60px; }
            .hpc-track { width: 2px; height: 100%; background: linear-gradient(180deg, transparent, rgba(30,112,125,.15) 20%, rgba(30,112,125,.15) 80%, transparent); position: relative; overflow: hidden; border-radius: 2px; }
            .hpc-drop { position: absolute; top: -20px; left: 0; width: 2px; height: 20px; background: linear-gradient(180deg, transparent, #22c5d4); animation: hpcDrop 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
            @keyframes hpcDrop { 0% { top: -20px; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
            .hpc-arrow { position: absolute; bottom: -8px; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.7); backdrop-filter: blur(10px); border: 1px solid rgba(34, 197, 212, 0.4); color: #1E707D; box-shadow: 0 4px 16px rgba(34, 197, 212, 0.25), inset 0 0 8px rgba(255,255,255,1); animation: hpcArrowBounce 2s ease-in-out infinite; }
            .hpc-arrow svg { animation: hpcPulseIcon 2s ease-in-out infinite; }
            @keyframes hpcPulseIcon { 0%, 100% { opacity: 0.7; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); color: #22c5d4; } }
            @keyframes hpcArrowBounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(6px) } }
            .hpc-speck { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: #22c5d4; pointer-events: none; z-index: 0; animation: hpcSpeck var(--d) ease-in-out infinite var(--de); }
            @keyframes hpcSpeck { 0%,100% { opacity: 0; transform: scale(.5) translateY(0) } 50% { opacity: .85; transform: scale(1.2) translateY(-8px) } }
            @media (max-width: 760px) { .hpc-headline { font-size: 19px } .hpc-sub { font-size: 12.5px } }
        `}</style>
        
        {/* Trust Strip */}
        <div className="htrust">
          <div className="htrust-line"></div>
          <div className="htrust-item">
            <span className="htrust-dot"></span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
            For IT students
          </div>
          <div className="htrust-sep"></div>
          <div className="htrust-item">
            <span className="htrust-dot"></span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Set up in minutes
          </div>
          <div className="htrust-sep"></div>
          <div className="htrust-item">
            <span className="htrust-dot"></span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 5 2 7-6.5-4-6.5 4 2-7L2 9h7z"/></svg>
            Built for student teams
          </div>
        </div>

        {/* Live Preview Cue */}
        <div className="hpreview-cue">
          <div className="hpc-badge">
            <span className="hpc-radar"></span>
            <span className="hpc-dot"></span>
            LIVE PREVIEW
          </div>
          <h3 className="hpc-headline">Step inside your project dashboard</h3>
          <p className="hpc-sub">Real modules. Real data flow. This is DevTrack AI, running.</p>
          <div className="hpc-connector">
            <div className="hpc-track">
              <div className="hpc-drop"></div>
            </div>
            <span className="hpc-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
          <span className="hpc-speck" style={{ left: '6%', top: '10%', '--d': '2.6s', '--de': '.2s' }}></span>
          <span className="hpc-speck" style={{ right: '8%', top: '30%', '--d': '3.1s', '--de': '1s' }}></span>
          <span className="hpc-speck" style={{ left: '14%', top: '70%', '--d': '2.4s', '--de': '1.7s' }}></span>
          <span className="hpc-speck" style={{ right: '16%', top: '78%', '--d': '2.9s', '--de': '.6s' }}></span>
        </div>
    </div>

    {/*  3D MOCKUP  */}
    <div className="hmwrap" style={{"position":"relative"}}>
        {/*  floating cards  */}
        <div className="fcrd flt" style={{"bottom":"80px","right":"18px","display":"flex","alignItems":"flex-start","gap":"9px","maxWidth":"240px"}}>
            <div style={{"width":"30px","height":"30px","borderRadius":"7px","background":"linear-gradient(135deg,var(--t),var(--c))","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m1.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            </div>
            <div><div style={{"fontSize":"9px","fontWeight":"700","color":"var(--t)","textTransform":"uppercase","letterSpacing":".5px","marginBottom":"2px"}}>AI Insight</div><div style={{"fontSize":"11px","color":"var(--g700)","fontWeight":"500","lineHeight":"1.4"}}>Velocity 23% below target. Reassign 3 tasks now.</div></div>
        </div>
        <div className="fcrd flts" style={{"top":"70px","left":"18px","minWidth":"185px"}}>
            <div style={{"fontSize":"9px","fontWeight":"700","color":"var(--g700)","textTransform":"uppercase","letterSpacing":".5px","marginBottom":"8px","display":"flex","alignItems":"center","gap":"5px"}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Traceability
            </div>
            <div style={{"display":"flex","alignItems":"center","gap":"6px","fontSize":"10px","color":"var(--g600)","marginBottom":"4px"}}><div style={{"width":"5px","height":"5px","borderRadius":"50%","background":"var(--t)","flexShrink":"0"}}></div>REQ-001 User Login</div>
            <div style={{"width":"1px","height":"7px","background":"var(--g300)","marginLeft":"2px","marginBottom":"2px"}}></div>
            <div style={{"display":"flex","alignItems":"center","gap":"6px","fontSize":"10px","color":"var(--g600)","marginBottom":"4px","paddingLeft":"8px"}}><div style={{"width":"5px","height":"5px","borderRadius":"50%","background":"var(--indigo)","flexShrink":"0"}}></div>UC-002 Authenticate</div>
            <div style={{"width":"1px","height":"7px","background":"var(--g300)","marginLeft":"10px","marginBottom":"2px"}}></div>
            <div style={{"display":"flex","alignItems":"center","gap":"6px","fontSize":"10px","color":"var(--g600)","marginBottom":"4px","paddingLeft":"16px"}}><div style={{"width":"5px","height":"5px","borderRadius":"50%","background":"var(--green)","flexShrink":"0"}}></div>TASK-014 JWT ✓</div>
            <div style={{"width":"1px","height":"7px","background":"var(--g300)","marginLeft":"18px","marginBottom":"2px"}}></div>
            <div style={{"display":"flex","alignItems":"center","gap":"6px","fontSize":"10px","color":"var(--g600)","paddingLeft":"24px"}}><div style={{"width":"5px","height":"5px","borderRadius":"50%","background":"var(--amber)","flexShrink":"0"}}></div>TEST-007 Pass ✓</div>
        </div>
        <div className="fcrd" style={{"top":"70px","right":"18px","padding":"10px 14px"}}>
            <div style={{"fontSize":"9px","fontWeight":"700","color":"var(--green)","textTransform":"uppercase","letterSpacing":".5px","marginBottom":"5px"}}>Sprint Health</div>
            <div style={{"fontSize":"28px","fontWeight":"900","color":"var(--t)","letterSpacing":"-1px","lineHeight":"1"}}>87<span style={{"fontSize":"13px","color":"var(--g400)","fontWeight":"500"}}>/100</span></div>
            <div style={{"fontSize":"9px","color":"var(--green)","fontWeight":"600","marginTop":"2px"}}>↑ Excellent</div>
        </div>

        <div className="hmock" id="hmock">
            <div className="mbr"><div className="tls"><div className="tl tlr"></div><div className="tl tly"></div><div className="tl tlg"></div></div><div className="murl">app.devtrack.ai / e-commerce-platform / dashboard</div></div>
            <div className="mlay">
                <div className="msb">
                    <div className="mpj"><div className="mpji"></div><div className="mpjn">E-Commerce Platform</div></div>
                    <div className="mni a"><div className="mnd"></div>Dashboard</div>
                    <div className="mni"><div className="mnd"></div>Requirements</div>
                    <div className="mni"><div className="mnd"></div>Use Cases & UML</div>
                    <div className="mni"><div className="mnd"></div>Kanban Board</div>
                    <div className="mni"><div className="mnd"></div>My Tasks</div>
                    <div className="mni"><div className="mnd"></div>Test Cases</div>
                    <div className="mni"><div className="mnd"></div>Evidence & Audit</div>
                    <div className="mni"><div className="mnd"></div>Traceability Tree</div>
                    <div className="mni"><div className="mnd"></div>Code Insight</div>
                    <div className="mni"><div className="mnd"></div>GitHub Reviews</div>
                    <div className="mni"><div className="mnd"></div>Classroom</div>
                    <div style={{"marginTop":"14px","paddingTop":"12px","borderTop":"1px solid var(--g200)"}}>
                        <div style={{"fontSize":"9px","fontWeight":"700","color":"var(--g400)","textTransform":"uppercase","letterSpacing":".5px","marginBottom":"7px"}}>Sprint 3/6</div>
                        <div style={{"height":"4px","background":"var(--g200)","borderRadius":"100px","overflow":"hidden"}}><div style={{"width":"68%","height":"100%","background":"linear-gradient(90deg,var(--t),var(--c))","borderRadius":"100px"}}></div></div>
                        <div style={{"fontSize":"9px","color":"var(--g400)","marginTop":"4px"}}>8 days left</div>
                    </div>
                </div>
                <div className="mmc">
                    <div className="mmtop"><div className="mmttl">Dashboard — Sprint 3</div><div className="mmbdg">✦ AI Analysis Ready</div></div>
                    <div className="mmet">
                        <div className="mmcard"><div className="mmv" style={{"color":"var(--t)"}}>87</div><div className="mml">Health</div></div>
                        <div className="mmcard"><div className="mmv">24</div><div className="mml">Requirements</div></div>
                        <div className="mmcard"><div className="mmv">31/48</div><div className="mml">Tasks</div></div>
                        <div className="mmcard"><div className="mmv" style={{"color":"var(--green)"}}>92%</div><div className="mml">Tests</div></div>
                        <div className="mmcard"><div className="mmv" style={{"color":"var(--purple)"}}>78%</div><div className="mml">Evidence</div></div>
                    </div>
                    <div className="mkb">
                        <div className="mkc"><div className="mkh">To Do <span className="mkn">7</span></div>
                            <div className="mkt">Payment gateway<div><span className="mtag mtt">Backend</span></div></div>
                            <div className="mkt">Cart UI<div><span className="mtag mtp">Frontend</span></div></div>
                        </div>
                        <div className="mkc"><div className="mkh">In Progress <span className="mkn">5</span></div>
                            <div className="mkt" style={{"borderLeft":"2px solid var(--t)"}}>Auth JWT<div><span className="mtag mtt">Backend</span></div></div>
                            <div className="mkt" style={{"borderLeft":"2px solid var(--purple)"}}>Product listing<div><span className="mtag mtp">Frontend</span></div></div>
                        </div>
                        <div className="mkc"><div className="mkh">Review <span className="mkn">3</span></div>
                            <div className="mkt" style={{"borderLeft":"2px solid var(--amber)"}}>Register flow<div><span className="mtag mtg">PR #12 ✓</span></div></div>
                        </div>
                        <div className="mkc"><div className="mkh">Done <span className="mkn">16</span></div>
                            <div className="mkt" style={{"opacity":".6"}}>CI/CD setup<div><span className="mtag mtg">Done ✓</span></div></div>
                            <div className="mkt" style={{"opacity":".6"}}>UML approved<div><span className="mtag mtg">Done ✓</span></div></div>
                        </div>
                    </div>
                    <div className="mbot">
                        <div className="mbotc"><div className="mbott">✦ AI Insights</div><div style={{"fontSize":"9.5px","color":"var(--g600)","lineHeight":"1.6"}}>• Velocity 23% below<br />• 3 reqs missing tests<br />• 5 tasks no evidence</div></div>
                        <div className="mbotc" style={{"background":"rgba(34,197,94,.04)","borderColor":"rgba(34,197,94,.1)"}}><div className="mbott" style={{"color":"var(--green)"}}>Evidence</div><div style={{"display":"flex","alignItems":"center","gap":"6px","margin":"4px 0"}}><div style={{"flex":"1","height":"5px","background":"var(--g100)","borderRadius":"100px","overflow":"hidden"}}><div style={{"width":"78%","height":"100%","background":"linear-gradient(90deg,var(--green),#16a34a)","borderRadius":"100px"}}></div></div><div style={{"fontSize":"10px","fontWeight":"700","color":"var(--green)"}}>78%</div></div><div style={{"fontSize":"9px","color":"var(--g500)"}}>37/48 linked</div></div>
                        <div className="mbotc" style={{"background":"rgba(30,112,125,.04)","borderColor":"rgba(30,112,125,.1)"}}><div className="mbott">RTM Quick</div><div style={{"fontSize":"9.5px","color":"var(--g600)","lineHeight":"1.7"}}><span style={{"color":"var(--green)"}}>●</span> REQ-001 DONE<br /><span style={{"color":"var(--amber)"}}>●</span> REQ-003 WIP<br /><span style={{"color":"var(--red)"}}>●</span> REQ-007 MISS</div></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
    </>
  );
};

export default LandingHero;
