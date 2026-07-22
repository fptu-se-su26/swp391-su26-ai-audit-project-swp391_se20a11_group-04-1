import React from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { getInitials } from '@utils/avatarHelper';
import announcementApi from '@api/announcementApi';

export default function AnnouncementDetailModal({ isOpen, onClose, announcement, classroomId }) {
  if (!isOpen || !announcement) return null;

  const handleDownload = async () => {
    try {
      const toastId = toast.loading('Downloading attachment...');
      const response = await announcementApi.downloadAnnouncementAttachment(
        classroomId || announcement.classroomId,
        announcement.id || announcement.originalId
      );
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let fileName = `attachment_${announcement.id}`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const matches = contentDisposition.match(/filename="([^"]+)"/);
        if (matches && matches[1]) {
          fileName = matches[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully', { id: toastId });
    } catch (error) {
      console.error('Download error:', error);
      toast.dismiss();
      toast.error('An error occurred while downloading the file.');
    }
  };

  const senderName = announcement.senderName || 'Mentor';
  const formattedTime = announcement.time || (announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '');

  const hasAttachment = Boolean(announcement.attachmentUrl || announcement.fileName || announcement.hasAttachment || announcement.attachment);

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-[slideUp_0.2s_ease-out] border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">campaign</span>
            </div>
            <h3 className="text-base font-bold text-slate-800">Announcement Details</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-1.5 rounded-xl transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Sender Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-11 h-11 rounded-full bg-[#1E707D] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              {getInitials(senderName)}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{senderName}</p>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {formattedTime}
              </p>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {announcement.title}
            </h2>
          </div>

          {/* Description / Content */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100/80">
            <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed font-normal">
              {announcement.description || announcement.content}
            </p>
          </div>

          {/* Attached Document Section (if any) */}
          {hasAttachment && (
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">attach_file</span>
                Attached Document
              </p>
              <div className="flex items-center justify-between p-3.5 bg-sky-50/60 border border-sky-100 rounded-xl">
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">description</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {announcement.fileName || 'Attachment Document'}
                    </p>
                    <p className="text-[11px] text-slate-500">Click button to download file</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50/80 border-t border-slate-100 flex justify-end">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
