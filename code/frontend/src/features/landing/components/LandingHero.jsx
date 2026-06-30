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
            <div className="h3d-smoke h3d-smoke1"></div>
            <div className="h3d-smoke h3d-smoke2"></div>
            <div className="h3d-smoke h3d-smoke3"></div>
            <div className="h3d-wrap">
                <span className="h3d-line1">Build Projects Like a</span>
                <span className="h3d-line2-wrap">
      <span className="h3d-line2">Real Engineering Team</span>
    </span>
            </div>
        </div>
        <p className="hsub fu">From project documents to full audit trail — AI handles requirements, use cases, tasks, tests, and evidence automatically.</p>
        <div className="hctas fu">
            <Link to="/dashboard" className="bh1">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Get Started Free
            </Link>
            <a href="#" className="bh2">▷ View Demo</a>
            <a href="#" className="bh2">Try AI Generator →</a>
        </div>
        <div className="hstats fu">
            <div style={{"display":"flex","flexDirection":"column","alignItems":"center"}}><div className="hstat-v" data-count="500" data-suffix="+">500+</div><div className="hstat-l">Students</div></div>
            <div style={{"display":"flex","flexDirection":"column","alignItems":"center"}}><div className="hstat-v" data-count="10" data-suffix="">10</div><div className="hstat-l">AI Modules</div></div>
            <div style={{"display":"flex","flexDirection":"column","alignItems":"center"}}><div className="hstat-v" data-count="100" data-suffix="%">100%</div><div className="hstat-l">Traceability</div></div>
            <div style={{"display":"flex","flexDirection":"column","alignItems":"center"}}><div className="hstat-v" style={{"fontSize":"20px","letterSpacing":"-.5px"}}>Gemini</div><div className="hstat-l">AI Engine</div></div>
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
