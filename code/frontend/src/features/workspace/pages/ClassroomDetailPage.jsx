import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInitials } from '@utils/avatarHelper'
import toast from 'react-hot-toast'
import axiosClient from '@api/axiosConfig'
import useAuthStore from '@store/useAuthStore'
import AnnouncementCarousel from '../components/AnnouncementCarousel'
import AnnouncementTab from '../components/AnnouncementTab'
import ClassroomDashboardTab from '../components/ClassroomDashboardTab'
import ResourceTab from '../components/ResourceTab'
import AnnouncementDetailModal from '../components/AnnouncementDetailModal'
import { resourceApi } from '@api/resourceApi'
import ConfirmModal from '../../../components/ui/ConfirmModal'

const AVATAR_COLORS = [
  'bg-sky-500 text-white',
  'bg-teal-500 text-white',
  'bg-[#1E707D] text-white',
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
  const [selectedAnnouncementModal, setSelectedAnnouncementModal] = useState(null)

  // Random Group state
  const [isRandomGroupModalOpen, setIsRandomGroupModalOpen] = useState(false)
  const [membersPerGroup, setMembersPerGroup] = useState(5)
  const [isRandomizing, setIsRandomizing] = useState(false)
  const [isOverwrite, setIsOverwrite] = useState(true)
  const [isClearing, setIsClearing] = useState(false)

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, action: null, message: '', title: '', payload: null })

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
    setConfirmConfig({
      isOpen: true,
      action: 'REMOVE_STUDENT',
      title: 'Remove student',
      message: `Are you sure you want to remove ${studentName} from this class?`,
      payload: studentId
    })
  }

  const executeRemoveStudent = async (studentId) => {
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
      toast.error('Number of members per group must be greater than 0.');
      return;
    }

    if (data.projects && data.projects.length > 0) {
      if (isOverwrite) {
        setConfirmConfig({
          isOpen: true,
          action: 'RANDOM_GROUPS',
          title: 'Confirm Group Creation',
          message: "WARNING: You selected 'Overwrite current groups'.\nHệ thống sẽ bổ sung sinh viên mới vào các nhóm cũ đang thiếu người.\nBạn có chắc chắn muốn tiếp tục?"
        });
        return;
      } else {
        setConfirmConfig({
          isOpen: true,
          action: 'RANDOM_GROUPS',
          title: 'Confirm Group Creation',
          message: "You did NOT select 'Overwrite'.\nHệ thống sẽ mặc kệ các nhóm cũ và chỉ tạo thêm các nhóm mới toanh.\nBạn có chắc chắn muốn tiếp tục?"
        });
        return;
      }
    }
    
    executeRandomGroups();
  }

  const executeRandomGroups = async () => {

    try {
      setIsRandomizing(true);
      await axiosClient.post(`/v1/classrooms/${classroomId}/random-groups`, { membersPerGroup, isOverwrite });
      toast.success('Random grouping completed successfully!');
      setIsRandomGroupModalOpen(false);
      fetchClassroom();
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred during grouping.');
    } finally {
      setIsRandomizing(false);
    }
  }

  const handleClearGroups = async () => {
    setConfirmConfig({
      isOpen: true,
      action: 'CLEAR_GROUPS',
      title: 'Dissolve Groups',
      message: "Are you sure you want to dissolve all groups in this classroom? This action cannot be undone."
    })
  }

  const executeClearGroups = async () => {
    try {
      setIsClearing(true);
      await axiosClient.delete(`/v1/classrooms/${classroomId}/groups`);
      toast.success('All groups dissolved successfully!');
      fetchClassroom();
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred while dissolving groups.');
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
        toast.success('Copied invite link to clipboard!');
      }
    } catch (err) {
      toast.error('An error occurred while retrieving the invite link.');
    }
  }

  const handleJoinProject = async (projectId, e) => {
    e.stopPropagation();
    try {
      await axiosClient.post(`/v1/projects/${projectId}/join`);
      toast.success('Joined group successfully!');
      fetchClassroom();
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred while joining the group.');
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
            Back to list
          </button>
        </div>
      </div>
    )
  }

  const handleResourceClick = async (resource, shouldDownload = false) => {
    if (!resource) return;

    if (!shouldDownload) {
      setActiveTab('resources');
      return;
    }

    if (resource.type === 'LINK') {
      if (resource.url) {
        window.open(resource.url, '_blank', 'noopener,noreferrer');
      }
    } else if (resource.type === 'FILE') {
      const toastId = toast.loading('Preparing file for download...');
      try {
        const response = await resourceApi.downloadResource(classroomId, resource.id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        let fileName = `${resource.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.zip`;
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition && contentDisposition.includes('filename=')) {
          const matches = contentDisposition.match(/filename="(.+)"/);
          if (matches && matches[1]) {
            fileName = matches[1];
          }
        }
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Download started!', { id: toastId });
      } catch (err) {
        toast.error('An error occurred while downloading', { id: toastId });
      }
    }
  };

  return (
    <div className="-mt-margin_mobile -mx-margin_mobile md:-mt-margin_desktop md:-mx-margin_desktop flex-1 overflow-y-auto bg-[#f8fafc] select-none">
      {/* Top Banner Area - Now handled by AnnouncementCarousel */}
      <AnnouncementCarousel 
        classroomData={data} 
        onShare={handleShareInviteLink} 
        onAnnouncementClick={(ann) => {
          setSelectedAnnouncementModal(ann);
        }}
        onResourceClick={handleResourceClick}
      />

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="w-full px-8 flex items-center gap-8">
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
      <div className="w-full px-8 py-8">
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
                  className="flex items-center gap-2 px-4 py-2 bg-[#1E707D] hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Create project manually
                </button>
              )}
              {isStudentWithoutGroup && (
                <button
                  onClick={() => navigate(`/dashboard?createProjectForClassroom=${classroomId}&semester=${data.semester}&subject=${encodeURIComponent(data.subjectCode || data.subject || '')}&hideToast=true`)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1E707D] hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Create project manually
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
                          className="px-3 py-1 bg-[#1E707D]/10 hover:bg-[#1E707D] text-[#1E707D] hover:text-white text-xs font-bold rounded-lg transition-colors border border-indigo-100"
                        >
                          Join
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
                    {isClearing ? 'Dissolving...' : 'Dissolve groups'}
                  </button>
                  <button
                    onClick={() => setIsRandomGroupModalOpen(true)}
                    className="bg-[#1E707D]/10 text-[#1E707D] hover:bg-indigo-100 px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">shuffle</span>
                    Random grouping
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
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1E707D]/10 text-[#1E707D] border border-indigo-100">
                                  <span className="material-symbols-outlined text-[12px]">workspaces</span>
                                  {member.projectName}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  Not joined
                                </span>
                              )}
                            </div>
                            {String(data?.owner?.id) === String(userId) && (
                              <button 
                                onClick={(e) => handleRemoveStudent(member.id, member.fullName, e)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-4 shrink-0"
                                title="Remove student from class"
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
                          No students have joined this classroom yet.
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
          <ResourceTab classroomId={classroomId} classroomData={data} userId={userId} />
        )}
        {activeTab === 'announcements' && (
          <AnnouncementTab 
            classroomId={classroomId} 
            classroomData={data} 
            onAnnouncementClick={(ann) => setSelectedAnnouncementModal(ann)}
          />
        )}
        {activeTab === 'dashboard' && (
          <ClassroomDashboardTab data={data} setActiveTab={setActiveTab} />
        )}
        {activeTab !== 'projects' && activeTab !== 'members' && activeTab !== 'resources' && activeTab !== 'announcements' && activeTab !== 'dashboard' && (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">construction</span>
            <h3 className="font-bold text-slate-600">This tab is under construction</h3>
            <p className="text-sm text-slate-400 mt-1">Other features will be updated soon.</p>
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
                <span className="material-symbols-outlined text-[#1E707D]">shuffle</span>
                Random Grouping
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
                Enter the number of members per group. The system will automatically assign students without groups to under-capacity groups, then create new groups for the remaining students.
              </p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Members per group
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={membersPerGroup}
                  onChange={(e) => setMembersPerGroup(parseInt(e.target.value) || 1)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-start gap-3 mt-4 p-3 bg-[#1E707D]/10 rounded-xl border border-indigo-100">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    id="isOverwrite"
                    type="checkbox"
                    checked={isOverwrite}
                    onChange={(e) => setIsOverwrite(e.target.checked)}
                    className="w-4 h-4 text-[#1E707D] bg-white border-indigo-300 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="isOverwrite" className="font-semibold text-indigo-900 cursor-pointer">
                    Overwrite current groups
                  </label>
                  <p className="text-[#1E707D]/80 mt-0.5">
                    If selected, the system will add students to under-capacity groups before creating new groups. If not selected, the system will ignore existing groups and only create new groups for unassigned students.
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
                Cancel
              </button>
              <button 
                onClick={handleRandomGroups}
                disabled={isRandomizing}
                className="bg-[#1E707D] hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-indigo-600/20 flex items-center gap-2"
              >
                {isRandomizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Grouping...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">magic_button</span>
                    Proceed Grouping
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={() => {
          if (confirmConfig.action === 'REMOVE_STUDENT') {
            executeRemoveStudent(confirmConfig.payload)
          } else if (confirmConfig.action === 'RANDOM_GROUPS') {
            executeRandomGroups()
          } else if (confirmConfig.action === 'CLEAR_GROUPS') {
            executeClearGroups()
          }
          setConfirmConfig({ isOpen: false, action: null, message: '', title: '', payload: null })
        }}
        onCancel={() => setConfirmConfig({ isOpen: false, action: null, message: '', title: '', payload: null })}
      />

      <AnnouncementDetailModal
        isOpen={Boolean(selectedAnnouncementModal)}
        onClose={() => setSelectedAnnouncementModal(null)}
        announcement={selectedAnnouncementModal}
        classroomId={classroomId}
      />
    </div>
  )
}
