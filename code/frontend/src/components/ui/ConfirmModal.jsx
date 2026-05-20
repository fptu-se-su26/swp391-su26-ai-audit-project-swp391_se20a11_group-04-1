import React, { useEffect } from 'react';

const ConfirmModal = ({ 
  isOpen, 
  title = "Xác nhận", 
  message = "Bạn có chắc chắn muốn thực hiện hành động này?", 
  confirmText = "Đồng ý", 
  cancelText = "Hủy", 
  onConfirm, 
  onCancel,
  type = "danger" // 'danger', 'warning', 'info'
}) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-surface rounded-xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              type === 'danger' ? 'bg-error-container text-error' :
              type === 'warning' ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
              'bg-primary-container text-primary'
            }`}>
              <span className="material-symbols-outlined text-2xl">
                {type === 'danger' ? 'delete' : type === 'warning' ? 'warning' : 'info'}
              </span>
            </div>
            
            {/* Content */}
            <div className="flex-1 pt-1">
              <h3 className="font-body-lg text-lg font-bold text-on-surface mb-2">{title}</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-surface-container-low px-6 py-4 flex justify-end items-center gap-3 border-t border-outline-variant">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-label-md text-sm uppercase text-secondary hover:bg-surface-container transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-label-md text-sm uppercase transition-colors shadow-sm ${
              type === 'danger' ? 'bg-error text-on-error hover:bg-error/90' :
              type === 'warning' ? 'bg-tertiary text-on-tertiary hover:bg-tertiary/90' :
              'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
