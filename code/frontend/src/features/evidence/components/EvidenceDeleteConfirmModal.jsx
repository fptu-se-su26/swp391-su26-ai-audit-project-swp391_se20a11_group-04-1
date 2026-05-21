import React from 'react';

/**
 * EvidenceDeleteConfirmModal — Modal xác nhận xóa evidence
 */
const EvidenceDeleteConfirmModal = ({ isOpen, evidence, onConfirm, onClose, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[fadeInUp_0.2s_ease-out]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-[22px]">delete_forever</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Delete Evidence</h3>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-on-surface">
              "{evidence?.title || 'this evidence'}"
            </span>
            ? This action cannot be undone. All associated links will also be removed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-low">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg font-body-md text-body-md text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg font-body-md text-body-md bg-error text-on-error hover:bg-error/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Deleting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvidenceDeleteConfirmModal;
