import React, { useState, useEffect } from 'react';
import announcementApi from '@api/announcementApi';
import { resourceApi } from '@api/resourceApi';

const typeStyles = {
  success: 'bg-gradient-to-r from-[#059669] via-[#10b981] to-[#34d399]',
  info: 'bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#8b5cf6]',
  warning: 'bg-gradient-to-r from-[#ea580c] via-[#f59e0b] to-[#fbbf24]',
  classroom_info: 'bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#38bdf8]'
};

const iconBgStyles = {
  success: 'bg-white/20 backdrop-blur-md border border-white/20',
  info: 'bg-white/20 backdrop-blur-md border border-white/20',
  warning: 'bg-white/20 backdrop-blur-md border border-white/20',
};

export default function AnnouncementCarousel({ classroomData, onShare, onAnnouncementClick, onResourceClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [realSlides, setRealSlides] = useState([]);

  const fetchCarouselData = async () => {
    if (!classroomData?.id) return;
    try {
      const [annData, resData] = await Promise.allSettled([
        announcementApi.getAnnouncements(classroomData.id, 0, 10),
        resourceApi.getClassroomResources(classroomData.id)
      ]);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const items = [];

      // Format Announcements
      if (annData.status === 'fulfilled' && annData.value?.content) {
        const recentAnns = annData.value.content.filter(ann => new Date(ann.createdAt) >= sevenDaysAgo);
        recentAnns.forEach(ann => {
          items.push({
            id: `ann_${ann.id}`,
            originalId: ann.id,
            isResource: false,
            createdAt: new Date(ann.createdAt),
            headerText: `MENTOR ANNOUNCEMENT ${ann.senderName ? `- ${ann.senderName}` : ''}`,
            title: ann.title,
            description: ann.content,
            time: new Date(ann.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            icon: 'campaign'
          });
        });
      }

      // Format Resources
      if (resData.status === 'fulfilled' && Array.isArray(resData.value?.data?.data)) {
        const resources = resData.value.data.data;
        const recentRes = resources.filter(res => new Date(res.createdAt) >= sevenDaysAgo);
        recentRes.forEach(res => {
          items.push({
            id: `res_${res.id}`,
            originalId: res.id,
            isResource: true,
            resourceData: res,
            createdAt: new Date(res.createdAt),
            headerText: `NEW CLASS RESOURCE ${res.uploadedByName ? `- ${res.uploadedByName}` : ''}`,
            title: res.name,
            description: res.type === 'FILE' ? `Document file added to class resources` : `Web Link: ${res.url}`,
            time: new Date(res.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            icon: res.type === 'FILE' ? 'description' : 'link'
          });
        });
      }

      // Sort combined list by newest first
      items.sort((a, b) => b.createdAt - a.createdAt);

      // Assign type colors alternately for visual variety
      const types = ['info', 'warning', 'success'];
      const formattedSlides = items.map((item, index) => ({
        ...item,
        type: types[index % types.length]
      }));

      setRealSlides(formattedSlides);
    } catch (err) {
      console.error("Failed to load carousel data:", err);
    }
  };

  useEffect(() => {
    if (!classroomData?.id) return;

    fetchCarouselData();

    const handleRefresh = () => {
      fetchCarouselData();
    };

    window.addEventListener('NEW_ANNOUNCEMENT_CREATED', handleRefresh);
    window.addEventListener('NEW_RESOURCE_CREATED', handleRefresh);

    // Mở kết nối SSE trực tiếp cho Banner xoay (chạy trên mọi tab của Classroom)
    const sseUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/v1/classrooms/${classroomData.id}/announcements/stream`;
    const eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.addEventListener('NEW_ANNOUNCEMENT', () => {
      fetchCarouselData();
    });

    return () => {
      window.removeEventListener('NEW_ANNOUNCEMENT_CREATED', handleRefresh);
      window.removeEventListener('NEW_RESOURCE_CREATED', handleRefresh);
      eventSource.close();
    };
  }, [classroomData?.id]);

  // Combine classroom info as the first slide if provided
  const slides = classroomData 
    ? [{ id: 'classroom_info', type: 'classroom_info' }, ...realSlides]
    : realSlides;

  useEffect(() => {
    if (isHovered || !isVisible || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, isVisible, slides.length]);

  if (!isVisible || slides.length === 0) return null;

  const currentAnnouncement = slides[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleSlideContentClick = () => {
    if (currentAnnouncement.type === 'classroom_info') return;

    if (currentAnnouncement.isResource) {
      if (onResourceClick) {
        onResourceClick(currentAnnouncement.resourceData, false); // false = do not download, just switch tab
      }
    } else {
      if (onAnnouncementClick) {
        onAnnouncementClick(currentAnnouncement);
      }
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (currentAnnouncement.type === 'classroom_info') return;

    if (currentAnnouncement.isResource) {
      if (onResourceClick) {
        onResourceClick(currentAnnouncement.resourceData, true); // true = trigger download / open link!
      }
    } else {
      if (onAnnouncementClick) {
        onAnnouncementClick(currentAnnouncement);
      }
    }
  };

  return (
    <div 
      className={`relative w-full h-[240px] md:h-[210px] overflow-hidden transition-colors duration-500 ease-in-out ${typeStyles[currentAnnouncement.type]}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {currentAnnouncement.type === 'classroom_info' ? (
        <div key="classroom_info" className="relative animate-[fadeIn_0.5s_ease-out] px-5 md:px-6 h-full max-w-7xl mx-auto flex flex-col md:flex-row justify-center md:justify-between items-start md:items-center gap-4 md:gap-6">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="relative z-10 space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                ACTIVE SEMESTER
              </span>
              <span className="text-sm font-semibold text-white/90 bg-white/20 px-3 py-0.5 rounded-full backdrop-blur-sm">
                {classroomData.semester}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-3 truncate">
              {classroomData.subject}
            </h1>
            <div className="flex items-center gap-4 md:gap-8 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white/80 text-xs md:text-sm">person</span>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-medium text-sky-200 uppercase tracking-wide">Mentor</p>
                  <p className="text-xs md:text-sm font-medium text-white">{classroomData.owner?.fullName || classroomData.owner?.email}</p>
                </div>
              </div>
              <div className="w-px h-6 md:h-8 bg-white/20"></div>
              <div>
                <p className="text-[10px] md:text-[11px] font-medium text-sky-200 uppercase tracking-wide">Project Teams</p>
                <p className="text-xs md:text-sm font-medium text-white">{classroomData.stats.teams} Teams</p>
              </div>
              <div className="w-px h-6 md:h-8 bg-white/20"></div>
              <div>
                <p className="text-[10px] md:text-[11px] font-medium text-sky-200 uppercase tracking-wide">Students</p>
                <p className="text-xs md:text-sm font-medium text-white">{classroomData.stats.students} Enrolled</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center md:pr-10 mt-2 md:mt-0">
            <button onClick={onShare} className="bg-white text-[#0284c7] hover:bg-sky-50 px-4 py-2 md:px-5 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all shadow-xl shadow-sky-900/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-base md:text-lg">link</span>
              Share Invite Link
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center h-full px-5 md:px-6 max-w-7xl mx-auto relative group">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          {/* Left Icon */}
          <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 mr-4 md:mr-6 transition-all duration-500 shadow-xl shadow-black/10 group-hover:scale-110 ${iconBgStyles[currentAnnouncement.type]}`}>
            <span className="material-symbols-outlined text-white text-2xl md:text-3xl">
              {currentAnnouncement.icon}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-4 z-10 relative">
            {/* We use key={currentAnnouncement.id} to trigger simple fade animation on content change */}
            <div key={currentAnnouncement.id} className="animate-[fadeIn_0.5s_ease-out]">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/25 mb-2.5 shadow-sm -ml-2">
                <span className="text-sm md:text-base font-black text-white uppercase tracking-[0.10em]">
                  {currentAnnouncement.headerText || 'MENTOR ANNOUNCEMENT'}
                </span>
              </div>
              <h3 className="text-white font-bold text-xl md:text-2xl leading-tight mb-1.5 md:mb-2 truncate">
                {currentAnnouncement.title}
              </h3>
              <p className="text-white/90 text-base md:text-lg truncate">
                {currentAnnouncement.description}
              </p>
            </div>
          </div>

          {/* Right Action Button & Timestamp */}
          <div className="flex flex-col items-end justify-center h-full shrink-0 md:pr-10 gap-2.5 z-10 relative">
            {currentAnnouncement.isResource ? (
              <button 
                type="button"
                onClick={handleButtonClick}
                className="bg-white text-[#0284c7] hover:bg-sky-50 px-4 py-2 md:px-5 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all duration-300 shadow-xl shadow-sky-900/20 flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base md:text-lg">
                  {currentAnnouncement.resourceData?.type === 'FILE' ? 'download' : 'open_in_new'}
                </span>
                {currentAnnouncement.resourceData?.type === 'FILE' ? 'Download Resource' : 'Open Link'}
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleButtonClick}
                className="bg-white/20 hover:bg-white/35 text-white backdrop-blur-md border border-white/30 px-4 py-2 md:px-5 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all duration-300 shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base md:text-lg">visibility</span>
                View Announcement
              </button>
            )}
            <span className="text-white/80 text-xs md:text-sm font-medium">
              {currentAnnouncement.time}
            </span>
          </div>
        </div>
      )}

      {/* Inject custom keyframe for fade in */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
