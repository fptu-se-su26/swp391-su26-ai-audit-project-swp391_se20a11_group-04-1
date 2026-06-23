import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInitials } from '@utils/avatarHelper'
import toast from 'react-hot-toast'
import axiosClient from '@api/axiosConfig'



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
  
  const [activeTab, setActiveTab] = useState('projects')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setLoading(true)
        const response = await axiosClient.get(`/v1/classrooms/${classroomId}`)
        if (response.data.success) {
          setData(response.data.data)
        } else {
          setError(response.data.message)
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải lớp học.')
      } finally {
        setLoading(false)
      }
    }
    
    if (classroomId) {
      fetchClassroom()
    }
  }, [classroomId])

  const handleShareInviteLink = async () => {
    try {
      const { data } = await axiosClient.get(`/v1/classrooms/${classroomId}/invite-link`);
      if (data.success && data.data) {
        const inviteLink = `${window.location.origin}/classrooms/join?token=${data.data}`;
        await navigator.clipboard.writeText(inviteLink);
        toast.success('Đã sao chép link mời lớp học vào clipboard!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Chỉ người tạo lớp học mới có quyền tạo link mời.');
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
      {/* Top Banner Area */}
      <div className="bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#38bdf8] w-full px-8 py-8 relative overflow-hidden">
        {/* Subtle grid pattern overlay for modern look */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                ACTIVE SEMESTER
              </span>
              <span className="text-sm font-semibold text-white/90 bg-white/20 px-3 py-0.5 rounded-full backdrop-blur-sm">
                {data.semester}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-3">
              {data.subject}
            </h1>
            <div className="flex items-center gap-8 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white/80 text-sm">person</span>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-sky-200 uppercase tracking-wide">Mentor</p>
                  <p className="text-sm font-medium text-white">{data.owner?.fullName || data.owner?.email}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div>
                <p className="text-[11px] font-medium text-sky-200 uppercase tracking-wide">Project Teams</p>
                <p className="text-sm font-medium text-white">{data.stats.teams} Teams</p>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div>
                <p className="text-[11px] font-medium text-sky-200 uppercase tracking-wide">Students Enrolled</p>
                <p className="text-sm font-medium text-white">{data.stats.students} Students</p>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <button onClick={handleShareInviteLink} className="bg-white text-[#0284c7] hover:bg-sky-50 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-xl shadow-sky-900/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">link</span>
              Share Invite Link
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="w-full px-8 flex items-center gap-8">
          {[
            { id: 'projects', label: 'Projects', icon: 'folder' },
            { id: 'members', label: 'Members', icon: 'groups' },
            { id: 'dashboard', label: 'Class Dashboard', icon: 'dashboard' },
            { id: 'announcements', label: 'Announcements', icon: 'campaign' },
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
      <div className="w-full px-8 py-8">
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Student Projects</h2>
                <p className="text-sm text-slate-500 mt-1">{data.semester} • {data.stats?.teams || 0} teams registered</p>
              </div>
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
                        <span className="text-[11px] font-medium text-slate-500 ml-3">{project.members?.length || 0} members</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Updated recently</span>
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
            </div>

            <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.members && data.members.map((member, idx) => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-sm shrink-0 ${getAvatarColor(idx)}`}>
                              {getInitials(member.fullName)}
                            </div>
                            <span className="font-bold text-slate-700">{member.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">
                          Student
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
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
        {activeTab !== 'projects' && activeTab !== 'members' && (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">construction</span>
            <h3 className="font-bold text-slate-600">Tab này đang được xây dựng</h3>
            <p className="text-sm text-slate-400 mt-1">Các tính năng khác sẽ được cập nhật sớm.</p>
          </div>
        )}
      </div>
    </div>
  )
}
