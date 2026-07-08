import React from 'react';

const LandingDashboard = () => {
  return (
    <>
<section id="dashboard" className="tint-b" style={{"padding":"72px 56px","background":"var(--bg)","overflow":"hidden"}}>
                        <div className="wrap">
                            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"flex-end"}}>
                                <div><div className="s-eye sr"><div className="s-el"></div></div><div className="sb sr">🖥 Live Dashboard</div><h2 className="st sr">Project health<br /><span style={{"color":"var(--t)"}}>at a glance</span></h2></div>
                                <div style={{"textAlign":"right"}} className="sr"><div style={{"fontSize":"11px","color":"var(--g400)","marginBottom":"4px"}}>Overall health</div><div style={{"fontSize":"52px","fontWeight":"900","color":"var(--t)","letterSpacing":"-3px","lineHeight":"1"}}>87</div><div style={{"fontSize":"11px","color":"var(--green)","fontWeight":"600"}}>↑ 4 pts this sprint</div></div>
                            </div>
                            <div className="dash-frame-wrapper" style={{ marginTop: '48px', perspective: '1400px' }}>
                                <div className="dash-frame sr" style={{ padding: 0, marginTop: 0 }}>
                                    <img 
                                        src="https://res.cloudinary.com/dufmichwn/image/upload/v1783045722/sprinthealth_yhxmc1.jpg" 
                                        alt="Sprint Health Dashboard" 
                                        style={{ width: '100%', height: 'auto', display: 'block' }} 
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
    </>
  );
};

export default LandingDashboard;

