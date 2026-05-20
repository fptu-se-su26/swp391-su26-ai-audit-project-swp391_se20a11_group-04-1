import React from 'react';

const EVIDENCE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'SCREENSHOT', label: 'Screenshot' },
  { value: 'SCREEN_RECORDING', label: 'Screen Recording' },
  { value: 'GITHUB_COMMIT', label: 'GitHub Commit' },
  { value: 'API_RESPONSE', label: 'API Response' },
  { value: 'FIGMA_LINK', label: 'Figma Link' },
  { value: 'TEST_RESULT', label: 'Test Result' },
  { value: 'DB_DIAGRAM', label: 'DB Diagram' },
  { value: 'DEPLOY_LINK', label: 'Deploy Link' },
  { value: 'SURVEY', label: 'Survey / Feedback' },
  { value: 'DOCUMENT', label: 'Document' },
];

const EVIDENCE_STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'AUTO_CHECKED', label: 'Auto Checked' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'NEEDS_CLARIFICATION', label: 'Needs Clarification' },
];

/**
 * EvidenceToolbar — Search + filter cho danh sách Evidence
 */
const EvidenceToolbar = ({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3 border-b border-outline-variant bg-surface-container-lowest">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
          search
        </span>
        <input
          type="text"
          placeholder="Search evidence by title, ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant transition-all"
        />
      </div>

      {/* Type Filter */}
      <select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value)}
        className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer min-w-[150px]"
      >
        {EVIDENCE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer min-w-[150px]"
      >
        {EVIDENCE_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export { EVIDENCE_TYPES, EVIDENCE_STATUSES };
export default EvidenceToolbar;
