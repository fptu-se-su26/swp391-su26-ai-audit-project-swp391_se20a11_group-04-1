import React from 'react';

const LandingWorkflow = () => {
  return (
    <>
<section id="workflow" className="tint-c" style={{"padding":"72px 56px","background":"var(--g50)"}}>
                    <div className="wrap">
                        <div style={{"textAlign":"center"}}>
                            <div className="s-eye sr" style={{"justifyContent":"center"}}><div className="s-el"></div></div>
                            <div className="sb sr" style={{"display":"inline-flex"}}>⚡ AI Workflow</div>
                            <h2 className="st sr" style={{"textAlign":"center"}}>Document → Audit-Ready<br /><span style={{"color":"var(--t)"}}>in one unified flow</span></h2>
                        </div>
                        <div className="wf-steps sr">
                            <div className="wfs"><div className="wfi w1"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div><div className="wfl">Upload<br />Document</div></div>
                            <div className="wfs"><div className="wfi w2"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><path d="M8 15h.01M16 15h.01M8 19h8"/></svg></div><div className="wfl">AI Extracts<br />Requirements</div></div>
                            <div className="wfs"><div className="wfi w3"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div><div className="wfl">Generate<br />Use Cases</div></div>
                            <div className="wfs"><div className="wfi w4"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div><div className="wfl">Create<br />Tasks</div></div>
                            <div className="wfs"><div className="wfi w5"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6m-5 0v7l-5 8a1 1 0 0 0 .9 1.5h12.2A1 1 0 0 0 19 18l-5-8V3"/></svg></div><div className="wfl">Run<br />Tests</div></div>
                            <div className="wfs"><div className="wfi w6"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div><div className="wfl">Code<br />Insight</div></div>
                            <div className="wfs"><div className="wfi w7"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div className="wfl" style={{"color":"var(--t)"}}>Audit<br />Ready</div></div>
                        </div>
                        <div style={{"display":"grid","gridTemplateColumns":"repeat(3,1fr)","gap":"18px","marginTop":"40px"}}>
                            <div style={{"background":"#fff","borderRadius":"16px","padding":"22px","border":"1.5px solid var(--g100)"}} className="sr"><div style={{"marginBottom":"12px"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--t)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><path d="M8 15h.01M16 15h.01M8 19h8"/></svg></div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"6px"}}>AI does the heavy lifting</div><div style={{"fontSize":"12px","color":"var(--g500)","lineHeight":"1.6"}}>Upload PDF/Word → AI generates quality-scored requirements instantly.</div></div>
                            <div style={{"background":"#fff","borderRadius":"16px","padding":"22px","border":"1.5px solid var(--g100)"}} className="sr"><div style={{"marginBottom":"12px"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--t)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"6px"}}>Every artifact linked</div><div style={{"fontSize":"12px","color":"var(--g500)","lineHeight":"1.6"}}>Req → Use Case → Task → Test → Evidence. RTM built automatically.</div></div>
                            <div style={{"background":"#fff","borderRadius":"16px","padding":"22px","border":"1.5px solid var(--g100)"}} className="sr"><div style={{"marginBottom":"12px"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--t)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"6px"}}>Mentors see everything</div><div style={{"fontSize":"12px","color":"var(--g500)","lineHeight":"1.6"}}>Progress, evidence, RTM, audit snapshots — all live, no chasing.</div></div>
                        </div>
                    </div>
                </section>
    </>
  );
};

export default LandingWorkflow;
