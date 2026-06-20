import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function CreateAnnouncementModal({ isOpen, onClose, onCreated, isCreating }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and Content are required!');
      return;
    }
    onCreated({ title, content, file });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0284c7]">campaign</span>
            Tạo thông báo mới
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Tiêu đề <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề thông báo..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Nội dung <span className="text-rose-500">*</span>
            </label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nội dung thông báo..."
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Đính kèm tài liệu (Tùy chọn)
            </label>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                disabled={isCreating}
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                {file ? 'Thay đổi file' : 'Chọn file'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                disabled={isCreating}
              />
              {file && (
                <div className="flex items-center gap-2 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg text-sm max-w-[200px]">
                  <span className="truncate">{file.name}</span>
                  <button type="button" onClick={clearFile} className="hover:text-rose-500 transition-colors" disabled={isCreating}>
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Hỗ trợ PDF, DOC, DOCX, ZIP...</p>
          </div>
        </form>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-200 transition-colors"
            disabled={isCreating}
          >
            Hủy
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isCreating || !title.trim() || !content.trim()}
            className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-sky-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang đăng...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                Đăng thông báo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
