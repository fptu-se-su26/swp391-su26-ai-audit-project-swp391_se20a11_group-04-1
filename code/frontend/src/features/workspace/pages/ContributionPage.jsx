import { useState } from 'react'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import { getInitials } from '@utils/avatarHelper'

/**
 * ContributionPage - Quản lý thành viên & Phân quyền Mentor
 * Cho phép xem danh sách thành viên, mời thành viên bằng email và phong cấp Mentor.
 */
export function ContributionPage() {
  const { activeProject, inviteProjectMember, changeProjectMemberRole, removeProjectMember, changeProjectLeader, loading, error } = useProjectStore()
  
  // Trạng thái Form & Modal
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState(null)

  // Kiểm tra xem dự án có đang active hay không
  if (!activeProject) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 shadow-lg space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#1E707D] animate-bounce">folder_open</span>
          <h3 className="font-extrabold text-xl text-on-surface">Chưa chọn dự án</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Vui lòng quay lại Dashboard và chọn một dự án cụ thể để quản lý đóng góp và thành viên nhóm.
          </p>
        </div>
      </main>
    )
  }
  const currentRole = activeProject?.role?.toUpperCase()?.replace(/\s+/g, '_') || ''
  const isLeader = ['PROJECT_LEADER', 'LEADER', 'MENTOR'].includes(currentRole)

  // Xử lý gửi lời mời thành viên
  const handleInviteSubmit = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      toast.error('Vui lòng nhập địa chỉ email!')
      return
    }
    
    // Kiểm tra định dạng email cơ bản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail.trim())) {
      toast.error('Định dạng email không hợp lệ!')
      return
    }

    const success = await inviteProjectMember(inviteEmail.trim())
    if (success) {
      toast.success('Đã gửi lời mời tham gia dự án thành công! Vui lòng chờ người dùng xác nhận.')
      setInviteEmail('')
      setIsInviteModalOpen(false)
    } else {
      // Dùng useProjectStore state error hoặc thông báo lỗi mặc định
      toast.error(useProjectStore.getState().error || 'Mời thành viên thất bại!')
    }
  }

  // Xử lý mở Modal xác nhận xóa thành viên
  const handleRemoveClick = (member) => {
    setSelectedMember(member)
    setIsRemoveModalOpen(true)
  }

  // Xử lý xác nhận xóa thành viên
  const handleConfirmRemove = async () => {
    if (!selectedMember) return

    const success = await removeProjectMember(selectedMember.id)
    if (success) {
      toast.success(`Đã xóa thành viên ${selectedMember.name} khỏi dự án!`)
      setIsRemoveModalOpen(false)
      setSelectedMember(null)
    } else {
      toast.error(useProjectStore.getState().error || 'Xóa thành viên thất bại!')
    }
  }

  const handleTransferClick = (member) => {
    setTransferTarget(member)
    setIsTransferModalOpen(true)
  }

  const handleConfirmTransfer = async () => {
    if (!transferTarget) return
    const success = await changeProjectLeader(transferTarget.id)
    if (success) {
      toast.success(`Đã chuyển quyền Leader cho ${transferTarget.name}`)
      setIsTransferModalOpen(false)
      setTransferTarget(null)
    } else {
      toast.error(useProjectStore.getState().error || 'Chuyển quyền thất bại!')
    }
  }

  // Mảng thành viên
  const members = activeProject.members || []

  // Nhãn hiển thị cho vai trò dự án
  const getRoleBadge = (role) => {
    switch (role) {
      case 'PROJECT_LEADER':
      case 'LEADER':
      case 'Project Leader':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#1E707D]/10 text-[#1E707D] border border-[#1E707D]/20 text-xs font-bold uppercase tracking-wide rounded-full">
            <span className="material-symbols-outlined text-[14px]">shield_person</span>
            Project Leader
          </span>
        )
      case 'MENTOR':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/20 text-xs font-bold uppercase tracking-wide rounded-full">
            <span className="material-symbols-outlined text-[14px]">school</span>
            Mentor
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container text-on-surface-variant border border-outline-variant/60 text-xs font-bold uppercase tracking-wide rounded-full">
            <span className="material-symbols-outlined text-[14px]">person</span>
            Member
          </span>
        )
    }
  }

  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-[#D7EEF1] opacity-[0.08] blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-secondary-fixed opacity-[0.1] blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full space-y-8 animate-fade-in">
        {/* Banner tiêu đề trang */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/10 text-white text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-md uppercase">
                {activeProject.major} • {activeProject.semester}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl">groups</span>
              Workspace Contribution
            </h1>
            <p className="text-white/80 text-sm font-medium">
              Quản lý các thành viên dự án, phân công đóng góp và thiết lập vai trò cố vấn (Mentor).
            </p>
          </div>

          {isLeader && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 bg-white text-[#1E707D] px-5 py-2.5 rounded-xl font-black text-sm hover:bg-[#BFDEEA] hover:scale-105 transition-all shadow-md shrink-0"
            >
              <span className="material-symbols-outlined text-lg font-bold">person_add</span>
              Mời thành viên
            </button>
          )}
        </div>

        {/* Nội dung chính: Danh sách thành viên */}
        <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-outline-variant/60 pb-4">
            <div>
              <h3 className="font-extrabold text-lg text-on-surface flex items-center gap-2">
                Danh sách thành viên
                <span className="bg-[#1E707D]/10 text-[#1E707D] text-xs px-2 py-0.5 rounded-full font-bold">
                  {members.length}
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Danh sách người đóng góp thực tế trong không gian làm việc.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Thành viên</th>
                  <th className="px-6 py-4">Vai trò hiện tại</th>
                  {isLeader && <th className="px-6 py-4 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-container-low/20 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm shrink-0 select-none transition-transform group-hover:scale-105 ${member.bg || 'bg-secondary text-on-secondary'}`}>
                          {member.initials || getInitials(member.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-on-surface truncate leading-snug">{member.name}</p>
                          <p className="text-[11px] text-on-surface-variant truncate mt-0.5">Joined and active</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {getRoleBadge(member.role)}
                    </td>
                    {isLeader && (
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {member.role?.toUpperCase() !== 'PROJECT_LEADER' && member.role?.toUpperCase() !== 'LEADER' && member.role?.toUpperCase() !== 'MENTOR' ? (
                            <>
                              <button
                                onClick={() => handleTransferClick(member)}
                                className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 text-[11px] font-bold px-2 py-1 rounded-lg border border-amber-500/25 hover:bg-amber-500/25 hover:scale-105 transition-all shadow-sm"
                                title="Chuyển quyền Leader"
                              >
                                <span className="material-symbols-outlined text-[14px] font-bold">swap_horiz</span>
                                Chuyển Leader
                              </button>
                              <button
                                onClick={() => handleRemoveClick(member)}
                                className="inline-flex items-center gap-1 bg-error/15 text-error text-[11px] font-bold px-2 py-1 rounded-lg border border-error/25 hover:bg-error/25 hover:scale-105 transition-all shadow-sm"
                                title="Xóa thành viên khỏi dự án"
                              >
                                <span className="material-symbols-outlined text-[14px] font-bold">person_remove</span>
                                Xóa
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-outline font-medium italic select-none">Không có thao tác</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 1. MODAL: MỜI THÀNH VIÊN MỚI */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative animate-scale-up">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1E707D]">person_add</span>
                Mời thành viên mới
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Nhập địa chỉ email của thành viên bạn muốn mời tham gia dự án. Hệ thống sẽ gửi một thông báo và email để người này xác nhận tham gia.
              </p>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant">Địa chỉ Email</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-outline text-lg">mail</span>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="example@student.fpt.edu.vn"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E707D]/20 focus:border-[#1E707D] transition-all text-on-surface"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-outline-variant/50">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-outline-variant/60 hover:bg-surface-container text-xs font-bold transition-colors text-on-surface-variant"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-[#1E707D] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#165964] disabled:opacity-50 transition-colors shadow-md"
                >
                  {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  Gửi lời mời
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: REMOVE MEMBER */}
      {isRemoveModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl max-w-[320px] w-full p-5 shadow-2xl relative animate-scale-up text-center">
            <div className="w-12 h-12 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl font-bold">person_remove</span>
            </div>
            
            <h3 className="font-extrabold text-base text-on-surface mb-1">Remove Member</h3>
            
            <p className="text-[13px] text-on-surface-variant mb-5 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-on-surface">{selectedMember.name}</span> from this project?
            </p>

            <div className="flex gap-2 w-full">
              <button
                onClick={() => setIsRemoveModalOpen(false)}
                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold py-2 rounded-lg transition-colors border border-outline-variant text-[13px]"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={loading}
                className="flex-1 bg-error hover:bg-error/90 text-white font-bold py-2 rounded-lg transition-all shadow text-[13px] flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {loading ? <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL: TRANSFER LEADER */}
      {isTransferModalOpen && transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl max-w-[320px] w-full p-5 shadow-2xl relative animate-scale-up text-center">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl font-bold">swap_horiz</span>
            </div>
            
            <h3 className="font-extrabold text-base text-on-surface mb-1">Transfer Leadership</h3>
            
            <p className="text-[13px] text-on-surface-variant mb-4 leading-relaxed">
              Transfer project ownership to <span className="font-bold text-on-surface">{transferTarget.name}</span>?
            </p>

            <div className="text-[11px] text-error font-bold bg-error/5 p-2 rounded-lg border border-error/20 mb-5">
              Warning: You will become a Member and lose all management permissions.
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold py-2 rounded-lg transition-colors border border-outline-variant text-[13px]"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg transition-all shadow text-[13px] flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {loading ? <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default ContributionPage
