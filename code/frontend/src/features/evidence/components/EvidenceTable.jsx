import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TYPE_ICON_MAP, TYPE_LABEL_MAP, STATUS_STYLE_MAP } from './EvidenceCard';

/**
 * EvidenceTable — Table view cho danh sách Evidence (alternative to grid)
 */
const EvidenceTable = ({ evidences = [] }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-container-low">
            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">ID</th>
            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Title</th>
            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Uploaded By</th>
            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Links</th>
            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody>
          {evidences.map((ev) => {
            const type = ev.type || 'DOCUMENT';
            const status = ev.status || 'PENDING';
            const statusStyle = STATUS_STYLE_MAP[status] || STATUS_STYLE_MAP.PENDING;
            const typeIcon = TYPE_ICON_MAP[type] || 'description';
            const links = ev.evidenceLinks || [];

            const formattedDate = ev.createdAt
              ? new Date(ev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—';

            const uploaderInitials = ev.uploadedByName
              ? ev.uploadedByName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : '??';

            return (
              <tr
                key={ev.id}
                onClick={() => navigate(`/projects/${projectId}/evidence/${ev.id}`)}
                className="border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors group"
              >
                {/* ID */}
                <td className="px-4 py-3">
                  <span className="font-label-md text-label-md text-primary bg-primary-fixed/30 px-1.5 py-0.5 rounded-md">
                    EV-{String(ev.id).padStart(3, '0')}
                  </span>
                </td>

                {/* Title */}
                <td className="px-4 py-3">
                  <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors line-clamp-1 max-w-[280px] inline-block">
                    {ev.title}
                  </span>
                </td>

                {/* Type */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{typeIcon}</span>
                    <span className="font-body-md text-[13px] text-on-surface-variant">
                      {TYPE_LABEL_MAP[type] || type}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label-md text-[10px] uppercase font-bold tracking-wider ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">{statusStyle.icon}</span>
                    {statusStyle.label}
                  </span>
                </td>

                {/* Uploaded By */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-md text-[10px]">
                      {uploaderInitials}
                    </div>
                    <span className="font-body-md text-[13px] text-on-surface-variant">
                      {ev.uploadedByName || 'Unknown'}
                    </span>
                  </div>
                </td>

                {/* Links count */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">link</span>
                    <span className="font-body-md text-[13px] text-on-surface-variant">{links.length}</span>
                  </div>
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  <span className="font-body-md text-[13px] text-outline">{formattedDate}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EvidenceTable;
