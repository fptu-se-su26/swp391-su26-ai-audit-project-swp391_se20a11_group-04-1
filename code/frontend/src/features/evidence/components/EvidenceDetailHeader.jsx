import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { STATUS_STYLE_MAP, TYPE_LABEL_MAP, TYPE_ICON_MAP } from './EvidenceCard';

/**
 * EvidenceDetailHeader — Header section cho Evidence detail page
 * Hiển thị title, status badge, type, action buttons
 */
const EvidenceDetailHeader = ({ evidence, onEdit, onDelete, onReview }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const type = evidence.type || 'DOCUMENT';
  const status = evidence.status || 'PENDING';
  const statusStyle = STATUS_STYLE_MAP[status] || STATUS_STYLE_MAP.PENDING;
  const typeIcon = TYPE_ICON_MAP[type] || 'description';

  const formattedDate = evidence.createdAt
    ? new Date(evidence.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate(`/projects/${projectId}/evidence`)}
          className="flex items-center gap-1 font-body-md text-[13px] text-[#1E707D] hover:text-[#1E707D]/80 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Evidence Vault
        </button>
        <span className="text-outline text-[13px]">/</span>
        <span className="font-body-md text-[13px] text-on-surface-variant">
          EV-{String(evidence.id).padStart(3, '0')}
        </span>
      </div>

      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          {/* Status + Type + ID Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-label-md text-label-md text-[#1E707D] bg-[#D7EEF1]/30 px-2 py-0.5 rounded-md">
              EV-{String(evidence.id).padStart(3, '0')}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label-md text-label-md ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
            >
              <span className="material-symbols-outlined text-[14px]">{statusStyle.icon}</span>
              {statusStyle.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant font-label-md text-label-md text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">{typeIcon}</span>
              {TYPE_LABEL_MAP[type] || type}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">{evidence.title}</h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 font-body-md text-[13px] text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">person</span>
              {evidence.uploadedByName || 'Unknown'}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {formattedDate}
            </span>
            {evidence.reviewedBy && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Reviewed by {evidence.reviewedByName || `User #${evidence.reviewedBy}`}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
            title="Edit evidence"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-error-container/30 transition-colors text-error"
            title="Delete evidence"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvidenceDetailHeader;
