import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '@store/useAuthStore';
import announcementApi from '@api/announcementApi';
import { getInitials } from '@utils/avatarHelper';
import CreateAnnouncementModal from './CreateAnnouncementModal';

export default function AnnouncementTab({ classroomId, classroomData }) {
  const { userId } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Check if current user is owner (Mentor)
  const isOwner = Boolean(classroomData?.owner?.id && userId && String(classroomData.owner.id) === String(userId));

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementApi.getAnnouncements(classroomId, 0, 50);
      setAnnouncements(data.content || []);
    } catch (error) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    const sseUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/v1/classrooms/${classroomId}/announcements/stream`;
    const eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.addEventListener('NEW_ANNOUNCEMENT', (event) => {
      try {
        const newAnnouncement = JSON.parse(event.data);
        setAnnouncements(prev => {
          // Prevent duplicates
          if (prev.some(ann => ann.id === newAnnouncement.id)) return prev;
          return [newAnnouncement, ...prev];
        });
      } catch (e) {
        console.error('Failed to parse SSE message', e);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [classroomId]);

  const handleCreateAnnouncement = async (formData) => {
    try {
      setIsCreating(true);
      await announcementApi.createAnnouncement(classroomId, formData.title, formData.content, formData.file);
      toast.success('Announcement posted successfully!');
      setIsModalOpen(false);
      fetchAnnouncements(); // refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred while posting the announcement');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (announcement) => {
    try {
      const toastId = toast.loading('Downloading file...');
      const response = await announcementApi.downloadAnnouncementAttachment(classroomId, announcement.id);
      
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
      toast.error('An error occurred while downloading the file. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Class Announcements</h2>
          <p className="text-sm text-slate-500 mt-1">Important announcements from instructor/mentor</p>
        </div>
        {isOwner && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm shadow-sky-900/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Post announcement
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-sky-100">
            <span className="material-symbols-outlined text-3xl text-sky-400">campaign</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No announcements yet</h3>
          <p className="text-sm text-slate-500">New announcements from Mentor will be displayed here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(
            announcements.reduce((groups, ann) => {
              const date = new Date(ann.createdAt).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              });
              if (!groups[date]) groups[date] = [];
              groups[date].push(ann);
              return groups;
            }, {})
          ).map(([dateLabel, groupAnns]) => (
            <div key={dateLabel} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pl-3 border-l-4 border-sky-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                {dateLabel}
              </h3>
              <div className="space-y-4">
                {groupAnns.map((ann) => (
                  <div key={ann.id} className="bg-white border border-slate-200 rounded-[20px] shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#1E707D] text-white flex items-center justify-center text-lg font-extrabold shadow-sm shrink-0">
                        {getInitials(ann.senderName || 'Mentor')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h4 className="font-bold text-slate-800 text-lg leading-tight">{ann.title}</h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {ann.senderName} • {new Date(ann.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                          {ann.content}
                        </div>
                        {ann.attachmentUrl && (
                          <div className="mt-4">
                            <button 
                              onClick={() => handleDownload(ann)}
                              className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px] text-rose-500">picture_as_pdf</span>
                              View attached document
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAnnouncementModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreateAnnouncement}
        isCreating={isCreating}
      />
    </div>
  );
}
