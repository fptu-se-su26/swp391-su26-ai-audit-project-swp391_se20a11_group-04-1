import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import useProjectStore from '@store/useProjectStore'

/**
 * AppLayout Component - Bố cục chính chứa thanh Top Header và Sidebar điều hướng động
 */
export function AppLayout() {
  const searchQuery = useProjectStore((state) => state.searchQuery)
  const setSearchQuery = useProjectStore((state) => state.setSearchQuery)

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col relative select-none">
      
      {/* 1. Thanh Top Header cao cấp bao trùm đầu ứng dụng */}
      <header className="h-[64px] border-b border-outline-variant bg-surface-container-lowest px-6 flex items-center justify-between z-30 sticky top-0 shrink-0 shadow-sm">
        
        {/* Logo DevTrack AI phía trái */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-container text-on-primary-container shadow-inner">
            <span className="material-symbols-outlined text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              dataset
            </span>
          </div>
          <span className="text-lg font-bold text-primary tracking-wide">DevTrack AI</span>
        </div>

        {/* Khối tìm kiếm & Tiện ích bên phải */}
        <div className="flex items-center gap-6">
          
          {/* Ô Tìm kiếm dự án */}
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[240px] pl-9 pr-4 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
            />
          </div>

          {/* Biểu tượng thông báo */}
          <button className="relative w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error border border-surface-container-lowest"></span>
          </button>

          {/* Avatar Người Dùng */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-outline-variant">
            <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs shadow-sm">
              AD
            </div>
          </div>

        </div>
      </header>

      {/* 2. Phần nội dung chính nằm dưới Top Header */}
      <div className="flex flex-1 flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Sidebar điều hướng bên trái */}
        <Sidebar />

        {/* Vùng hiển thị nội dung động ở bên phải */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <Outlet />
        </div>
      </div>
      
    </div>
  )
}

export default AppLayout
