import React, { useEffect } from 'react';
import '../styles/LandingPage.css';
import LandingHero from '../components/LandingHero';
import LandingFeatures from '../components/LandingFeatures';
import LandingTestCase from '../components/LandingTestCase';
import LandingCodeInsight from '../components/LandingCodeInsight';
import LandingWorkflow from '../components/LandingWorkflow';
import LandingDashboard from '../components/LandingDashboard';
import LandingClassroom from '../components/LandingClassroom';
import LandingAudit from '../components/LandingAudit';
import LandingRoles from '../components/LandingRoles';
import LandingGallery from '../components/LandingGallery';
import LandingTeam from '../components/LandingTeam';
import LandingNavbar from '../components/LandingNavbar';
import LandingFinalCTA from '../components/LandingFinalCTA';
import LandingFooter from '../components/LandingFooter';

const universities = [
  "HUST", "HCMUT", "UIT — VNUHCM", "UET — VNU", "HCMUS",
  "FPT University", "PTIT", "DUT — Đà Nẵng", "KMA",
  "VKU", "DTU", "HCMUTE", "TDTU", "RMIT", "CTU"
];

const LandingPage = () => {
  useEffect(() => {
    // Vanilla JS Extracted
    /* ── SCROLL PROGRESS ── */
    const spbar=document.getElementById('spbar');
    window.addEventListener('scroll',()=>{
        const p=(window.scrollY/(document.documentElement.scrollHeight-window.innerHeight))*100;
        if(spbar)spbar.style.width=p+'%';
    },{passive:true});

    /* ── HERO MOCKUP PARALLAX ── */
    const hm=document.getElementById('hmock');
    const hd=document.getElementById('heroDots');
    document.addEventListener('mousemove',e=>{
        if(hm){const r=hm.getBoundingClientRect();const dx=(e.clientX-(r.left+r.width/2))/r.width;const dy=(e.clientY-(r.top+r.height/2))/r.height;hm.style.transform=`perspective(1600px) rotateX(${7-dy*2.5}deg) rotateY(${dx*2}deg)`;}
        if(hd){const x=(e.clientX/window.innerWidth-.5)*12;const y=(e.clientY/window.innerHeight-.5)*8;hd.style.transform=`translate(${x}px,${y}px)`;}
    },{passive:true});

    /* ── CARD TILT ── */
    ['.tc3d','.ci3d','.cls3d'].forEach((s,i)=>{
        const el=document.querySelector(s);
        if(!el)return;
        const ry0=i===1?5:-6;
        el.addEventListener('mousemove',e=>{
            const r=el.getBoundingClientRect();
            const dx=((e.clientX-r.left)/r.width-.5)*7;
            const dy=((e.clientY-r.top)/r.height-.5)*-3.5;
            el.style.transform=`perspective(1000px) rotateY(${ry0+dx}deg) rotateX(${2+dy}deg)`;
        });
        el.addEventListener('mouseleave',()=>{el.style.transform='';});
    });

    /* ── FC + MINI3D TILT ── */
    document.querySelectorAll('.fc,.mini3d,.rc').forEach(c=>{
        c.addEventListener('mousemove',e=>{
            const r=c.getBoundingClientRect();
            const rx=((e.clientY-r.top)/r.height-.5)*-7;
            const ry=((e.clientX-r.left)/r.width-.5)*7;
            c.style.transform=`translateY(-5px) perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
        c.addEventListener('mouseleave',()=>{c.style.removeProperty('transform');});
    });

    /* ── COUNTER ANIMATION ── */
    function animCount(el){
        const tgt=parseInt(el.dataset.count);const suf=el.dataset.suffix||'';
        if(isNaN(tgt))return;
        const dur=1200;const t0=performance.now();
        const ease=t=>1-Math.pow(1-t,3);
        (function step(now){
            const t=Math.min((now-t0)/dur,1);
            el.textContent=Math.round(ease(t)*tgt)+suf;
            if(t<1)requestAnimationFrame(step);
        })(t0);
    }
    const cobs=new IntersectionObserver(entries=>{
        entries.forEach(e=>{if(e.isIntersecting&&!e.target.dataset.counted){e.target.dataset.counted='1';animCount(e.target);}});
    },{threshold:.5});
    document.querySelectorAll('[data-count]').forEach(el=>cobs.observe(el));

    /* ── GALLERY COVERFLOW ── */
    (function(){
        const items=document.querySelectorAll('.gi');
        const dots=document.querySelectorAll('#gDots .gd2');
        const N=items.length;
        if(N===0) return;
        let cur=0;
        function getClass(offset){
            if(offset===0)return 'center';
            if(offset===1||offset===-(N-1))return 'right1';
            if(offset===2||offset===-(N-2))return 'right2';
            if(offset===-1||offset===(N-1))return 'left1';
            if(offset===-2||offset===(N-2))return 'left2';
            return 'hidden';
        }
        function render(){
            items.forEach((el,i)=>{
                el.className='gi';
                const off=((i-cur)%N+N+Math.floor(N/2))%N-Math.floor(N/2);
                el.classList.add(getClass(off));
                if(el.style.background&&el.style.background.includes('g900'))el.style.background='var(--g900)';
                if(el.style.background&&el.style.background.includes('g800'))el.style.background='var(--g800)';
            });
            dots.forEach((d,i)=>d.classList.toggle('a',i===cur));
        }
        function go(d){cur=((cur+d)%N+N)%N;render();}
        document.getElementById('gNext')?.addEventListener('click',()=>go(1));
        document.getElementById('gPrev')?.addEventListener('click',()=>go(-1));
        dots.forEach(d=>d.addEventListener('click',()=>{cur=+d.dataset.gi;render();}));
        items.forEach((el,i)=>el.addEventListener('click',()=>{cur=i;render();}));
        render();
        // fix dark slide bg after class reset
        const darkMap={'2':'var(--g900)','3':'var(--g800)'};
        const origRender=render;
        window._grender=function(){
            origRender();
            items.forEach((el,i)=>{if(darkMap[i])el.style.background=darkMap[i];});
        };
        window._grender();
        let gtimer=setInterval(()=>{cur=((cur+1)%N+N)%N;window._grender();},5000);
        document.getElementById('gStage')?.addEventListener('mouseenter',()=>clearInterval(gtimer));
        document.getElementById('gStage')?.addEventListener('mouseleave',()=>{gtimer=setInterval(()=>{cur=((cur+1)%N+N)%N;window._grender();},5000);});
    })();

    /* ── SCROLL REVEAL ── */
    const srobs=new IntersectionObserver(entries=>{
        entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis');});
    },{threshold:.07});
    document.querySelectorAll('.sr').forEach(el=>srobs.observe(el));

    /* ── FAN CAROUSEL ── */
    (function(){
        const stage = document.getElementById('fanStage');
        if (!stage || stage.dataset.fanInit) return;
        stage.dataset.fanInit = 'true';
        
        const cards = document.querySelectorAll('.fan-card');
        const dots  = document.querySelectorAll('#fanDots .fan-dot');
        const N = cards.length;
        if(N===0) return;
        let cur = 0;

        const CLASSES = {
            '-2':'fc-l2','-1':'fc-l1','0':'fc-center','1':'fc-r1','2':'fc-r2'
        };

        function render(){
            cards.forEach((c,i)=>{
                c.className = 'fan-card';
                const off = ((i - cur) % N + N + Math.floor(N/2)) % N - Math.floor(N/2);
                const cls = CLASSES[String(off)] || 'fc-hidden';
                c.classList.add(cls);
            });
            dots.forEach((d,i)=> d.classList.toggle('a', i===cur));
        }

        function go(dir){
            cur = ((cur+dir)%N+N)%N;
            render();
        }

        document.getElementById('fanNext')?.addEventListener('click',()=>go(1));
        document.getElementById('fanPrev')?.addEventListener('click',()=>go(-1));
        dots.forEach(d=>d.addEventListener('click',()=>{cur=+d.dataset.fi;render();}));
        cards.forEach((c,i)=>c.addEventListener('click',()=>{
            const off=((i-cur)%N+N+Math.floor(N/2))%N-Math.floor(N/2);
            if(off!==0) go(off>0?1:-1);
        }));
        render();

        // auto-rotate
        let fanTimer = setInterval(()=>go(1), 3000);
        stage.addEventListener('mouseenter',()=>clearInterval(fanTimer));
        stage.addEventListener('mouseleave',()=>{fanTimer=setInterval(()=>go(1),3000);});
    })();

    /* ── SMOOTH SCROLL + NAV ACTIVE ── */
    const navLinks=document.querySelectorAll('.nlinks a[href^="#"]');
    function updateActiveNav(){
        const sections=document.querySelectorAll('section[id],div[id]');
        let current='';
        sections.forEach(s=>{
            const top=s.getBoundingClientRect().top;
            if(top<=80)current=s.id;
        });
        navLinks.forEach(a=>{
            a.classList.remove('nav-active');
            if(a.getAttribute('href')==='#'+current)a.classList.add('nav-active');
        });
    }
    window.addEventListener('scroll',updateActiveNav,{passive:true});

    navLinks.forEach(a=>{
        a.addEventListener('click',e=>{
            const id=a.getAttribute('href');
            if(id==='#')return;
            const t=document.querySelector(id);
            if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}
        });
    });

    /* also handle logo click → top */
    document.querySelector('.nlogo')?.addEventListener('click',e=>{
        e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});
    });

    /* fade in hero */
    document.querySelectorAll('.fu').forEach((el,i)=>{
        el.style.opacity='0';el.style.transform='translateY(24px)';
        setTimeout(()=>{el.style.transition='opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)';el.style.opacity='1';el.style.transform='translateY(0)';},100+i*100);
    });
  }, []);

  return (
    <div className="landing-page-container">
      <div id="spbar"></div>

      <LandingNavbar />

      {/*  HERO  */}
      <LandingHero />

      {/*  NUMBERS + MARQUEE  */}
      <div className="nums-wrap">
          <div className="nums-in">
              <div className="ni"><div className="nv" data-count="500" data-suffix="+">500+</div><div className="nl">Active Students</div></div>
              <div className="ni"><div className="nv" data-count="10" data-suffix="">10</div><div className="nl">Modules</div></div>
              <div className="ni"><div className="nv" data-count="100" data-suffix="%">100%</div><div className="nl">Traceability</div></div>
              <div className="ni"><div className="nv" data-count={universities.length} data-suffix="">{universities.length}</div><div className="nl">Universities</div></div>
              <div className="ni" style={{borderRight:"none"}}><div className="nv">AI</div><div className="nl">Powered</div></div>
          </div>
          <div className="marquee-wrap">
              <div className="marquee-inner">
                  {[1, 2, 3, 4].map((group) => (
                      <div key={group} className="marquee-group" aria-hidden={group > 1 ? "true" : undefined}>
                          {universities.map((uni, idx) => (
                              <div key={idx} className="m-chip">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                                  </svg>
                                  {uni}
                              </div>
                          ))}
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/*  FEATURES  */}
      <hr className="s-div" />
      <LandingFeatures />

      <div className="s-conn"></div>
      {/*  TEST CASE  */}
      <hr className="s-div" />
      <LandingTestCase />

      <div className="s-conn"></div>
      {/*  CODE INSIGHT  */}
      <hr className="s-div" />
      <LandingCodeInsight />

      <div className="s-conn"></div>
      {/*  WORKFLOW  */}
      <hr className="s-div" />
      <LandingWorkflow />

      <div className="s-conn"></div>
      {/*  DASHBOARD  */}
      <hr className="s-div" />
      <LandingDashboard />

      {/*  CLASSROOM  */}
      <hr className="s-div" />
      <LandingClassroom />

      {/*  TRACEABILITY  */}
      <hr className="s-div" />
      <LandingAudit />

      {/*  ROLES  */}
      <hr className="s-div" />
      <LandingRoles />

      {/*  GALLERY COVERFLOW  */}
      <hr className="s-div" />
      <LandingGallery />

      {/*  TEAM SECTION  */}
      <hr className="s-div" />
      <LandingTeam />

      {/*  BRAND BOTTOM BAR  */}
      <LandingFinalCTA />

      {/*  FOOTER  */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
