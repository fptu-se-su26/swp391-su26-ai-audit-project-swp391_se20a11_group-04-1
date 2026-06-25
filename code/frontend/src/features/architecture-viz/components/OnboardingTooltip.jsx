import React, { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'

export default function OnboardingTooltip() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isDismissed = localStorage.getItem('devtrack:arch:onboarding_dismissed')
    if (!isDismissed) {
      setVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('devtrack:arch:onboarding_dismissed', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-[280px] bg-slate-900 text-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-800 shadow-2xl z-[9999] font-sans">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Mẹo khám phá sơ đồ</span>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <ul className="text-[10px] text-slate-350 space-y-1.5 list-disc pl-3.5 font-medium leading-relaxed">
        <li>Nhấp đúp vào bất kỳ <strong>dịch vụ</strong> nào để xem cấu trúc thư mục chi tiết.</li>
        <li>Trong sơ đồ chi tiết, nhấp vào <strong>thư mục</strong> để mở rộng các file bên trong.</li>
        <li>Bấm chọn bất kỳ <strong>file</strong> nào để xem chi tiết đường dẫn và quan hệ import.</li>
      </ul>
    </div>
  )
}
