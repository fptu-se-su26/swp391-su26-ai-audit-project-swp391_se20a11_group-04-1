import React from 'react'
import { Network, ArrowRight, ShieldCheck, FolderTree, Activity } from 'lucide-react'
import SyncButton from './SyncButton'

export const EmptyState = ({ projectId, syncStatus, onSyncSuccess }) => {
  return (
    <div className="w-full flex items-center justify-center p-8 min-h-[500px]">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-8 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400/10 dark:bg-blue-500/5 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full filter blur-3xl" />

        {/* Dynamic Icon Box */}
        <div className="relative w-20 h-20 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-blue-50/30 dark:ring-blue-950/20">
          <Network className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </div>

        {/* Typography */}
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
          Phân Tích Kiến Trúc Hệ Thống
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-8 text-sm leading-relaxed">
          Tự động quyét toàn bộ cấu trúc mã nguồn của bạn để tạo ra một bản đồ tương tác và liên kết trực quan giữa các thành phần.
        </p>

        {/* Feature List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-10 text-left">
          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
              Phát Hiện Dịch Vụ
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Nhận diện tự động Frontend, Backend, Databases, Queue... qua docker-compose.
            </p>
          </div>
          
          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
              <FolderTree className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
              Tổ Chức File & Thư Mục
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Biểu diễn cấu trúc dưới dạng các folder lớn thu gọn, mở rộng linh hoạt.
            </p>
          </div>

          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-3">
              <Activity className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
              Bản Đồ Liên Kết
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Reroute liên kết thông minh dựa trên import và annotation.
            </p>
          </div>
        </div>

        {/* Sync trigger action */}
        <div className="flex flex-col items-center gap-3">
          <SyncButton 
            projectId={projectId} 
            size="lg"
            onSyncSuccess={onSyncSuccess}
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
            ⏱ Thời gian chạy ước tính khoảng 1-3 phút tùy thuộc vào kích thước repo của bạn.
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmptyState
