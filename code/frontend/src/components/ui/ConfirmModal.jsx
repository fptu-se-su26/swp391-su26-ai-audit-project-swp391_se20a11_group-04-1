import React, { useEffect } from 'react';

const ConfirmModal = ({ 
  isOpen, 
  title = "Confirm", 
  message = "Are you sure you want to perform this action?", 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  onConfirm, 
  onCancel,
  type = "danger", // 'danger', 'warning', 'info', 'merge'
  hideCancel = false
}) => {
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

  const colorConfig = {
    danger: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      icon: 'delete',
      btn: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
    },
    warning: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
      icon: 'warning',
      btn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
    },
    merge: {
      bg: 'bg-indigo-50',
      iconBg: 'bg-indigo-100',
      iconText: 'text-indigo-600',
      icon: 'call_merge',
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
    },
    info: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      icon: 'info',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
    }
  };

  const config = colorConfig[type] || colorConfig.info;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden relative animate-in zoom-in-95 duration-200 p-6"
        role="dialog"
      >
        {/* Decorative background circle */}
        <div className={`absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 ${config.bg} rounded-full opacity-60 pointer-events-none`}></div>
        
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors z-10"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center justify-center pt-2 pb-2">
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center shadow-inner mb-5 relative`}>
             <span className={`material-symbols-outlined text-3xl ${config.iconText}`}>
               {config.icon}
             </span>
             {/* Small ping animation for emphasis on danger/warning */}
             {(type === 'danger' || type === 'warning') && (
               <span className={`absolute inset-0 rounded-full ${config.iconBg} animate-ping opacity-30`}></span>
             )}
          </div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2 text-center relative z-10">
            {title}
          </h3>
          <p className="text-[15px] text-slate-500 leading-relaxed text-center px-1 mb-8 relative z-10">
            {message}
          </p>
          
          {/* Action Buttons */}
          <div className={`flex items-center gap-3 w-full relative z-10 ${hideCancel ? 'justify-center mt-2' : ''}`}>
            {!hideCancel && (
              <button 
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button 
              onClick={onConfirm}
              className={`py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 ${config.btn} ${hideCancel ? 'px-10' : 'flex-1'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
