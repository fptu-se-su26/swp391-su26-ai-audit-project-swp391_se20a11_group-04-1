import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const EvidenceTabContent = ({ evidences, requirement }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  if (!evidences || evidences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <span className="material-symbols-outlined text-[32px]">inventory_2</span>
        </div>
        <h3 className="text-slate-800 font-bold mb-2">No evidence uploaded yet</h3>
        <p className="text-slate-500 text-sm mb-6 max-w-sm">
          Upload screenshots, reports, GitHub links, or documents to prove requirement completion.
        </p>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderEvidenceCard = (ev) => {
    const type = (ev.type || '').toLowerCase();
    switch (type) {
      case 'image':
      case 'screenshot':
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow max-w-2xl group cursor-pointer" onClick={() => navigate(`/projects/${projectId}/evidence/${ev.id}`)}>
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-lg shrink-0 overflow-hidden border border-slate-200 relative flex items-center justify-center">
                {ev.fileUrl || ev.externalUrl ? (
                  <img src={ev.fileUrl || ev.externalUrl} alt={ev.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-slate-400 text-3xl">image</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <span className="material-symbols-outlined text-white">zoom_in</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h4 className="font-semibold text-sm text-slate-800 truncate" title={ev.title}>📸 {ev.title}</h4>
                    <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
                      {ev.status || 'VERIFIED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 truncate">{ev.description || 'No description provided'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs font-medium px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-100 transition-colors">View Image</button>
                  <button className="text-xs font-medium px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 transition-colors">Verify</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'pdf':
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow max-w-2xl cursor-pointer" onClick={() => navigate(`/projects/${projectId}/evidence/${ev.id}`)}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h4 className="font-semibold text-sm text-slate-800 truncate" title={ev.title}>{ev.title}</h4>
                  <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
                    {ev.status || 'VERIFIED'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{ev.description || 'No description provided'}</p>
                <div className="flex items-center gap-2">
                  <button className="text-xs font-medium px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-100 transition-colors">View PDF</button>
                  <button className="text-xs font-medium px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 transition-colors">Verify</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'github':
      case 'github_pr':
        const isMerged = ev.metadata?.githubStatus === 'Merged' || ev.status === 'Merged';
        const isClosed = ev.metadata?.githubStatus === 'Closed' || ev.status === 'Closed';
        const prColor = isMerged ? 'text-purple-600 bg-purple-50 border-purple-200' : isClosed ? 'text-slate-600 bg-slate-50 border-slate-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200';
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow max-w-2xl cursor-pointer" onClick={() => navigate(`/projects/${projectId}/evidence/${ev.id}`)}>
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-slate-700 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded uppercase border ${prColor}`}>
                    {isMerged ? '🟣 Merged' : isClosed ? '⚫ Closed' : '🟢 Open'}
                  </span>
                  <h4 className="font-semibold text-sm text-slate-800 truncate">{ev.title}</h4>
                </div>
                {ev.metadata?.branch && (
                  <div className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded inline-block">
                    {ev.metadata.branch}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button className="text-xs font-medium px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-100 transition-colors">View Pull Request</button>
              <button className="text-xs font-medium px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 transition-colors">Verify</button>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow max-w-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">link</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h4 className="font-semibold text-sm text-slate-800 truncate" title={ev.title}>🌐 External Link · {ev.title}</h4>
                </div>
                <p className="text-xs text-blue-600 mb-3 truncate underline hover:text-blue-800 cursor-pointer">{ev.externalUrl || ev.fileUrl || 'No URL available'}</p>
                <div className="flex items-center gap-2">
                  <button className="text-xs font-medium px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-100 transition-colors">Open Link</button>
                  <button className="text-xs font-medium px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 transition-colors">Verify Evidence</button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white sticky top-0 z-10">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Evidence 
            <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-md text-xs font-bold">{evidences.length}</span>
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium bg-emerald-50 w-fit px-2 py-0.5 rounded border border-emerald-100">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            Evidence history is preserved for audit transparency
          </div>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5 shrink-0">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Upload Evidence
        </button>
      </div>

      {/* Flowing Audit Timeline */}
      <div className="p-8 pb-16 bg-slate-50/30">
        <div className="relative max-w-4xl">
          {/* Main vertical line */}
          <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-slate-200"></div>

          {evidences.map((ev, index) => {
            const isLast = index === evidences.length - 1;
            
            return (
              <div key={ev.id} className="mb-10 last:mb-0 relative">
                
                {/* Level 1: Timestamp Dot */}
                <div className="flex items-center gap-4 mb-4 relative">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 border-4 border-white shadow-sm flex items-center justify-center relative z-10">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  </div>
                  <span className="font-semibold text-sm text-slate-700">
                    {new Date(ev.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Vertical line continuation for this block */}
                <div className="ml-[11px] border-l-2 border-slate-200 relative">
                  
                  {/* Level 2: Uploader Info */}
                  <div className="pl-6 mb-4 relative">
                    {/* Curved connector L-shape to the uploader dot */}
                    <div className="absolute left-0 top-[11px] w-6 h-0.5 bg-slate-200"></div>
                    
                    <div className="flex items-center gap-2 relative z-10">
                      <div className="absolute left-[-28px] w-3 h-3 rounded-full bg-white border-2 border-slate-300"></div>
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-sm shrink-0">
                        {getInitials(ev.uploadedByName || ev.reviewedByName)}
                      </div>
                      <p className="text-sm text-slate-700">
                        <span className="font-medium text-slate-900">{ev.uploadedByName || ev.reviewedByName || 'A User'}</span> submitted evidence
                        {ev.evidenceLinks?.find(l => l.entityType === 'TASK') && (
                          <> for Task:{' '}<span className="font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">TSK-{ev.evidenceLinks.find(l => l.entityType === 'TASK').entityId}</span></>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Level 3: Rich Evidence Card */}
                  <div className="pl-12 relative">
                    {/* Soft L-shaped connector to card */}
                    <div className="absolute left-6 top-1/2 w-6 h-[calc(50%+20px)] border-l-2 border-b-2 border-slate-200 rounded-bl-lg -translate-y-[calc(100%+20px)]"></div>
                    
                    {renderEvidenceCard(ev)}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EvidenceTabContent;
