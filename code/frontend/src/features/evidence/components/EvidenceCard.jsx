import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Map evidence type → Material icon name
 */
const TYPE_ICON_MAP = {
  SCREENSHOT: 'image',
  SCREEN_RECORDING: 'videocam',
  GITHUB_COMMIT: 'commit',
  API_RESPONSE: 'data_object',
  FIGMA_LINK: 'design_services',
  TEST_RESULT: 'checklist',
  DB_DIAGRAM: 'schema',
  DEPLOY_LINK: 'cloud_upload',
  SURVEY: 'poll',
  DOCUMENT: 'description',
};

/**
 * Map evidence type → Human-readable label
 */
const TYPE_LABEL_MAP = {
  SCREENSHOT: 'Screenshot',
  SCREEN_RECORDING: 'Recording',
  GITHUB_COMMIT: 'Commit',
  API_RESPONSE: 'API Response',
  FIGMA_LINK: 'Figma',
  TEST_RESULT: 'Test Result',
  DB_DIAGRAM: 'DB Diagram',
  DEPLOY_LINK: 'Deploy',
  SURVEY: 'Survey',
  DOCUMENT: 'Document',
};

/**
 * Map evidence status → badge styling
 */
const STATUS_STYLE_MAP = {
  PENDING: {
    bg: 'bg-surface-variant',
    text: 'text-on-surface-variant',
    border: 'border-outline-variant',
    icon: 'schedule',
    label: 'Pending',
  },
  AUTO_CHECKED: {
    bg: 'bg-secondary-container',
    text: 'text-on-secondary-container',
    border: 'border-outline-variant',
    icon: 'robot_2',
    label: 'Auto Checked',
  },
  ACCEPTED: {
    bg: 'bg-[#dcfce7]',
    text: 'text-[#166534]',
    border: 'border-[#bbf7d0]',
    icon: 'check_circle',
    label: 'Accepted',
  },
  REJECTED: {
    bg: 'bg-error-container',
    text: 'text-on-error-container',
    border: 'border-[#fecaca]',
    icon: 'cancel',
    label: 'Rejected',
  },
  NEEDS_CLARIFICATION: {
    bg: 'bg-[#fef7e0]',
    text: 'text-[#b06000]',
    border: 'border-[#fde68a]',
    icon: 'help',
    label: 'Needs Clarification',
  },
};

/**
 * EvidenceCard — Card hiển thị trong Grid View
 * Matches the design from code.html mockup
 */
const EvidenceCard = ({ evidence }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const type = evidence.type || 'DOCUMENT';
  const status = evidence.status || 'PENDING';
  const typeIcon = TYPE_ICON_MAP[type] || 'description';
  const statusStyle = STATUS_STYLE_MAP[status] || STATUS_STYLE_MAP.PENDING;
  const links = evidence.evidenceLinks || [];

  // Determine thumbnail area based on type
  const isImageType = type === 'SCREENSHOT' || type === 'DB_DIAGRAM';
  const isVideoType = type === 'SCREEN_RECORDING';
  const isCodeType = type === 'API_RESPONSE' || type === 'TEST_RESULT';

  const uploaderInitials = evidence.uploadedByName
    ? evidence.uploadedByName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '??';

  const formattedDate = evidence.createdAt
    ? new Date(evidence.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div
      onClick={() => navigate(`/projects/${projectId}/evidence/${evidence.id}`)}
      className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] transition-all duration-200 group cursor-pointer hover:-translate-y-0.5"
    >
      {/* Thumbnail Area */}
      <div className="h-36 relative overflow-hidden border-b border-outline-variant">
        {isImageType && evidence.fileUrl ? (
          <img
            src={evidence.fileUrl}
            alt={evidence.title}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
          />
        ) : isCodeType ? (
          <div className="bg-[#1e1e2e] w-full h-full flex items-center justify-center p-4">
            <pre className="text-[#cdd6f4] font-label-md text-[10px] opacity-70 leading-relaxed overflow-hidden max-h-full">
              {evidence.description || '{ "status": 200, "data": { ... } }'}
            </pre>
          </div>
        ) : (
          <div className="bg-surface-container w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-outline-variant opacity-40 group-hover:opacity-60 transition-opacity">
              {typeIcon}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div
          className={`absolute top-2.5 right-2.5 ${statusStyle.bg} ${statusStyle.text} px-2 py-0.5 rounded-md font-label-md text-label-md flex items-center gap-1 border ${statusStyle.border} shadow-sm backdrop-blur-md bg-opacity-90`}
        >
          <span className="material-symbols-outlined text-[12px]">{statusStyle.icon}</span>
          {statusStyle.label}
        </div>

        {/* Type chip */}
        <div className="absolute bottom-2.5 left-2.5 bg-black/40 text-white px-2 py-0.5 rounded-md font-label-md text-[10px] flex items-center gap-1 backdrop-blur-sm">
          <span className="material-symbols-outlined text-[12px]">{typeIcon}</span>
          {TYPE_LABEL_MAP[type] || type}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* ID */}
        <div className="flex justify-between items-start mb-2">
          <span className="font-label-md text-label-md text-primary bg-primary-fixed/30 px-1.5 py-0.5 rounded-md">
            EV-{String(evidence.id).padStart(3, '0')}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-headline-sm text-[15px] leading-tight text-on-surface mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {evidence.title}
        </h3>

        {/* Description */}
        <p className="font-body-md text-[13px] text-on-surface-variant mb-4 line-clamp-2">
          {evidence.description || 'No description provided.'}
        </p>

        {/* Linked entities */}
        <div className="mt-auto space-y-3">
          {links.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {links.slice(0, 3).map((link, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-surface text-on-surface-variant border border-outline-variant rounded-md font-label-md text-[10px]"
                >
                  {link.entityType?.slice(0, 3).toUpperCase()}-{String(link.entityId).padStart(2, '0')}
                </span>
              ))}
              {links.length > 3 && (
                <span className="px-1.5 py-0.5 text-on-surface-variant font-label-md text-[10px]">
                  +{links.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Footer: uploader + date */}
          <div className="flex items-center justify-between pt-3 border-t border-surface-container">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-md text-[10px]">
                {uploaderInitials}
              </div>
              <span className="font-body-md text-[12px] text-on-surface-variant">
                {evidence.uploadedByName || 'Unknown'}
              </span>
            </div>
            <span className="font-body-md text-[11px] text-outline">{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { TYPE_ICON_MAP, TYPE_LABEL_MAP, STATUS_STYLE_MAP };
export default EvidenceCard;
