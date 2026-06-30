import React from 'react';

const LandingTestCase = () => {
  return (
    <>
<section id="testcase" className="tint-b" style={{"padding":"72px 56px","background":"var(--g50)"}}>
            <div className="wrap">
                <div style={{"display":"grid","gridTemplateColumns":"1.1fr 1fr","gap":"64px","alignItems":"center"}}>
                    <div style={{"position":"relative"}} className="sr">
                        <div className="fcrd flt" style={{"top":"-18px","right":"-18px","zIndex":"20","padding":"9px 13px"}}>
                            <div style={{"fontSize":"9px","fontWeight":"700","color":"var(--green)","textTransform":"uppercase","letterSpacing":".5px","marginBottom":"3px"}}>✓ 44/48 Passing</div>
                            <div style={{"height":"4px","background":"var(--g100)","borderRadius":"100px","overflow":"hidden","width":"120px"}}><div style={{"width":"92%","height":"100%","background":"linear-gradient(90deg,var(--green),#16a34a)","borderRadius":"100px"}}></div></div>
                        </div>
                        <div className="tc3d">
                            <div className="tc-top"><div><div className="tc-ttl">Test Case Execution</div><div className="tc-meta">Sprint 3 · REQ-001 → REQ-012</div></div><div style={{"display":"flex","gap":"6px"}}><div style={{"padding":"4px 10px","borderRadius":"6px","background":"rgba(34,197,94,.15)","color":"var(--green)","fontSize":"10px","fontWeight":"700","cursor":"pointer"}}>Run All</div><div style={{"padding":"4px 10px","borderRadius":"6px","background":"rgba(255,255,255,.08)","color":"rgba(255,255,255,.6)","fontSize":"10px","fontWeight":"700","cursor":"pointer"}}>Export</div></div></div>
                            <div className="tc-body">
                                <div className="tcthead"><div className="tcth">Test Case</div><div className="tcth">Req</div><div className="tcth">Steps</div><div className="tcth">Status</div></div>
                                <div className="tcrow"><div className="tc-name">TC-001 Login valid</div><div className="tc-req">REQ-001</div><div className="tc-stp">5 steps</div><div><span className="tcst st-pass">✓ Pass</span></div></div>
                                <div className="tcrow"><div className="tc-name">TC-002 Invalid creds</div><div className="tc-req">REQ-001</div><div className="tc-stp">3 steps</div><div><span className="tcst st-pass">✓ Pass</span></div></div>
                                <div className="tcrow"><div className="tc-name">TC-005 Register flow</div><div className="tc-req">REQ-002</div><div className="tc-stp">7 steps</div><div><span className="tcst st-run">⟳ Running</span></div></div>
                                <div className="tcrow"><div className="tc-name">TC-009 Add to cart</div><div className="tc-req">REQ-003</div><div className="tc-stp">4 steps</div><div><span className="tcst st-blk">⚠ Blocked</span></div></div>
                                <div className="tcrow"><div className="tc-name">TC-014 Payment</div><div className="tc-req">REQ-007</div><div className="tc-stp">6 steps</div><div><span className="tcst st-fail">✗ Fail</span></div></div>
                                <div className="tcrow"><div className="tc-name">TC-018 Search</div><div className="tc-req">REQ-009</div><div className="tc-stp">3 steps</div><div><span className="tcst st-pass">✓ Pass</span></div></div>
                                <div className="tc-prog"><div style={{"display":"flex","justifyContent":"space-between","fontSize":"10px","fontWeight":"700","color":"var(--g700)"}}><span>Overall Progress</span><span style={{"color":"var(--green)"}}>44/48 passed</span></div><div className="tc-pbar"><div className="tc-pfill"></div></div><div style={{"display":"flex","gap":"14px"}}><span style={{"fontSize":"10px","fontWeight":"600","color":"var(--green)"}}>● 44 Pass</span><span style={{"fontSize":"10px","fontWeight":"600","color":"var(--red)"}}>● 2 Fail</span><span style={{"fontSize":"10px","fontWeight":"600","color":"var(--amber)"}}>● 1 Blocked</span></div></div>
                                <div className="tc-term"><div className="tl-dim">$ npm run test:e2e --sprint=3</div><div className="tl-ok">✓ TC-001 User Login valid (234ms)</div><div className="tl-ok">✓ TC-002 Invalid credentials (189ms)</div><div className="tl-run">⟳ TC-005 Register flow... running</div><div className="tl-fail">✗ TC-014 Payment gateway - assertion failed</div><div className="tl-dim">Expected: 200, Received: 502</div></div>
                            </div>
                        </div>
                    </div>
                    <div className="sr">
                        <div className="s-eye"><div className="s-el"></div></div>
                        <div className="sb">Test Case Management</div>
                        <h2 className="st">Quality gates at<br /><span style={{"color":"var(--t)"}}>every step</span></h2>
                        <p style={{"fontSize":"15px","color":"var(--g500)","lineHeight":"1.7","marginBottom":"28px"}}>Test cases linked directly to requirements. Run, track, and audit every test with full traceability.</p>
                        <div style={{"display":"flex","flexDirection":"column","gap":"16px"}}>
                            <div style={{"display":"flex","alignItems":"flex-start","gap":"12px"}}><div style={{"width":"34px","height":"34px","borderRadius":"9px","background":"linear-gradient(135deg,var(--t),var(--td))","color":"#fff","fontSize":"13px","fontWeight":"800","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 4px 12px rgba(30,112,125,.3)"}}>1</div><div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"3px"}}>Linked to requirements</div><div style={{"fontSize":"13px","color":"var(--g500)","lineHeight":"1.5"}}>Every test traces back to a requirement. Nothing untested, nothing untracked.</div></div></div>
                            <div style={{"display":"flex","alignItems":"flex-start","gap":"12px"}}><div style={{"width":"34px","height":"34px","borderRadius":"9px","background":"linear-gradient(135deg,var(--t),var(--td))","color":"#fff","fontSize":"13px","fontWeight":"800","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 4px 12px rgba(30,112,125,.3)"}}>2</div><div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"3px"}}>Step-by-step execution</div><div style={{"fontSize":"13px","color":"var(--g500)","lineHeight":"1.5"}}>Pass / Fail / Blocked with steps. Bug reports auto-generated on failure.</div></div></div>
                            <div style={{"display":"flex","alignItems":"flex-start","gap":"12px"}}><div style={{"width":"34px","height":"34px","borderRadius":"9px","background":"linear-gradient(135deg,var(--t),var(--td))","color":"#fff","fontSize":"13px","fontWeight":"800","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 4px 12px rgba(30,112,125,.3)"}}>3</div><div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"3px"}}>Coverage always visible</div><div style={{"fontSize":"13px","color":"var(--g500)","lineHeight":"1.5"}}>AI shows exactly which requirements have no test coverage. Never miss a gap.</div></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
  );
};

export default LandingTestCase;
