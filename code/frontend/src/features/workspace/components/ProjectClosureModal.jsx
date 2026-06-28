import { useState } from 'react'
import axiosInstance from '@/api/axiosConfig'
import toast from 'react-hot-toast'

const STEPS = ['Kiểm tra', 'Xử lý task', 'Lý do', 'Xác nhận']

export default function ProjectClosureModal({ projectId, projectTitle, onClose, onClosed }) {
  const [step, setStep] = useState(0)
  const [checkData, setCheckData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState('CANCEL_ALL')
  const [targetProjectId, setTargetProjectId] = useState('')
  const [reason, setReason] = useState('')

  // Bước 0: load thống kê
  const loadCheck = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get(`/v1/projects/${projectId}/closure-check`)
      setCheckData(res.data?.data)
      setStep(1)
    } catch {
      toast.error('Không thể kiểm tra trạng thái project.')
    } finally {
      setLoading(false)
    }
  }

  // Bước cuối: thực thi đóng
  const handleClose = async () => {
    if (reason.trim().length < 10) {
      toast.error('Lý do phải ít nhất 10 ký tự.')
      return
    }
    setLoading(true)
    try {
      await axiosInstance.post(`/v1/projects/${projectId}/close`, {
        reason: reason.trim(),
        unfinishedTaskAction: action,
        targetProjectId: action === 'MOVE_TO_PROJECT' && targetProjectId ? Number(targetProjectId) : null,
      })
      toast.success('Project đã được đóng thành công!')
      onClosed()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đóng project thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/40 bg-red-50/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-xl">lock</span>
            <h3 className="font-extrabold text-base text-on-surface">Đóng Project</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4 gap-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${i < step ? 'bg-green-500 border-green-500 text-white'
                  : i === step ? 'bg-[#1E707D] border-[#1E707D] text-white'
                  : 'bg-surface-container border-outline-variant text-on-surface-variant'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-semibold ${i === step ? 'text-[#1E707D]' : 'text-on-surface-variant'}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">

          {/* Step 0: intro */}
          {step === 0 && (
            <div className="space-y-3 text-sm text-on-surface-variant">
              <p>Bạn sắp đóng project <strong className="text-on-surface">"{projectTitle}"</strong>.</p>
              <ul className="space-y-1 list-disc list-inside text-xs">
                <li>Mọi task còn mở sẽ được hủy hoặc chuyển project khác.</li>
                <li>Bug chưa xử lý sẽ tự động đóng.</li>
                <li>Sprint đang chạy sẽ được kết thúc.</li>
                <li>Project chuyển sang trạng thái <strong>ARCHIVED</strong> — chỉ đọc.</li>
                <li>Bạn vẫn có thể mở lại project sau này nếu cần.</li>
              </ul>
              <button
                onClick={loadCheck}
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl bg-[#1E707D] text-white font-bold text-sm hover:bg-[#175f6a] transition-all disabled:opacity-50"
              >
                {loading ? 'Đang kiểm tra...' : 'Kiểm tra hạng mục chưa hoàn thành'}
              </button>
            </div>
          )}

          {/* Step 1: thống kê */}
          {step === 1 && checkData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Task còn mở', value: checkData.openTaskCount, color: checkData.openTaskCount > 0 ? 'text-red-600' : 'text-green-600' },
                  { label: 'Bug còn mở', value: checkData.openBugCount, color: checkData.openBugCount > 0 ? 'text-orange-500' : 'text-green-600' },
                  { label: 'Sprint đang chạy', value: checkData.activeSprintCount, color: checkData.activeSprintCount > 0 ? 'text-amber-600' : 'text-green-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-3 rounded-xl bg-surface-container border border-outline-variant/40">
                    <div className={`text-2xl font-black ${color}`}>{value}</div>
                    <div className="text-[10px] text-on-surface-variant font-semibold mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {checkData.openTasks?.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-xl border border-outline-variant/40 divide-y divide-outline-variant/20">
                  {checkData.openTasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 text-xs">
                      <span className="font-medium text-on-surface truncate max-w-[220px]">{t.taskCode} — {t.title}</span>
                      <span className="shrink-0 ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container text-on-surface-variant">{t.status}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => setStep(2)} className="w-full py-2.5 rounded-xl bg-[#1E707D] text-white font-bold text-sm hover:bg-[#175f6a] transition-all">
                Tiếp tục
              </button>
            </div>
          )}

          {/* Step 2: xử lý task */}
          {step === 2 && (
            <div className="space-y-4 text-sm">
              <p className="text-on-surface-variant">Chọn cách xử lý <strong>{checkData?.openTaskCount || 0}</strong> task chưa hoàn thành:</p>
              <div className="space-y-2">
                {[
                  { value: 'CANCEL_ALL', label: 'Đánh dấu Cancelled', desc: 'Task sẽ bị hủy và lưu lại lịch sử.' },
                  { value: 'MOVE_TO_PROJECT', label: 'Chuyển sang project khác', desc: 'Task sẽ chuyển sang project bạn chọn.' },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${action === opt.value ? 'border-[#1E707D] bg-[#1E707D]/5' : 'border-outline-variant/40 hover:border-[#1E707D]/40'}`}>
                    <input type="radio" name="action" value={opt.value} checked={action === opt.value} onChange={() => setAction(opt.value)} className="mt-0.5 accent-[#1E707D]" />
                    <div>
                      <div className="font-bold text-on-surface text-xs">{opt.label}</div>
                      <div className="text-[11px] text-on-surface-variant">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {action === 'MOVE_TO_PROJECT' && (
                <input
                  type="number"
                  placeholder="Nhập ID project đích"
                  value={targetProjectId}
                  onChange={e => setTargetProjectId(e.target.value)}
                  className="w-full border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm bg-surface-container-lowest focus:outline-none focus:border-[#1E707D]"
                />
              )}

              <button onClick={() => setStep(3)} className="w-full py-2.5 rounded-xl bg-[#1E707D] text-white font-bold text-sm hover:bg-[#175f6a] transition-all">
                Tiếp tục
              </button>
            </div>
          )}

          {/* Step 3: lý do + xác nhận */}
          {step === 3 && (
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                  Lý do đóng project <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Ví dụ: Dự án đã hoàn thành tất cả mục tiêu và được Giảng viên nghiệm thu..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm bg-surface-container-lowest resize-none focus:outline-none focus:border-[#1E707D]"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">{reason.length}/1000 ký tự (tối thiểu 10)</p>
              </div>

              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
                <p className="font-bold">Xác nhận thao tác:</p>
                <p>• {checkData?.openTaskCount || 0} task sẽ bị <strong>{action === 'CANCEL_ALL' ? 'Cancelled' : 'chuyển project'}</strong></p>
                <p>• {checkData?.openBugCount || 0} bug sẽ bị đóng tự động</p>
                <p>• Project chuyển sang <strong>ARCHIVED</strong> (chỉ đọc)</p>
              </div>

              <button
                onClick={handleClose}
                disabled={loading || reason.trim().length < 10}
                className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Đang đóng...' : 'Xác nhận đóng project'}
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step > 0 && (
          <div className="px-6 pb-4">
            <button onClick={() => setStep(s => s - 1)} className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
              ← Quay lại
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
