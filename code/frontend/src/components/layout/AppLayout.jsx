import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

/**
 * AppLayout Component - Bố cục chính cho các trang quản trị được bảo vệ
 * Bao gồm thanh Sidebar điều hướng ở bên trái và vùng hiển thị nội dung động ở bên phải
 */
export function AppLayout() {
  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col md:flex-row relative">
      
      {/* Sidebar điều hướng */}
      <Sidebar />

      {/* Vùng hiển thị nội dung động */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Outlet />
      </div>
      
    </div>
  )
}

export default AppLayout
