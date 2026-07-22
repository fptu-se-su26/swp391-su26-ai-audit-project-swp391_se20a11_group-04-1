import React, { useState, useEffect } from 'react';
import announcementApi from '@api/announcementApi';

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

export default function AnnouncementCarousel({ classroomData, onShare, onAnnouncementClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [realAnnouncements, setRealAnnouncements] = useState([]);

  const fetchCarouselAnnouncements = () => {
    if (classroomData?.id) {
      announcementApi.getAnnouncements(classroomData.id, 0, 10)
        .then(data => {
          if (data && data.content) {
            // Lọc ra các thông báo trong 7 ngày gần nhất
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const recentAnnouncements = data.content.filter(ann => {
              const annDate = new Date(ann.createdAt);
              return annDate >= sevenDaysAgo;
            });

            const formattedAnns = recentAnnouncements.map((ann, index) => {
              // Alternate colors based on index for visual variety, but keep icon uniform
              const types = ['info', 'warning', 'success'];
              return {
                id: ann.id,
                type: types[index % types.length],
                title: ann.title,
                description: ann.content,
                senderName: ann.senderName,
                time: new Date(ann.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                icon: 'campaign'
              };
            });
            setRealAnnouncements(formattedAnns);
          }
        })
        .catch(err => console.error("Failed to load announcements for carousel:", err));
    }
  };

  useEffect(() => {
    if (!classroomData?.id) return;

    fetchCarouselAnnouncements();

    const handleRefresh = () => {
      fetchCarouselAnnouncements();
    };

    window.addEventListener('NEW_ANNOUNCEMENT_CREATED', handleRefresh);

    // Mở kết nối SSE trực tiếp cho Banner xoay (chạy trên mọi tab của Classroom)
    const sseUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/v1/classrooms/${classroomData.id}/announcements/stream`;
    const eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.addEventListener('NEW_ANNOUNCEMENT', () => {
      fetchCarouselAnnouncements();
    });

    return () => {
      window.removeEventListener('NEW_ANNOUNCEMENT_CREATED', handleRefresh);
      eventSource.close();
    };
  }, [classroomData?.id]);

  // Combine classroom info as the first slide if provided
  const slides = classroomData 
    ? [{ id: 'classroom_info', type: 'classroom_info' }, ...realAnnouncements]
    : realAnnouncements;

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

  const handleBannerClick = () => {
    if (currentAnnouncement.type !== 'classroom_info' && onAnnouncementClick) {
      onAnnouncementClick(currentAnnouncement.id);
    }
  };

  return (
    <div 
      className={`relative w-full h-[240px] md:h-[210px] overflow-hidden transition-colors duration-500 ease-in-out ${typeStyles[currentAnnouncement.type]} ${currentAnnouncement.type !== 'classroom_info' ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleBannerClick}
    >
      {currentAnnouncement.type === 'classroom_info' ? (
        <div key="classroom_info" className="relative animate-[fadeIn_0.5s_ease-out] px-8 h-full max-w-7xl mx-auto flex flex-col md:flex-row justify-center md:justify-between items-start md:items-center gap-4 md:gap-6">
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
        <div className="flex items-center h-full px-8 max-w-7xl mx-auto relative group">
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
              <p className="text-[10px] md:text-[11px] font-extrabold text-white/80 uppercase tracking-[0.15em] mb-1.5 md:mb-2">
                MENTOR ANNOUNCEMENT {currentAnnouncement.senderName ? ` - ${currentAnnouncement.senderName}` : ''}
              </p>
              <h3 className="text-white font-bold text-xl md:text-2xl leading-tight mb-1.5 md:mb-2 truncate">
                {currentAnnouncement.title}
              </h3>
              <p className="text-white/90 text-base md:text-lg truncate">
                {currentAnnouncement.description}
              </p>
            </div>
          </div>

          {/* Right Timestamp */}
          <div className="flex flex-col items-end justify-center h-full shrink-0 md:pr-10">
            <div className="flex items-center gap-3">
              <span className="text-white/80 text-xs md:text-sm">
                {currentAnnouncement.time}
              </span>
            </div>
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
