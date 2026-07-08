import React from 'react';

const LandingTestCase = () => {
  return (
    <>
        <section id="testcase" className="tint-b" style={{"padding":"72px 56px","background":"var(--g50)"}}>
            <div className="wrap">
                <div style={{"display":"grid","gridTemplateColumns":"1.35fr 1fr","gap":"72px","alignItems":"center"}}>
                    
                    <div style={{"position":"relative"}} className="sr">
                        {/* Cảnh báo float nổi lên hẳn phía trước */}
                        <div className="fcrd flt" style={{
                            position: "absolute",
                            top: "-20px", 
                            right: "-20px", 
                            zIndex: 50, 
                            padding: "12px 18px", 
                            background: "var(--t)", /* Màu xanh chủ đạo */
                            borderRadius: "14px",
                            boxShadow: "0 15px 30px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.2)",
                        }}>
                            <div style={{"fontSize":"11px","fontWeight":"800","color":"#ffffff","textTransform":"uppercase","letterSpacing":".5px","marginBottom":"6px","display":"flex","alignItems":"center","gap":"6px"}}>
                                <div style={{background:"rgba(255,255,255,0.2)", borderRadius:"50%", width:"18px",height:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>✓</div> 
                                44/48 Passing
                            </div>
                            <div style={{"height":"4px","background":"rgba(255,255,255,0.2)","borderRadius":"100px","overflow":"hidden","width":"130px"}}><div style={{"width":"92%","height":"100%","background":"#ffffff","borderRadius":"100px"}}></div></div>
                        </div>

                        <div className="tc3d" style={{ overflow: "visible", transformStyle: "preserve-3d", padding: 0 }}>
                            {/* Ảnh 1: Ảnh chính (Không cắt, để height: auto) */}
                            <img 
                                src="https://res.cloudinary.com/dufmichwn/image/upload/v1782990231/tc_aqiduj.jpg" 
                                alt="Test Case Management"
                                style={{ 
                                    width: "100%", 
                                    height: "auto", /* KHÔNG CẮT, giữ nguyên tỷ lệ gốc */
                                    borderRadius: "22px", 
                                    display: "block", 
                                    transform: "translateZ(20px)",
                                    position: "relative",
                                    zIndex: 1
                                }}
                            />

                            {/* Ảnh 2: Ảnh phụ đè lên góc */}
                            <img 
                                src="https://res.cloudinary.com/dufmichwn/image/upload/v1782990232/runtc_tmdznm.jpg" 
                                alt="Run Test Cases"
                                style={{ 
                                    position: "absolute", 
                                    bottom: "-45px", 
                                    right: "5px", 
                                    width: "48%", 
                                    height: "auto", 
                                    borderRadius: "16px", 
                                    transform: "translateZ(80px)", /* Bỏ xéo, để lại thẳng đứng */
                                    boxShadow: "0 30px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
                                    zIndex: 10
                                }}
                            />
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

