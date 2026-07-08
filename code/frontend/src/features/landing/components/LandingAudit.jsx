import React from 'react';

const LandingAudit = () => {
  return (
    <>
<section id="audit" className="tint-c" style={{"padding":"72px 56px","background":"var(--bg)"}}>
                                <div className="wrap">
                                    <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"64px","alignItems":"center"}}>
                                        <div style={{"position":"relative"}} className="sr">
                                            <div className="ttree">
                                                <div className="tttl">📍 Traceability Tree — REQ-003</div>
                                                <div className="ttr"><div className="tti tir"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div><div className="ttlbl">REQ-003 — Shopping Cart</div><div className="ttbdg tbfn">Functional</div></div>
                                                <div className="ttch">
                                                    <div className="ttr"><div className="tti tiu"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="5" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="8.5" y="16" width="7" height="5" rx="1"/><path d="M6.5 8v3h11V8M12 11v5"/></svg></div><div className="ttlbl">UC-005 — Add item to cart</div><div className="ttbdg tbok">Approved</div></div>
                                                    <div className="ttch">
                                                        <div className="ttr"><div className="tti tit"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div className="ttlbl">TASK-019 — Cart API</div><div className="ttbdg tbok">Done</div></div>
                                                        <div className="ttch">
                                                            <div className="ttr"><div className="tti tits"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6m-5 0v7l-5 8a1 1 0 0 0 .9 1.5h12.2A1 1 0 0 0 19 18l-5-8V3"/></svg></div><div className="ttlbl">TEST-022 — Cart test</div><div className="ttbdg tbok">Pass</div></div>
                                                            <div className="ttch"><div className="ttr"><div className="tti tie"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></div><div className="ttlbl">PR #11, screenshot.png</div><div className="ttbdg tbok">Valid</div></div></div>
                                                        </div>
                                                        <div className="ttr"><div className="tti tit" style={{"background":"rgba(245,158,11,.1)"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div className="ttlbl">TASK-023 — Cart UI</div><div className="ttbdg tbwip">In Prog</div></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{"position":"absolute","bottom":"-12px","right":"14px","background":"var(--g900)","color":"var(--bg)","borderRadius":"10px","padding":"9px 14px","fontSize":"11px","fontWeight":"700","display":"flex","alignItems":"center","gap":"7px","boxShadow":"0 8px 24px rgba(0,0,0,.2)"}} className="flt2"><span style={{"color":"var(--green)"}}>●</span> Audit snapshot ready</div>
                                        </div>
                                        <div className="sr">
                                            <div className="s-eye"><div className="s-el"></div></div>
                                            <div className="sb">🔒 Traceability & Audit</div>
                                            <h2 className="st">Prove your project<br /><span style={{"color":"var(--t)"}}>is real, not rushed</span></h2>
                                            <p style={{"fontSize":"15px","color":"var(--g500)","lineHeight":"1.7","marginBottom":"24px"}}>An unbroken chain from first requirement to final deliverable.</p>
                                            <div style={{"display":"flex","flexDirection":"column","gap":"16px"}}>
                                                <div style={{"display":"flex","alignItems":"flex-start","gap":"12px"}}><div style={{"width":"34px","height":"34px","borderRadius":"9px","background":"linear-gradient(135deg,var(--t),var(--td))","color":"#fff","fontSize":"13px","fontWeight":"800","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 4px 12px rgba(30,112,125,.3)"}}>1</div><div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"3px"}}>Every artifact linked</div><div style={{"fontSize":"13px","color":"var(--g500)","lineHeight":"1.5"}}>Req→UC→Task→Test→Evidence. No gaps.</div></div></div>
                                                <div style={{"display":"flex","alignItems":"flex-start","gap":"12px"}}><div style={{"width":"34px","height":"34px","borderRadius":"9px","background":"linear-gradient(135deg,var(--t),var(--td))","color":"#fff","fontSize":"13px","fontWeight":"800","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 4px 12px rgba(30,112,125,.3)"}}>2</div><div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"3px"}}>AI validates evidence</div><div style={{"fontSize":"13px","color":"var(--g500)","lineHeight":"1.5"}}>AI checks files, screenshots, and GitHub links are genuine.</div></div></div>
                                                <div style={{"display":"flex","alignItems":"flex-start","gap":"12px"}}><div style={{"width":"34px","height":"34px","borderRadius":"9px","background":"linear-gradient(135deg,var(--t),var(--td))","color":"#fff","fontSize":"13px","fontWeight":"800","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 4px 12px rgba(30,112,125,.3)"}}>3</div><div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"3px"}}>RTM snapshots on demand</div><div style={{"fontSize":"13px","color":"var(--g500)","lineHeight":"1.5"}}>Export full Requirements Traceability Matrix anytime for mentor review.</div></div></div>
                                                <div style={{"display":"flex","alignItems":"flex-start","gap":"12px"}}><div style={{"width":"34px","height":"34px","borderRadius":"9px","background":"linear-gradient(135deg,var(--t),var(--td))","color":"#fff","fontSize":"13px","fontWeight":"800","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 4px 12px rgba(30,112,125,.3)"}}>4</div><div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"3px"}}>GitHub is the story</div><div style={{"fontSize":"13px","color":"var(--g500)","lineHeight":"1.5"}}>Every PR linked to tasks. AI reviews code. Every commit verified.</div></div></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
    </>
  );
};

export default LandingAudit;

