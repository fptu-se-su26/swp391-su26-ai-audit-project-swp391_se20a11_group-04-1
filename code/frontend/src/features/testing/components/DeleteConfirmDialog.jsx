/**
 * DeleteConfirmDialog — Confirm deletion action
 */
export default function DeleteConfirmDialog({ isOpen, title, message, onConfirm, onCancel, isDeleting }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-[#00000080] z-[60] flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">
            {title || 'Confirm Deletion'}
          </h2>
          <p className="text-secondary text-sm">
            {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
          </p>
        </div>
        
        <div className="px-6 py-4 flex justify-end gap-3 bg-surface-container-low rounded-b-lg">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-secondary hover:bg-surface-container-highest rounded font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-error text-on-error hover:bg-[#93000a] rounded font-medium transition-colors shadow flex items-center gap-2"
          >
            {isDeleting && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
