import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const RejectUseCaseModal = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason.trim() === '') {
      toast.error('Vui lòng nhập lý do từ chối!');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (error) {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest">
          <h2 className="font-display-sm text-display-sm text-on-surface">Từ chối Use Case</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block font-label-md text-label-md text-on-surface mb-2">
              Lý do từ chối *
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do để thành viên có thể sửa lại..."
              className="w-full h-32 p-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-body-md resize-none transition-all"
            />
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 font-label-lg text-label-lg text-secondary hover:bg-surface-variant rounded-full transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-label-lg text-label-lg bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  Đang xử lý...
                </>
              ) : (
                'Từ chối'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RejectUseCaseModal;
