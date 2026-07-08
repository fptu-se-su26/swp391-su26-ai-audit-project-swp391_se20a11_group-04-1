import React from 'react';

const LandingCodeInsight = () => {
  return (
    <>
      <section id="codeinsight" className="tint-a" style={{"padding":"72px 56px","background":"var(--bg)"}}>
          <div className="wrap">
              <div style={{"display":"grid","gridTemplateColumns":"1fr 1.1fr","gap":"64px","alignItems":"center"}}>
                  <div className="sr">
                      <div className="s-eye"><div className="s-el"></div></div>
                      <div className="sb">⚡ Code Insight</div>
                      <h2 className="st">Quality Assurance<br /><span style={{"color":"var(--t)"}}>Hub for Leaders</span></h2>
                      <p style={{"fontSize":"15px","color":"var(--g500)","lineHeight":"1.7","marginBottom":"8px"}}>Làm đúng tiến độ là chưa đủ —</p>
                      <p style={{"fontSize":"16px","fontWeight":"700","color":"var(--t)","marginBottom":"28px","fontStyle":"italic"}}>"Code Insight đảm bảo dự án của bạn hoàn hảo đến từng dòng code."</p>
                      <div style={{"display":"flex","flexDirection":"column","gap":"14px"}}>
                          <div style={{"display":"flex","alignItems":"flex-start","gap":"12px"}}><div style={{"width":"34px","height":"34px","borderRadius":"9px","background":"linear-gradient(135deg,var(--g900),var(--g700))","color":"var(--cl)","fontSize":"13px","fontWeight":"800","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 4px 12px rgba(0,0,0,.2)"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"3px"}}>Review Gates</div><div style={{"fontSize":"13px","color":"var(--g500)","lineHeight":"1.5"}}>No one closes a task without PR + 100% CI passing. Enforced by the system.</div></div></div>
                          <div style={{"display":"flex","alignItems":"flex-start","gap":"12px"}}><div style={{"width":"34px","height":"34px","borderRadius":"9px","background":"linear-gradient(135deg,var(--g900),var(--g700))","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 4px 12px rgba(0,0,0,.2)"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cl)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m1.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg></div><div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"3px"}}>AI Code Review & Scoring</div><div style={{"fontSize":"13px","color":"var(--g500)","lineHeight":"1.5"}}>AI reads commits/PRs, scores quality. Red alert when score drops below threshold.</div></div></div>
                          <div style={{"display":"flex","alignItems":"flex-start","gap":"12px"}}><div style={{"width":"34px","height":"34px","borderRadius":"9px","background":"linear-gradient(135deg,var(--g900),var(--g700))","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 4px 12px rgba(0,0,0,.2)"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cl)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div><div><div style={{"fontSize":"14px","fontWeight":"700","color":"var(--g900)","marginBottom":"3px"}}>1-Touch Approve & Audit Trail</div><div style={{"fontSize":"13px","color":"var(--g500)","lineHeight":"1.5"}}>Leader approves or rejects with 1 click. All rejection reasons stored permanently for KPI.</div></div></div>
                      </div>
                  </div>
                  <div style={{"position":"relative"}} className="sr">
                      {/* Cảnh báo float nhỏ gọn, dùng màu xanh (var(--t)) chủ đạo của web */}
                      {/* Đưa ra ngoài .ci3d để không bị lỗi Z-index 3D */}
                      <div className="fcrd flts" style={{
                          position: "absolute",
                          top: "-16px", 
                          left: "-16px", 
                          zIndex: 50, 
                          padding: "8px 12px", 
                          background: "var(--t)", /* Màu xanh chủ đạo của web */
                          borderRadius: "10px",
                          boxShadow: "0 10px 20px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                      }}>
                          {/* Icon thu nhỏ màu trắng */}
                          <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          </div>
                          <div style={{ textAlign: "left" }}>
                              <div style={{ fontSize: "11px", fontWeight: "700", color: "#ffffff", marginBottom: "1px" }}>Code score below threshold!</div>
                              <div style={{ fontSize: "9px", fontWeight: "500", color: "rgba(255, 255, 255, 0.85)" }}>Requires Leader's Approval</div>
                          </div>
                      </div>

                      <div className="ci3d" style={{ overflow: "visible", transformStyle: "preserve-3d", padding: 0 }}>
                          
                          {/* Ảnh 1: Ảnh chính */}
                          <img 
                              src="https://res.cloudinary.com/dufmichwn/image/upload/v1782966645/system_architacture_pehuwp.jpg" 
                              alt="System Architecture"
                              style={{ 
                                  width: "100%", 
                                  height: "520px", 
                                  objectFit: "cover",
                                  objectPosition: "center top",
                                  borderRadius: "22px", 
                                  display: "block", 
                                  transform: "translateZ(20px)",
                                  position: "relative",
                                  zIndex: 1
                              }}
                          />

                          {/* Ảnh 2: Ảnh phụ đè lên góc */}
                          <img 
                              src="https://res.cloudinary.com/dufmichwn/image/upload/v1782966645/codeinsight_t1i7hc.jpg" 
                              alt="Code Insight"
                              style={{ 
                                  position: "absolute", 
                                  bottom: "-40px", 
                                  right: "-40px", 
                                  width: "60%", 
                                  height: "auto", 
                                  borderRadius: "16px", 
                                  transform: "translateZ(80px)", 
                                  boxShadow: "0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
                                  zIndex: 10
                              }}
                          />
                      </div>
                  </div>
              </div>
          </div>
      </section>
    </>
  );
};

export default LandingCodeInsight;

