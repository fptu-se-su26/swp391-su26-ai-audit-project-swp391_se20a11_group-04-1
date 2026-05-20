import { useState } from 'react'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import { getInitials } from '@utils/avatarHelper'

/**
 * ContributionPage - Quản lý thành viên & Phân quyền Mentor
 * Cho phép xem danh sách thành viên, mời thành viên bằng email và phong cấp Mentor.
 */
export function ContributionPage() {
  const { activeProject, inviteProjectMember, changeProjectMemberRole, removeProjectMember, loading, error } = useProjectStore()
  
  // Trạng thái Form & Modal
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  // Kiểm tra xem dự án có đang active hay không
  if (!activeProject) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 shadow-lg space-y-4">
          <span className="material-symbols-outlined text-5xl text-primary animate-bounce">folder_open</span>
          <h3 className="font-extrabold text-xl text-on-surface">Chưa chọn dự án</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Vui lòng quay lại Dashboard và chọn một dự án cụ thể để quản lý đóng góp và thành viên nhóm.
          </p>
        </div>
      </main>
    )
  }

  // Xác định vai trò của user hiện tại trong dự án
  const isLeader = activeProject.role === 'Project Leader'

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

  // Xử lý mở Modal xác nhận phong cấp Mentor
  const handlePromoteClick = (member) => {
    setSelectedMember(member)
    setIsRoleModalOpen(true)
  }

  // Xử lý xác nhận phong cấp Mentor
  const handleConfirmRoleChange = async () => {
    if (!selectedMember) return
    
    const success = await changeProjectMemberRole(selectedMember.id, 'MENTOR')
    if (success) {
      toast.success(`Đã nâng cấp vai trò ${selectedMember.name} lên Mentor!`)
      setIsRoleModalOpen(false)
      setSelectedMember(null)
    } else {
      toast.error(useProjectStore.getState().error || 'Nâng cấp vai trò thất bại!')
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

  // Mảng thành viên
  const members = activeProject.members || []

  // Nhãn hiển thị cho vai trò dự án
  const getRoleBadge = (role) => {
    switch (role) {
      case 'PROJECT_LEADER':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wide rounded-full">
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
        <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-primary-fixed opacity-[0.08] blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-secondary-fixed opacity-[0.1] blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Banner tiêu đề trang */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg">
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
              className="flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-xl font-black text-sm hover:bg-primary-fixed-dim hover:scale-105 transition-all shadow-md shrink-0"
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
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
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
                          {member.role === 'MEMBER' && (
                            <button
                              onClick={() => handlePromoteClick(member)}
                              className="inline-flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold px-3.5 py-1.5 rounded-lg border border-tertiary/10 hover:bg-tertiary/20 hover:scale-105 transition-all shadow-sm"
                              title="Phong Mentor cho thành viên này"
                            >
                              <span className="material-symbols-outlined text-[16px] font-bold">arrow_upward</span>
                              Phong Mentor
                            </button>
                          )}
                          {member.role !== 'PROJECT_LEADER' ? (
                            <button
                              onClick={() => handleRemoveClick(member)}
                              className="inline-flex items-center gap-1 bg-error/15 text-error text-xs font-bold px-3.5 py-1.5 rounded-lg border border-error/25 hover:bg-error/25 hover:scale-105 transition-all shadow-sm"
                              title="Xóa thành viên khỏi dự án"
                            >
                              <span className="material-symbols-outlined text-[16px] font-bold">person_remove</span>
                              Xóa thành viên
                            </button>
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
                <span className="material-symbols-outlined text-primary">person_add</span>
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
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
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
                  className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-on-primary-fixed-variant disabled:opacity-50 transition-colors shadow-md"
                >
                  {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  Gửi lời mời
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: XÁC NHẬN PHONG CẤP MENTOR */}
      {isRoleModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative animate-scale-up">
            <button
              onClick={() => {
                setIsRoleModalOpen(false)
                setSelectedMember(null)
              }}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-2xl font-bold">arrow_upward</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-lg text-on-surface">Xác nhận phong cấp Mentor</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Bạn có chắc chắn muốn nâng cấp vai trò của thành viên <strong>{selectedMember.name}</strong> lên làm <strong>Mentor</strong> của dự án?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-tertiary/5 border border-tertiary/10 text-xs text-on-surface-variant/90 leading-relaxed">
              <strong>Lưu ý:</strong> Hành động này sẽ thay đổi quyền truy cập của cố vấn trong dự án này, cung cấp cho họ các quyền xem xét nâng cao và đánh giá chất lượng sản phẩm.
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-outline-variant/50">
              <button
                type="button"
                onClick={() => {
                  setIsRoleModalOpen(false)
                  setSelectedMember(null)
                }}
                className="px-4.5 py-2.5 rounded-xl border border-outline-variant/60 hover:bg-surface-container text-xs font-bold transition-colors text-on-surface-variant"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRoleChange}
                disabled={loading}
                className="flex items-center gap-2 bg-tertiary text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-tertiary/90 disabled:opacity-50 transition-colors shadow-md"
              >
                {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Đồng ý nâng cấp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL: XÁC NHẬN XÓA THÀNH VIÊN */}
      {isRemoveModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative animate-scale-up">
            <button
              onClick={() => {
                setIsRemoveModalOpen(false)
                setSelectedMember(null)
              }}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-error/10 text-error rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-2xl font-bold">person_remove</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-lg text-on-surface text-error">Xác nhận xóa thành viên</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Bạn có chắc chắn muốn xóa thành viên <strong>{selectedMember.name}</strong> khỏi dự án?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-error/5 border border-error/10 text-xs text-error/90 leading-relaxed font-medium">
              <strong>Cảnh báo:</strong> Thành viên này sẽ ngay lập tức mất quyền truy cập vào Workspace của dự án, mọi đóng góp, tasks đang thực hiện sẽ tạm dừng.
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-outline-variant/50">
              <button
                type="button"
                onClick={() => {
                  setIsRemoveModalOpen(false)
                  setSelectedMember(null)
                }}
                className="px-4.5 py-2.5 rounded-xl border border-outline-variant/60 hover:bg-surface-container text-xs font-bold transition-colors text-on-surface-variant"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={loading}
                className="flex items-center gap-2 bg-error text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-error/90 disabled:opacity-50 transition-colors shadow-md"
              >
                {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default ContributionPage
