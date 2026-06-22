import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInitials } from '@utils/avatarHelper'
import toast from 'react-hot-toast'
import axiosClient from '@api/axiosConfig'
import useAuthStore from '@store/useAuthStore'
import AnnouncementCarousel from '../components/AnnouncementCarousel'
import AnnouncementTab from '../components/AnnouncementTab'

const AVATAR_COLORS = [
  'bg-sky-500 text-white',
  'bg-teal-500 text-white',
  'bg-indigo-500 text-white',
  'bg-rose-500 text-white',
  'bg-amber-500 text-white',
  'bg-emerald-500 text-white',
  'bg-violet-500 text-white',
  'bg-cyan-500 text-white',
]

function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function getStatusConfig(status) {
  switch (status) {
    case 'ON_TRACK':
      return { label: 'On Track', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500', border: 'border-emerald-500/30' }
    case 'AT_RISK':
      return { label: 'At Risk', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-500/30' }
    case 'BEHIND':
      return { label: 'Behind', bg: 'bg-rose-500/10', text: 'text-rose-600', dot: 'bg-rose-500', border: 'border-rose-500/30' }
    default:
      return { label: status, bg: 'bg-slate-400/10', text: 'text-slate-500', dot: 'bg-slate-400', border: 'border-slate-200' }
  }
}

export default function ClassroomDetailPage() {
  const { classroomId } = useParams()
  const navigate = useNavigate()
  const { userId } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState('projects')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Random Group state
  const [isRandomGroupModalOpen, setIsRandomGroupModalOpen] = useState(false)
  const [membersPerGroup, setMembersPerGroup] = useState(5)
  const [isRandomizing, setIsRandomizing] = useState(false)
  const [isOverwrite, setIsOverwrite] = useState(true)
  const [isClearing, setIsClearing] = useState(false)

  const fetchClassroom = async () => {
    try {
      setLoading(true)
      const response = await axiosClient.get(`/v1/classrooms/${classroomId}`)
      const classroomData = response.data?.data
      setData(classroomData)
      if (classroomData && classroomData.maxMembersPerGroup) {
        setMembersPerGroup(classroomData.maxMembersPerGroup)
      }
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load classroom details')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveStudent = async (studentId, studentName, e) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this class?`)) {
      return
    }
    try {
      await axiosClient.delete(`/v1/classrooms/${classroomId}/members/${studentId}`)
      toast.success('Student removed successfully.')
      fetchClassroom()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove student.')
    }
  }

  useEffect(() => {
    if (classroomId) {
      fetchClassroom()
    }
  }, [classroomId])

  const hasJoinedAnyProject = data?.projects?.some(p => p.members?.some(m => String(m.id) === String(userId)));
  const isStudentWithoutGroup = String(data?.owner?.id) !== String(userId) && !hasJoinedAnyProject;

  const handleRandomGroups = async () => {
    if (membersPerGroup < 1) {
      toast.error('Số thành viên mỗi nhóm phải lớn hơn 0.');
      return;
    }

    if (data.projects && data.projects.length > 0) {
      if (isOverwrite) {
        if (!window.confirm("CẢNH BÁO: Bạn đã chọn 'Ghi đè nhóm hiện tại'.\nHệ thống sẽ bổ sung sinh viên mới vào các nhóm cũ đang thiếu người.\nBạn có chắc chắn muốn tiếp tục?")) {
          return;
        }
      } else {
        if (!window.confirm("Bạn KHÔNG chọn 'Ghi đè'.\nHệ thống sẽ mặc kệ các nhóm cũ và chỉ tạo thêm các nhóm mới toanh.\nBạn có chắc chắn muốn tiếp tục?")) {
          return;
        }
      }
    }

    try {
      setIsRandomizing(true);
      await axiosClient.post(`/v1/classrooms/${classroomId}/random-groups`, { membersPerGroup, isOverwrite });
      toast.success('Phân nhóm ngẫu nhiên thành công!');
      setIsRandomGroupModalOpen(false);
      fetchClassroom();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi phân nhóm.');
    } finally {
      setIsRandomizing(false);
    }
  }

  const handleClearGroups = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn giải tán toàn bộ nhóm trong lớp học này? Hành động này không thể hoàn tác.")) {
      return;
    }
    try {
      setIsClearing(true);
      await axiosClient.delete(`/v1/classrooms/${classroomId}/groups`);
      toast.success('Giải tán toàn bộ nhóm thành công!');
      fetchClassroom();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi giải tán nhóm.');
    } finally {
      setIsClearing(false);
    }
  }

  const handleShareInviteLink = async () => {
    try {
      const { data } = await axiosClient.get(`/v1/classrooms/${classroomId}/invite-link`);
      if (data.success && data.data) {
        const inviteLink = `${window.location.origin}/classrooms/join?token=${data.data}`;
        await navigator.clipboard.writeText(inviteLink);
        toast.success('Đã copy link mời vào clipboard!');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lấy link mời.');
    }
  }

  const handleJoinProject = async (projectId, e) => {
    e.stopPropagation();
    try {
      await axiosClient.post(`/v1/projects/${projectId}/join`);
      toast.success('Đã tham gia nhóm thành công!');
      fetchClassroom();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tham gia nhóm.');
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <p className="text-rose-500 mb-4">{error}</p>
          <button onClick={() => navigate('/classrooms')} className="text-sky-600 font-bold hover:underline">
            Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="-mt-margin_mobile -mx-margin_mobile md:-mt-margin_desktop md:-mx-margin_desktop flex-1 overflow-y-auto bg-[#f8fafc] select-none">
      {/* Top Banner Area - Now handled by AnnouncementCarousel */}
      <AnnouncementCarousel 
        classroomData={data} 
        onShare={handleShareInviteLink} 
      />

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 flex items-center gap-8">
          {[
            { id: 'projects', label: 'Projects', icon: 'folder' },
            { id: 'members', label: 'Members', icon: 'groups' },
            { id: 'dashboard', label: 'Class Dashboard', icon: 'dashboard' },
            { id: 'announcements', label: 'Announcements', icon: 'campaign' },
            { id: 'resources', label: 'Resources', icon: 'library_books' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === tab.id 
                  ? 'border-[#0284c7] text-[#0284c7]' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Student Projects</h2>
                <p className="text-sm text-slate-500 mt-1">{data.semester} • {data.stats?.teams || 0} teams registered</p>
              </div>
              {String(data.owner?.id) === String(userId) && (
                <button
                  onClick={() => navigate(`/dashboard?createProjectForClassroom=${classroomId}&isMentor=true&semester=${data.semester}&subject=${encodeURIComponent(data.subjectCode || data.subject || '')}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Tạo dự án thủ công
                </button>
              )}
              {isStudentWithoutGroup && (
                <button
                  onClick={() => navigate(`/dashboard?createProjectForClassroom=${classroomId}&semester=${data.semester}&subject=${encodeURIComponent(data.subjectCode || data.subject || '')}&hideToast=true`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Tạo dự án thủ công
                </button>
              )}
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {data.projects && data.projects.map((project, index) => {
                const status = getStatusConfig(project.status)
                
                return (
                  <div key={project.id} className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 text-lg">Group {index + 1} — {project.name}</h3>
                      <button className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed min-h-[40px] mb-4">
                      {project.description}
                    </p>

                    <div className="mb-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.border} ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                        <span>Completion</span>
                        <span className="text-slate-800 font-bold">{project.completion}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full bg-[#0284c7] rounded-full" 
                          style={{ width: `${project.completion}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {project.tasksDone || 0} of {project.totalTasks || 0} tasks done
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                      <div className="flex items-center">
                        <div className="flex items-center -space-x-2">
                          {project.members.slice(0, 4).map((member, idx) => (
                            <div
                              key={member.id}
                              title={member.fullName}
                              className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-extrabold shadow-sm shrink-0 ${getAvatarColor(idx)}`}
                            >
                              {getInitials(member.fullName)}
                            </div>
                          ))}
                          {project.members.length > 4 && (
                            <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-bold shadow-sm shrink-0">
                              +{project.members.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 ml-3">
                          {project.members.length} members
                        </span>
                      </div>
                      
                      {isStudentWithoutGroup ? (
                        <button 
                          onClick={(e) => handleJoinProject(project.id, e)}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-bold rounded-lg transition-colors border border-indigo-100"
                        >
                          Tham gia
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Updated recently</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Class Members</h2>
                <p className="text-sm text-slate-500 mt-1">{data.members?.length || 0} students enrolled</p>
              </div>
              {String(data.owner?.id) === String(userId) && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClearGroups}
                    disabled={isClearing || !data.projects || data.projects.length === 0}
                    className="bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">delete_sweep</span>
                    {isClearing ? 'Đang giải tán...' : 'Giải tán nhóm'}
                  </button>
                  <button
                    onClick={() => setIsRandomGroupModalOpen(true)}
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">shuffle</span>
                    Phân lớp ngẫu nhiên
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm">
              <div className="overflow-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Group</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data.members ? [...data.members].sort((a, b) => {
                        if (a.projectName === b.projectName) return 0;
                        if (!a.projectName) return 1;
                        if (!b.projectName) return -1;
                        return a.projectName.localeCompare(b.projectName);
                      }) : []).map((member, idx) => (
                      <tr 
                        key={member.id} 
                        onClick={() => navigate(`/profile/${member.id}`)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group/row"
                      >
                        <td className="px-6 py-4 relative">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-sm shrink-0 ${getAvatarColor(idx)}`}>
                              {getInitials(member.fullName)}
                            </div>
                            <span className="font-bold text-slate-700">{member.fullName}</span>
                          </div>

                          {/* Hover Popover */}
                          <div 
                            className="absolute left-14 bottom-[60%] z-50 hidden group-hover/row:block w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-5 cursor-default"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-4">
                              <div className="shrink-0">
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt={member.fullName} className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                                ) : (
                                  <div className="w-16 h-16 rounded-xl bg-[#0047AB] text-white flex items-center justify-center text-xl font-bold shadow-sm">
                                    {getInitials(member.fullName)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-slate-800 text-lg truncate" title={member.fullName}>{member.fullName}</h3>
                                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600 border border-green-100">
                                    Active
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium mb-2 truncate">@{member.username || member.email?.split('@')[0]}</p>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-[14px]">mail</span>
                                    <span className="truncate">{member.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-[14px]">verified_user</span>
                                    <span>System Role: {member.systemRole || 'USER'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500 capitalize">
                          {member.projectRole || 'Member'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-between items-center">
                            <div>
                              {member.projectName ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  <span className="material-symbols-outlined text-[12px]">workspaces</span>
                                  {member.projectName}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  Chưa tham gia
                                </span>
                              )}
                            </div>
                            {String(data?.owner?.id) === String(userId) && (
                              <button 
                                onClick={(e) => handleRemoveStudent(member.id, member.fullName, e)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-4 shrink-0"
                                title="Xóa học sinh khỏi lớp"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!data.members || data.members.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-slate-500">
                          Chưa có sinh viên nào tham gia lớp học này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Class Resources</h2>
                <p className="text-sm text-slate-500 mt-1">Study materials and useful links</p>
              </div>
              <button className="flex items-center gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Resource
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden p-6">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <span className="material-symbols-outlined text-3xl text-slate-400">library_books</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">No resources yet</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Resources such as lecture slides, reading materials, or external links will appear here once added by the instructor.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'announcements' && (
          <AnnouncementTab classroomId={classroomId} classroomData={data} />
        )}
        {activeTab !== 'projects' && activeTab !== 'members' && activeTab !== 'resources' && activeTab !== 'announcements' && (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">construction</span>
            <h3 className="font-bold text-slate-600">Tab này đang được xây dựng</h3>
            <p className="text-sm text-slate-400 mt-1">Các tính năng khác sẽ được cập nhật sớm.</p>
          </div>
        )}
      </div>

      {/* Random Group Modal */}
      {isRandomGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-[slideUp_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">shuffle</span>
                Phân lớp ngẫu nhiên
              </h3>
              <button 
                onClick={() => setIsRandomGroupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Nhập số thành viên cho mỗi nhóm. Hệ thống sẽ tự động ghép những sinh viên chưa có nhóm vào các nhóm chưa đủ người, sau đó tạo thêm nhóm mới cho những bạn còn lại.
              </p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Số lượng thành viên / nhóm
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={membersPerGroup}
                  onChange={(e) => setMembersPerGroup(parseInt(e.target.value) || 1)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-start gap-3 mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    id="isOverwrite"
                    type="checkbox"
                    checked={isOverwrite}
                    onChange={(e) => setIsOverwrite(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-white border-indigo-300 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="isOverwrite" className="font-semibold text-indigo-900 cursor-pointer">
                    Ghi đè nhóm hiện tại
                  </label>
                  <p className="text-indigo-700/80 mt-0.5">
                    Nếu chọn, hệ thống sẽ thêm sinh viên vào các nhóm chưa đủ người trước khi tạo nhóm mới. Nếu không chọn, hệ thống sẽ bỏ qua các nhóm cũ và chỉ tạo nhóm mới cho sinh viên.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsRandomGroupModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-200 transition-colors"
                disabled={isRandomizing}
              >
                Hủy
              </button>
              <button 
                onClick={handleRandomGroups}
                disabled={isRandomizing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-indigo-600/20 flex items-center gap-2"
              >
                {isRandomizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang phân nhóm...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">magic_button</span>
                    Tiến hành phân nhóm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
