import React, { useState, useEffect } from 'react';

const mockAnnouncements = [
  {
    id: 1,
    type: 'success',
    title: 'Nhóm được phân công',
    description: 'Bạn đã được phân vào Nhóm A cho dự án cuối kỳ.',
    time: '2 ngày trước',
    icon: 'check',
  },
  {
    id: 2,
    type: 'info',
    title: 'Lịch học thay đổi',
    description: 'Buổi học ngày 20/06 được dời sang 21/06 lúc 14:00.',
    time: '3 ngày trước',
    icon: 'notifications',
  },
  {
    id: 3,
    type: 'warning',
    title: 'Hạn nộp sắp đến',
    description: 'Bài tập Tuần 3 hết hạn vào 23:59 ngày 22/06/2026.',
    time: 'Hôm nay, 08:00',
    icon: 'error_outline',
  },
  {
    id: 4,
    type: 'info',
    title: 'Thành viên mới tham gia',
    description: 'Bui Thi Lan đã tham gia lớp học với vai trò Instructor.',
    time: 'Hôm qua',
    icon: 'notifications',
  }
];

const typeStyles = {
  success: 'bg-[#10b981]',
  info: 'bg-[#3b82f6]',
  warning: 'bg-[#f59e0b]',
  classroom_info: 'bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#38bdf8]'
};

const iconBgStyles = {
  success: 'bg-white/20',
  info: 'bg-white/20',
  warning: 'bg-white/20',
};

export default function AnnouncementCarousel({ classroomData, onShare }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Combine classroom info as the first slide if provided
  const slides = classroomData 
    ? [{ id: 'classroom_info', type: 'classroom_info' }, ...mockAnnouncements]
    : mockAnnouncements;

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

  return (
    <div 
      className={`relative w-full h-[240px] md:h-[210px] overflow-hidden transition-colors duration-500 ease-in-out ${typeStyles[currentAnnouncement.type]}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        <div className="flex items-center h-full px-8 max-w-7xl mx-auto relative">
          {/* Left Icon */}
          <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 mr-4 md:mr-5 transition-colors duration-500 ${iconBgStyles[currentAnnouncement.type]}`}>
            <span className="material-symbols-outlined text-white text-2xl md:text-3xl">
              {currentAnnouncement.icon}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-4">
            {/* We use key={currentAnnouncement.id} to trigger simple fade animation on content change */}
            <div key={currentAnnouncement.id} className="animate-[fadeIn_0.5s_ease-out]">
              <h3 className="text-white font-bold text-lg md:text-xl leading-tight mb-1 md:mb-2 truncate">
                {currentAnnouncement.title}
              </h3>
              <p className="text-white/90 text-sm md:text-base truncate">
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
