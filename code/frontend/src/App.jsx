import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppRoutes from '@routes/index'

/**
 * App - Component gốc của ứng dụng Frontend
 * Đóng vai trò là Wrapper cung cấp các Providers (Toast, Router) và kết xuất hệ thống định tuyến tập trung.
 */
function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
