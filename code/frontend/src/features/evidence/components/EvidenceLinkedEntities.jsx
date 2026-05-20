import React from 'react';

/**
 * Map entity type → icon + color
 */
const ENTITY_CONFIG = {
  REQUIREMENT: { icon: 'description', label: 'Requirement', prefix: 'REQ', color: 'text-primary', bg: 'bg-primary-fixed/20' },
  TASK: { icon: 'assignment', label: 'Task', prefix: 'TASK', color: 'text-[#7c3aed]', bg: 'bg-[#ede9fe]' },
  TEST_CASE: { icon: 'checklist_rtl', label: 'Test Case', prefix: 'TC', color: 'text-[#0891b2]', bg: 'bg-[#ecfeff]' },
  BUG_REPORT: { icon: 'bug_report', label: 'Bug Report', prefix: 'BUG', color: 'text-error', bg: 'bg-error-container/30' },
  SPRINT: { icon: 'history_toggle_off', label: 'Sprint', prefix: 'SPR', color: 'text-[#b06000]', bg: 'bg-[#fef7e0]' },
};

/**
 * EvidenceLinkedEntities — Hiển thị danh sách entity liên kết với evidence
 */
const EvidenceLinkedEntities = ({ links = [], onUnlink }) => {
  if (links.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">link</span>
          <span className="font-body-md text-body-md text-on-surface font-medium">Linked Entities</span>
          <span className="ml-auto font-label-md text-label-md text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">0</span>
        </div>
        <div className="p-6 flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[36px] text-outline-variant">link_off</span>
          <p className="font-body-md text-[13px] text-on-surface-variant">
            No entities linked to this evidence yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">link</span>
        <span className="font-body-md text-body-md text-on-surface font-medium">Linked Entities</span>
        <span className="ml-auto font-label-md text-label-md text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
          {links.length}
        </span>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {links.map((link, idx) => {
            const config = ENTITY_CONFIG[link.entityType] || ENTITY_CONFIG.REQUIREMENT;
            const linkedAt = link.linkedAt
              ? new Date(link.linkedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '';

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-[18px] ${config.color}`}>{config.icon}</span>
                  </div>
                  <div>
                    <span className={`font-label-md text-label-md ${config.color} font-bold`}>
                      {config.prefix}-{String(link.entityId).padStart(2, '0')}
                    </span>
                    <p className="font-body-md text-[12px] text-on-surface-variant">{config.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {linkedAt && (
                    <span className="font-body-md text-[11px] text-outline">{linkedAt}</span>
                  )}
                  {onUnlink && (
                    <button
                      onClick={() => onUnlink(link.id || idx)}
                      className="p-1 rounded-lg hover:bg-error-container/30 text-on-surface-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove link"
                    >
                      <span className="material-symbols-outlined text-[18px]">link_off</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EvidenceLinkedEntities;
