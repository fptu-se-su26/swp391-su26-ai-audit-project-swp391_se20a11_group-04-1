import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const EvidenceTabContent = ({ evidences, requirement }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [previewImage, setPreviewImage] = useState(null);

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
    
    // Shared compact card structure
    const renderCompactCard = (iconOrImage, title, subtitle, isImage = false) => (
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-2 shadow-sm hover:border-slate-300 hover:shadow transition-all max-w-2xl group cursor-pointer"
           onClick={() => {
             if (isImage && (ev.fileUrl || ev.externalUrl)) {
               setPreviewImage(ev.fileUrl || ev.externalUrl);
             } else {
               navigate(`/projects/${projectId}/evidence/${ev.id}`);
             }
           }}
      >
        <div className="w-10 h-10 shrink-0 rounded bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
           {iconOrImage}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
           <h4 className="font-medium text-sm text-slate-800 truncate" title={title}>{title}</h4>
           <p className="text-xs text-slate-500 truncate">{subtitle || 'No description'}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pl-2">
           <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-bold uppercase tracking-wider">
             UPLOADED
           </span>
        </div>
      </div>
    );

    switch (type) {
      case 'image':
      case 'screenshot':
        const imageContent = (ev.fileUrl || ev.externalUrl) ? (
          <img src={ev.fileUrl || ev.externalUrl} alt={ev.title} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-slate-400 text-xl">image</span>
        );
        return renderCompactCard(imageContent, `📸 ${ev.title}`, ev.description, true);

      case 'pdf':
      case 'document':
      case 'test_result':
      case 'db_diagram':
      case 'survey': {
        const pdfContent = <span className="material-symbols-outlined text-red-500 text-xl">picture_as_pdf</span>;
        return renderCompactCard(pdfContent, `📄 ${ev.title}`, ev.description, false);
      }

      case 'github':
      case 'github_pr':
      case 'github_commit':
        const isMerged = ev.metadata?.githubStatus === 'Merged' || ev.status === 'Merged';
        const isClosed = ev.metadata?.githubStatus === 'Closed' || ev.status === 'Closed';
        const prIcon = isMerged ? '🟣' : isClosed ? '⚫' : '🟢';
        const gitContent = (
          <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
             <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
        );
        return renderCompactCard(gitContent, `${prIcon} ${ev.title}`, ev.metadata?.branch || ev.description, false);

      default:
        const linkContent = <span className="material-symbols-outlined text-blue-500 text-xl">link</span>;
        return renderCompactCard(linkContent, `🌐 ${ev.title}`, ev.externalUrl || ev.fileUrl || 'No URL', false);
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
      </div>

      {/* Compact High-Density Timeline */}
      <div className="p-6 pb-16 bg-white">
        <div className="relative max-w-3xl mx-auto">
          {/* Main vertical line */}
          <div className="absolute left-[5px] top-3 bottom-0 w-px bg-slate-200"></div>

          {evidences.map((ev, index) => {
            const linkedTask = ev.evidenceLinks?.find(l => l.entityType === 'TASK');
            const timeString = new Date(ev.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
            const dateString = new Date(ev.createdAt).toLocaleDateString();
            
            return (
              <div key={ev.id} className="mb-4 relative">
                {/* Header Line */}
                <div className="flex items-center gap-3 relative z-10 bg-white py-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)] border border-white shrink-0"></div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{timeString} {dateString}</span>
                    <span>&middot;</span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                       <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                         {getInitials(ev.uploadedByName || ev.reviewedByName)}
                       </span>
                       {ev.uploadedByName || ev.reviewedByName || 'Unknown User'}
                    </span>
                    {linkedTask && (
                      <>
                        <span>&middot;</span>
                        <span className="text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">TSK-{linkedTask.entityId}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Container */}
                <div className="pl-6 pt-1 pb-2">
                  {renderEvidenceCard(ev)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center transition-all"
            onClick={() => setPreviewImage(null)}
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          
          <img 
            src={previewImage} 
            alt="Evidence Full Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};

export default EvidenceTabContent;
