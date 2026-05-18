import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex items-center justify-center p-margin_mobile md:p-margin_desktop relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary-fixed-dim opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-secondary-fixed opacity-30 blur-[120px]"></div>
      </div>

      {/* 404 Card */}
      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden p-stack_lg flex flex-col items-center text-center">
        
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-error-container text-on-error-container mb-stack_lg">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>
            error
          </span>
        </div>

        {/* Headings */}
        <h1 className="font-headline-lg-mobile text-3xl text-on-surface mb-stack_sm">404 - Not Found</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack_lg max-w-sm">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang một địa chỉ khác.
        </p>

        {/* Back Button */}
        <Link
          to="/dashboard"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded bg-primary text-on-primary font-body-md text-body-md font-semibold hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-[44px] items-center"
        >
          Quay lại Trang chủ
        </Link>
      </div>

    </div>
  )
}

export default NotFoundPage
