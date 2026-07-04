import React, { useEffect } from 'react';

const GALLERY_IMAGES = [
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966645/project_krgxvs.jpg", title: "Project Overview", slug: "overview", badge: "Project" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782957558/dashboardjpg_yrxci9.jpg", title: "Dashboard", slug: "dashboard", badge: "Dashboard" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966646/re_val4wp.jpg", title: "Requirements", slug: "requirements", badge: "Reqs" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966646/uc_dm7zxc.jpg", title: "Use Cases", slug: "use-cases", badge: "Use Cases" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966646/uc_diagram_m0tid7.jpg", title: "Use Case Diagram", slug: "diagrams", badge: "UML" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966644/task_qu5jee.jpg", title: "Task Management", slug: "tasks", badge: "Tasks" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966645/daily_tr6dll.jpg", title: "Daily Scrum", slug: "daily-scrum", badge: "Scrum" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966646/weekly_tatu1z.jpg", title: "Weekly Report", slug: "reports", badge: "Reports" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966646/sprint_tpc5k5.jpg", title: "Sprint Planning", slug: "sprints", badge: "Sprints" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966646/traceability_sxciun.jpg", title: "Traceability Matrix", slug: "traceability", badge: "Traceability" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966645/evidence_ns8ujk.jpg", title: "Evidence", slug: "evidence", badge: "Evidence" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966645/codeinsight_t1i7hc.jpg", title: "Code Insight", slug: "code-insight", badge: "Insight" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966645/system_architacture_pehuwp.jpg", title: "System Architecture", slug: "architecture", badge: "Architecture" },
    { url: "https://res.cloudinary.com/dufmichwn/image/upload/v1782966645/member_ozrvqq.jpg", title: "Member Management", slug: "members", badge: "Members" },
];

const LandingGallery = () => {

  useEffect(() => {
      const gStage = document.getElementById('gStage');
      if (!gStage) return;

      const items = gStage.querySelectorAll('.gi');
      const dots = document.querySelectorAll('#gDots .gd2');
      const btnNext = document.getElementById('gNext');
      const btnPrev = document.getElementById('gPrev');
      
      const N = items.length;
      if (N === 0) return;
      
      let cur = 0;
      
      function getClass(offset) {
          if (offset === 0) return 'center';
          if (offset === 1 || offset === -(N - 1)) return 'right1';
          if (offset === 2 || offset === -(N - 2)) return 'right2';
          if (offset === -1 || offset === (N - 1)) return 'left1';
          if (offset === -2 || offset === (N - 2)) return 'left2';
          return 'hidden';
      }
      
      function render() {
          items.forEach((el, i) => {
              el.className = 'gi';
              const off = ((i - cur) % N + N + Math.floor(N / 2)) % N - Math.floor(N / 2);
              el.classList.add(getClass(off));
          });
          dots.forEach((d, i) => d.classList.toggle('a', i === cur));
      }
      
      function go(d) {
          cur = ((cur + d) % N + N) % N;
          render();
      }
      
      const handleNext = () => go(1);
      const handlePrev = () => go(-1);
      
      btnNext?.addEventListener('click', handleNext);
      btnPrev?.addEventListener('click', handlePrev);
      
      const handleDotClick = (e) => {
          cur = parseInt(e.currentTarget.dataset.gi, 10);
          render();
      };
      dots.forEach(d => d.addEventListener('click', handleDotClick));
      
      const handleItemClick = (e, i) => {
          cur = i;
          render();
      };
      items.forEach((el, i) => el.addEventListener('click', (e) => handleItemClick(e, i)));
      
      render();
      
      let gtimer = setInterval(() => go(1), 5000);
      
      const handleMouseEnter = () => clearInterval(gtimer);
      const handleMouseLeave = () => {
          gtimer = setInterval(() => go(1), 5000);
      };
      
      gStage.addEventListener('mouseenter', handleMouseEnter);
      gStage.addEventListener('mouseleave', handleMouseLeave);

      return () => {
          btnNext?.removeEventListener('click', handleNext);
          btnPrev?.removeEventListener('click', handlePrev);
          dots.forEach(d => d.removeEventListener('click', handleDotClick));
          items.forEach((el, i) => el.removeEventListener('click', (e) => handleItemClick(e, i)));
          gStage.removeEventListener('mouseenter', handleMouseEnter);
          gStage.removeEventListener('mouseleave', handleMouseLeave);
          clearInterval(gtimer);
      };
  }, []);

  return (
    <>
      <section id="gallery" className="tint-c" style={{"background":"var(--g50)","padding":"72px 0 60px","overflow":"hidden"}}>
          <div style={{"textAlign":"center","marginBottom":"36px","padding":"0 56px"}}>
              <div className="s-eye sr vis" style={{"justifyContent":"center"}}><div className="s-el"></div></div>
              <div className="sb sr vis" style={{"display":"inline-flex"}}>🖼 Project Preview</div>
              <h2 className="st sr vis" style={{"textAlign":"center"}}>See DevTrack AI<br /><span style={{"color":"var(--t)"}}>in action</span></h2>
              <p style={{"fontSize":"15px","color":"var(--g500)","textAlign":"center","margin":"8px auto 0","maxWidth":"420px"}} className="sr vis">Browse every module.</p>
          </div>
          
          <div className="gallery-stage" id="gStage">
              <div style={{"position":"absolute","inset":"0","display":"flex","alignItems":"center","justifyContent":"center"}}>
                  {GALLERY_IMAGES.map((img, idx) => (
                      <div className="gi" data-gi={idx} key={idx}>
                          
                          <div className="gi-bar">
                              <div className="gi-tls">
                                  <div className="gi-tl gi-tlr"></div>
                                  <div className="gi-tl gi-tly"></div>
                                  <div className="gi-tl gi-tlg"></div>
                              </div>
                              <div className="gi-url">devtrack.ai / {img.slug}</div>
                              <div className="gi-bdg">{img.badge}</div>
                          </div>

                          <div className="gi-content" style={{ padding: 0 }}>
                              <img 
                                  src={img.url} 
                                  alt={img.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                              />
                          </div>

                          <div className="gi-info">
                              <div className="gi-num">{(idx + 1).toString().padStart(2, '0')}</div>
                              <div className="gi-title">{img.title}</div>
                          </div>

                      </div>
                  ))}
              </div>
          </div>
          
          <div className="gal-nav">
              <button className="gnbtn" id="gPrev">←</button>
              <div style={{"display":"flex","gap":"7px","alignItems":"center", "flexWrap": "wrap", "justifyContent": "center", "maxWidth": "60vw"}} id="gDots">
                  {GALLERY_IMAGES.map((_, idx) => (
                      <div className={`gd2 ${idx === 0 ? 'a' : ''}`} data-gi={idx} key={idx}></div>
                  ))}
              </div>
              <button className="gnbtn" id="gNext">→</button>
          </div>
      </section>
    </>
  );
};

export default LandingGallery;
