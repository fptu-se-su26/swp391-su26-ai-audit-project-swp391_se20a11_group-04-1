import React, { useState, useEffect, useRef } from 'react';

const TEAM_MEMBERS = [
    {
        id: 'hung',
        name: 'Duy Hung',
        role: 'Project Lead',
        desc: 'Leading the vision and architecture to build a scalable platform.',
        image: 'https://res.cloudinary.com/dufmichwn/image/upload/q_auto,f_auto,c_fill,w_400,h_550/v1782960826/hung_kmxhzb.jpg',
        themeColor: '#94a3b8',
        initials: 'DH'
    },
    {
        id: 'tin',
        name: 'Trung Tin',
        role: 'AI Engineer',
        desc: 'Pushing the boundaries of AI integration to make testing smarter.',
        image: 'https://res.cloudinary.com/dufmichwn/image/upload/q_auto,f_auto,c_fill,w_400,h_550/v1782960822/tin_mkezt6.jpg',
        themeColor: '#8b5cf6',
        initials: 'TT'
    },
    {
        id: 'tu',
        name: 'Tu Tran',
        role: 'Backend Engineer',
        desc: 'Architecting the backend backbone for high performance and reliability.',
        image: 'https://res.cloudinary.com/dufmichwn/image/upload/v1782987032/tu_strv43.jpg',
        themeColor: '#22c55e',
        initials: 'TU',
        fallbackBg: 'linear-gradient(180deg, #14532d 0%, #064e3b 100%)'
    },
    {
        id: 'hn',
        name: 'Hieu Nguyen',
        role: 'Data Scientist',
        desc: 'Crafting intuitive and pixel-perfect user experiences for everyone.',
        image: 'https://res.cloudinary.com/dufmichwn/image/upload/v1782987033/minh_r8s4s7.jpg',
        themeColor: '#f59e0b',
        initials: 'HN',
        fallbackBg: 'linear-gradient(180deg, #9a3412 0%, #431407 100%)'
    },
    {
        id: 'td',
        name: 'Thanh Dat',
        role: 'Cloud Architect',
        desc: 'Ensuring scalable and zero-downtime infrastructure for global users.',
        image: 'https://res.cloudinary.com/dufmichwn/image/upload/v1782987033/linh_v2w9yq.jpg',
        themeColor: '#e11d48',
        initials: 'TD',
        fallbackBg: 'linear-gradient(180deg, #9f1239 0%, #4c0519 100%)'
    }
];

const LandingTeam = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => prev + 1);
    }, 3000); // Trả lại 3s và xoay liên tục không ngừng
    return () => clearInterval(interval);
  }, []);

  const getOffset = (index) => {
    const total = TEAM_MEMBERS.length;
    const normalizedActive = ((activeIndex % total) + total) % total;
    let offset = index - normalizedActive;
    if (offset > 2) offset -= total;
    if (offset < -2) offset += total;
    return offset;
  };

  // Xử lý Parallax & Spotlight Hover
  const handleMouseMove = (e, offset) => {
      // Chỉ áp dụng hiệu ứng cho thẻ trung tâm để tạo sự chú ý
      if (offset !== 0) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Xoay thẻ theo hướng chuột (ngược chiều để tạo cảm giác thực)
      const rotateX = ((y - centerY) / centerY) * -12; 
      const rotateY = ((x - centerX) / centerX) * 12;
      
      const tiltEl = e.currentTarget.querySelector('.tc-tilt');
      const innerEl = e.currentTarget.querySelector('.tc-inner');
      
      if (tiltEl) tiltEl.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      
      // Cập nhật toạ độ ánh sáng Spotlight
      if (innerEl) {
          innerEl.style.setProperty('--mouse-x', `${x}px`);
          innerEl.style.setProperty('--mouse-y', `${y}px`);
      }
  };

  const handleMouseLeave = (e) => {
      const tiltEl = e.currentTarget.querySelector('.tc-tilt');
      const innerEl = e.currentTarget.querySelector('.tc-inner');
      
      if (tiltEl) tiltEl.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      
      // Đẩy ánh sáng ra ngoài
      if (innerEl) {
          innerEl.style.setProperty('--mouse-x', `-500px`);
          innerEl.style.setProperty('--mouse-y', `-500px`);
      }
  };

  // Xác định màu sắc của Hào quang theo thành viên trung tâm
  const centerMember = TEAM_MEMBERS[((activeIndex % TEAM_MEMBERS.length) + TEAM_MEMBERS.length) % TEAM_MEMBERS.length];

  return (
    <>
      <section id="team" className="tint-a" style={{background:"var(--g50)",padding:"72px 0 0", overflow: "visible", position:"relative", zIndex: 20}}>
          <div style={{textAlign:"center",marginBottom:"16px",padding:"0 56px", position:"relative", zIndex:10}}>
              <div className="s-eye sr" style={{justifyContent:"center"}}><div className="s-el"></div></div>
              <div className="sb sr" style={{display:"inline-flex"}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Meet the Team
              </div>
              <h2 className="st sr" style={{textAlign:"center"}}>Built by students,<br /><span style={{color:"var(--t)"}}>for students</span></h2>
          </div>

          <style>{`
              .coverflow-container {
                  position: relative;
                  width: 100vw;
                  max-width: 100%;
                  height: 540px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  perspective: 1200px;
                  margin-top: 10px;
                  margin-bottom: 60px;
                  left: 50%;
                  transform: translateX(-50%);
              }
              
              @keyframes breatheAura {
                  0% { transform: scale(1); opacity: 0.4; filter: blur(40px); }
                  50% { transform: scale(1.1); opacity: 0.7; filter: blur(60px); }
                  100% { transform: scale(1); opacity: 0.4; filter: blur(40px); }
              }
              .glow-backdrop {
                  position: absolute;
                  width: 500px;
                  height: 400px;
                  border-radius: 50%;
                  z-index: 0;
                  pointer-events: none;
                  animation: breatheAura 5s infinite ease-in-out;
                  transition: background 1s ease;
              }

              .smoke-left {
                  position: absolute;
                  left: 0; top: 0; bottom: 0; width: 22vw;
                  background: linear-gradient(to right, var(--g50) 10%, rgba(255,255,255,0) 100%);
                  z-index: 10;
                  pointer-events: none;
              }
              .smoke-right {
                  position: absolute;
                  right: 0; top: 0; bottom: 0; width: 22vw;
                  background: linear-gradient(to left, var(--g50) 10%, rgba(255,255,255,0) 100%);
                  z-index: 10;
                  pointer-events: none;
              }

              .coverflow-item {
                  position: absolute;
                  width: 270px; /* Hơi rộng ra chút cho hình chân dung */
                  height: 400px;
                  cursor: pointer;
                  will-change: transform, opacity, filter, z-index;
                  transition: transform 1.2s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 1.2s ease, filter 1.2s ease;
              }

              .coverflow-item[data-offset="0"]  { transform: translateX(0) translateZ(80px) rotateY(0deg) scale(1); z-index: 5; opacity: 1; filter: blur(0px); }
              .coverflow-item[data-offset="1"]  { transform: translateX(20vw) translateZ(-60px) rotateY(-15deg) scale(0.85); z-index: 4; opacity: 0.9; filter: blur(0.5px); }
              .coverflow-item[data-offset="-1"] { transform: translateX(-20vw) translateZ(-60px) rotateY(15deg) scale(0.85); z-index: 4; opacity: 0.9; filter: blur(0.5px); }
              .coverflow-item[data-offset="2"]  { transform: translateX(38vw) translateZ(-250px) rotateY(-30deg) scale(0.7); z-index: 3; opacity: 0.6; filter: blur(2.5px); }
              .coverflow-item[data-offset="-2"] { transform: translateX(-38vw) translateZ(-250px) rotateY(30deg) scale(0.7); z-index: 3; opacity: 0.6; filter: blur(2.5px); }

              .tc-tilt {
                  width: 100%;
                  height: 100%;
                  border-radius: 20px;
                  transform-style: preserve-3d;
                  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                  box-shadow: 0 40px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.2);
              }

              .coverflow-item:not([data-offset="0"]) .tc-tilt {
                  box-shadow: 0 15px 35px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.1);
              }

              .tc-inner {
                  position: absolute;
                  inset: 0;
                  border-radius: 20px;
                  overflow: hidden;
                  transform-style: preserve-3d;
                  display: flex;
                  flex-direction: column;
                  padding: 24px;
                  background-size: cover;
                  background-position: center;
                  background-repeat: no-repeat;
              }

              .tc-inner::before {
                  content: '';
                  position: absolute;
                  inset: 0;
                  background: radial-gradient(
                      600px circle at var(--mouse-x, -500px) var(--mouse-y, -500px),
                      rgba(255,255,255,0.15),
                      transparent 40%
                  );
                  z-index: 10;
                  pointer-events: none;
                  mix-blend-mode: overlay;
              }

              .tc-inner::after {
                  content: '';
                  position: absolute;
                  inset: 0;
                  background: linear-gradient(
                      105deg,
                      transparent 20%,
                      rgba(255,255,255,0.2) 25%,
                      transparent 30%
                  );
                  z-index: 10;
                  pointer-events: none;
                  transform: translateX(-100%);
                  transition: transform 0.8s ease;
              }
              
              .coverflow-item[data-offset="0"]:hover .tc-inner::after {
                  transform: translateX(100%);
              }

              /* Gradient mượt từ dưới lên để làm nổi bật name box */
              .tc-overlay {
                  position: absolute;
                  inset: 0;
                  background: linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 50%, rgba(15, 23, 42, 0) 100%);
                  z-index: 1;
              }

              /* Viền sáng bao quanh khung hình */
              .tc-inner {
                  border: 1px solid rgba(255,255,255,0.05);
                  transition: border-color 0.5s ease, box-shadow 0.5s ease;
              }
              
              .coverflow-item[data-offset="0"] .tc-inner {
                  border-color: rgba(255,255,255,0.25); /* Viền sáng trắng rất mỏng và nhẹ */
                  box-shadow: inset 0 0 40px rgba(0,0,0,0.4), 0 15px 40px rgba(0,0,0,0.4); /* Chỉ dùng bóng đen mờ để tạo chiều sâu, không dùng ánh sáng màu gắt */
              }

              @keyframes breatheSmoke {
                  0% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); filter: blur(30px); }
                  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); filter: blur(40px); }
                  100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); filter: blur(30px); }
              }

              /* Khung tên thiết kế nhỏ gọn ở đáy - Trong suốt hoàn toàn */
              .tc-name-box {
                  position: relative;
                  z-index: 5;
                  margin-top: auto;
                  padding: 12px;
                  text-align: center;
                  transform: translateZ(50px);
                  transition: transform 0.3s ease;
              }
              
              .tc-name { 
                  font-size: 24px; 
                  font-weight: 900; 
                  margin-bottom: 8px; 
                  letter-spacing: -0.5px;
                  /* Isometric block-letter 3D effect (Giống hệt tiêu đề "Real Engineering Team") */
                  color: #fdfeff;
                  -webkit-text-stroke: 1px var(--t);
                  text-stroke: 1px var(--t);
                  paint-order: stroke fill;
                  position: relative;
                  text-shadow:
                    -1px 0 0 var(--t), 1px 0 0 var(--t), 0 -1px 0 var(--t), 0 1px 0 var(--t),
                    1px 1px 0 var(--t), 2px 2px 0 var(--t), 3px 3px 0 var(--t), 
                    4px 4px 0 var(--t), 5px 5px 0 var(--td), 6px 6px 0 var(--td),
                    7px 7px 15px rgba(0,0,0,0.6);
              }
              
              .tc-desc {
                  font-size: 11.5px;
                  font-style: italic;
                  color: var(--t); /* Màu xanh đang build web */
                  line-height: 1.4;
                  font-weight: 600;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                  text-shadow: 0 2px 6px rgba(0,0,0,0.8);
                  transition: filter 0.3s ease;
              }
              
              .coverflow-item[data-offset="0"] .tc-desc {
                  filter: brightness(1.2);
              }
          `}</style>

          <div className="coverflow-container" ref={containerRef}>
              <div 
                className="glow-backdrop" 
                style={{ background: `radial-gradient(circle at center, ${centerMember.themeColor} 0%, transparent 70%)` }}
              ></div>
              
              <div className="smoke-left"></div>
              <div className="smoke-right"></div>

              {TEAM_MEMBERS.map((member, index) => {
                  const offset = getOffset(index);
                  return (
                      <div 
                          key={member.id}
                          className="coverflow-item"
                          data-offset={offset}
                          onMouseMove={(e) => handleMouseMove(e, offset)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => setActiveIndex(index)}
                      >
                          <div className="tc-tilt">
                              <div 
                                className="tc-inner" 
                                style={{ 
                                  backgroundImage: member.image ? `url("${member.image}")` : member.fallbackBg,
                                  '--card-theme': member.themeColor 
                                }}
                              >
                                  <div className="tc-overlay"></div>

                                  {/* Xoá badge & skills cũ, thay bằng name-box ở dưới cùng */}
                                  <div className="tc-name-box">
                                      <div className="tc-name">{member.name}</div>
                                      <div className="tc-desc">{member.desc}</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>

          {/* Dải nội dung kết thúc Team: Tối giản, gọn gàng và hiện đại hơn */}
          <div style={{ textAlign: "center", padding: "0 24px 80px", position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", marginTop: "-32px" }}>
              
              {/* Lớp khói toả màu xanh chủ đạo tràn xuống cả section dưới */}
              <div style={{
                  position: "absolute",
                  top: "100%", /* Đẩy tâm khói xuống sát mép dưới để tràn 50% sang bên kia */
                  left: "50%",
                  width: "100%",
                  maxWidth: "1000px",
                  height: "450px", /* Tăng kích thước khổng lồ để tràn được sâu hơn */
                  background: "radial-gradient(ellipse at center, rgba(30,112,125,0.7) 0%, rgba(30,112,125,0.2) 40%, transparent 70%)",
                  zIndex: -1,
                  pointerEvents: "none",
                  animation: "breatheSmoke 6s infinite ease-in-out"
              }}></div>

              {/* Mission Statement (Độ dài khoảng 10-15 chữ, ý nghĩa sâu sắc) */}
              <div style={{ marginBottom: "20px", maxWidth: "480px", position: "relative", zIndex: 1 }}>
                  <p 
                      style={{ 
                          fontSize: "15px", 
                          fontWeight: "600", 
                          lineHeight: "1.6",
                          background: "linear-gradient(135deg, var(--g800), var(--g400))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          letterSpacing: "0.2px",
                          transition: "all 0.4s ease", 
                          cursor: "default"
                      }} 
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--t)'; e.currentTarget.style.WebkitBackgroundClip = 'text'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, var(--g800), var(--g400))'; e.currentTarget.style.WebkitBackgroundClip = 'text'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                      "We believe student projects deserve the same architectural rigor and quality gates as industry software."
                  </p>
              </div>

              {/* Stylized Signature (Bọc trong Badge/Pill sang trọng) */}
              <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "8px", 
                  background: "rgba(255,255,255,0.6)", 
                  padding: "6px 16px", 
                  borderRadius: "100px", 
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(0,0,0,0.05)", 
                  backdropFilter: "blur(8px)",
                  position: "relative",
                  zIndex: 1
              }}>
                  <div style={{ 
                      fontSize: "10.5px", 
                      fontWeight: "700", 
                      color: "var(--g600)", 
                      fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase"
                  }}>
                      <span style={{ color: "var(--t)", fontWeight: "900", marginRight: "4px" }}>&lt;/&gt;</span> 
                      BUILT BY GROUP 04
                  </div>
              </div>
          </div>

      </section>
    </>
  );
};

export default LandingTeam;
