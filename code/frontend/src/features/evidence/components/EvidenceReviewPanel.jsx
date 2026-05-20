import React, { useState } from 'react';

/**
 * EvidenceReviewPanel — Panel cho Leader/Mentor review evidence
 * Accept / Reject / Needs Clarification with optional comment
 */
const EvidenceReviewPanel = ({ evidence, onReview, isSubmitting }) => {
  const [comment, setComment] = useState('');
  const status = evidence?.status || 'PENDING';

  // Only show review panel for reviewable states
  if (status !== 'PENDING' && status !== 'AUTO_CHECKED') {
    // Show review result if already reviewed
    if (status === 'ACCEPTED' || status === 'REJECTED' || status === 'NEEDS_CLARIFICATION') {
      return (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">verified</span>
            <span className="font-body-md text-body-md text-on-surface font-medium">Review Result</span>
          </div>
          <div className="p-4">
            <div className={`p-4 rounded-xl border ${
              status === 'ACCEPTED' ? 'bg-[#e6f4ea] border-[#bbf7d0]' :
              status === 'REJECTED' ? 'bg-error-container/20 border-[#fecaca]' :
              'bg-[#fef7e0] border-[#fde68a]'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined text-[20px] ${
                  status === 'ACCEPTED' ? 'text-[#137333]' :
                  status === 'REJECTED' ? 'text-error' :
                  'text-[#b06000]'
                }`}>
                  {status === 'ACCEPTED' ? 'check_circle' : status === 'REJECTED' ? 'cancel' : 'help'}
                </span>
                <span className="font-body-md text-body-md font-semibold text-on-surface">
                  {status === 'ACCEPTED' ? 'Evidence Accepted' :
                   status === 'REJECTED' ? 'Evidence Rejected' :
                   'Clarification Needed'}
                </span>
              </div>
              {evidence.reviewedByName && (
                <p className="font-body-md text-[13px] text-on-surface-variant">
                  Reviewed by <span className="font-medium">{evidence.reviewedByName}</span>
                  {evidence.reviewedAt && ` on ${new Date(evidence.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleReview = (newStatus) => {
    if (onReview) {
      onReview(newStatus, comment);
      setComment('');
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">rate_review</span>
        <span className="font-body-md text-body-md text-on-surface font-medium">Review Evidence</span>
        <span className="ml-auto px-2 py-0.5 bg-[#fef7e0] text-[#b06000] rounded-md font-label-md text-[10px] uppercase font-bold">
          Awaiting Review
        </span>
      </div>
      <div className="p-4 space-y-4">
        {/* Comment */}
        <div>
          <label className="block font-body-md text-[13px] text-on-surface-variant mb-1.5">
            Review comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment about this evidence..."
            rows={3}
            className="w-full px-3 py-2.5 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all resize-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleReview('ACCEPTED')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-body-md text-[13px] bg-[#137333] text-white hover:bg-[#0f5a28] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Accept
          </button>
          <button
            onClick={() => handleReview('REJECTED')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-body-md text-[13px] bg-error text-on-error hover:bg-error/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
            Reject
          </button>
          <button
            onClick={() => handleReview('NEEDS_CLARIFICATION')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-body-md text-[13px] bg-[#b06000] text-white hover:bg-[#995200] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            Needs Clarification
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvidenceReviewPanel;
