import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import useAuthStore from '@store/useAuthStore'
import useKanbanStore from '../../kanban/store/useKanbanStore'

export default function FeatureDiscussionPage() {
  const { projectId, id } = useParams()
  const navigate = useNavigate()
  const activeProject = useProjectStore((state) => state.activeProject)
  const currentUserFullName = useAuthStore((state) => state.fullName || state.username || 'Thành viên')

  const { tasks, fetchTaskById, updateTask, loading, error } = useKanbanStore()
  const task = tasks.find((item) => String(item.id) === String(id))


  // Checklist Proposals & Comments state
  const [proposals, setProposals] = useState([])
  const [newProposalText, setNewProposalText] = useState('')
  const [proposalCommentsInputs, setProposalCommentsInputs] = useState({}) // propId -> text
  const [expandedProposalComments, setExpandedProposalComments] = useState({}) // propId -> boolean

  // Check if current user is Project Leader
  const isLeader = useMemo(() => {
    if (!activeProject?.role) return false
    const r = activeProject.role.toUpperCase().replace(/\s+/g, '_')
    return r === 'PROJECT_LEADER' || r === 'LEADER'
  }, [activeProject?.role])

  // Load task and comments/proposals
  useEffect(() => {
    if (!task && id) {
      fetchTaskById(id)
    }
  }, [fetchTaskById, id, task])

  useEffect(() => {
    if (id) {
      // Load checklist proposals
      const storedProposals = localStorage.getItem(`proposed-checklist-task-${id}`)
      if (storedProposals) {
        setProposals(JSON.parse(storedProposals))
      } else {
        // Seed default proposals for collaborative workspace vibe
        const defaultProposals = [
          {
            id: 'prop-1',
            text: 'Thiết kế Banner với hiệu ứng Glassmorphism và màu Ocean Blue đồng bộ',
            proposedBy: 'Designer Phương',
            createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            status: 'APPROVED',
            votes: ['Project Leader', 'Developer'],
            downvotes: [],
            comments: [
              {
                id: 101,
                author: 'Project Leader',
                content: 'Đồng ý, tone màu chủ đạo là Ocean Blue (#0ea5e9) cần được giữ đồng bộ trên mọi ngóc ngách.',
                createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString()
              }
            ]
          },
          {
            id: 'prop-2',
            text: 'Sử dụng React Hook Form kết hợp Zod/Yup để kiểm soát chặt chẽ validation trước khi submit',
            proposedBy: 'Dev Minh',
            createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            status: 'PENDING',
            votes: ['Quality Assurance'],
            downvotes: [],
            comments: [
              {
                id: 102,
                author: 'Quality Assurance',
                content: 'Rất nên làm thế này để tránh các lỗi null/undefined hoặc chuỗi rỗng gây crash UI.',
                createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
              }
            ]
          },
          {
            id: 'prop-3',
            text: 'Thêm loading skeleton khi đang fetch dữ liệu UI/UX từ AI model để tránh nhảy layout',
            proposedBy: 'Dev Minh',
            createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
            status: 'PENDING',
            votes: [],
            downvotes: [],
            comments: []
          }
        ]
        setProposals(defaultProposals)
        localStorage.setItem(`proposed-checklist-task-${id}`, JSON.stringify(defaultProposals))
      }
    }
  }, [id])

  // Save proposals to localStorage
  const saveProposals = (updatedProposals) => {
    setProposals(updatedProposals)
    localStorage.setItem(`proposed-checklist-task-${id}`, JSON.stringify(updatedProposals))
  }




  // Handle Checklist Proposals
  const handleAddProposal = (e) => {
    e.preventDefault()
    if (!newProposalText.trim()) return

    const newProp = {
      id: 'prop-' + Date.now(),
      text: newProposalText.trim(),
      proposedBy: currentUserFullName,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      votes: [],
      downvotes: [],
      comments: []
    }

    const updated = [...proposals, newProp]
    saveProposals(updated)
    setNewProposalText('')
    toast.success('Đã gửi đề xuất checklist! Cả đội cùng thảo luận và góp ý trước khi chốt.')
  }

  const handleVoteProposal = (propId) => {
    const updated = proposals.map((prop) => {
      if (prop.id === propId) {
        const hasVoted = prop.votes?.includes(currentUserFullName) || false
        const newVotes = hasVoted
          ? prop.votes.filter((v) => v !== currentUserFullName)
          : [...(prop.votes || []), currentUserFullName]
        const newDownvotes = (prop.downvotes || []).filter((v) => v !== currentUserFullName)
        return { ...prop, votes: newVotes, downvotes: newDownvotes }
      }
      return prop
    })
    saveProposals(updated)
  }

  const handleDownvoteProposal = (propId) => {
    const updated = proposals.map((prop) => {
      if (prop.id === propId) {
        const hasDownvoted = prop.downvotes?.includes(currentUserFullName) || false
        const newDownvotes = hasDownvoted
          ? prop.downvotes.filter((v) => v !== currentUserFullName)
          : [...(prop.downvotes || []), currentUserFullName]
        const newVotes = (prop.votes || []).filter((v) => v !== currentUserFullName)
        return { ...prop, votes: newVotes, downvotes: newDownvotes }
      }
      return prop
    })
    saveProposals(updated)
  }

  const handleAddProposalComment = (e, propId) => {
    e.preventDefault()
    const text = proposalCommentsInputs[propId] || ''
    if (!text.trim()) return

    const updated = proposals.map((prop) => {
      if (prop.id === propId) {
        const newCommentObj = {
          id: Date.now(),
          author: currentUserFullName,
          content: text.trim(),
          createdAt: new Date().toISOString()
        }
        return { ...prop, comments: [...(prop.comments || []), newCommentObj] }
      }
      return prop
    })

    saveProposals(updated)
    setProposalCommentsInputs((prev) => ({ ...prev, [propId]: '' }))
    toast.success('Đã đăng góp ý về đề xuất này!')
  }

  const handleApproveProposal = async (prop) => {
    if (!task) return

    // Add to official checklist in task
    const alreadyExists = (task.checklist || []).some((item) => item.text === prop.text)
    let updatedChecklist = [...(task.checklist || [])]

    if (!alreadyExists) {
      updatedChecklist.push({
        id: 'temp-' + Date.now(),
        text: prop.text,
        done: false
      })
    }

    // Set proposal status to APPROVED
    const updatedProposals = proposals.map((p) =>
      p.id === prop.id ? { ...p, status: 'APPROVED' } : p
    )

    try {
      await updateTask(task.id, {
        ...task,
        assigneeId: task.assignee?.id || null,
        checklist: updatedChecklist
      })
      saveProposals(updatedProposals)
      toast.success('Đã duyệt và chính thức ban hành mục checklist này!')
    } catch (err) {
      toast.error('Duyệt đề xuất thất bại!')
    }
  }

  const handleRejectProposal = (propId) => {
    const updatedProposals = proposals.map((p) =>
      p.id === propId ? { ...p, status: 'REJECTED' } : p
    )
    saveProposals(updatedProposals)
    toast.success('Đã đánh dấu từ chối đề xuất này.')
  }

  const toggleProposalCommentVisibility = (propId) => {
    setExpandedProposalComments((prev) => ({
      ...prev,
      [propId]: !prev[propId]
    }))
  }



  if (loading && !task) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-[#f8fafc] flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-[#0ea5e9] animate-spin">progress_activity</span>
      </main>
    )
  }

  if (!task) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-[#f8fafc] flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-md shadow-slate-200/50 space-y-4">
          <span className="material-symbols-outlined text-5xl text-red-500">error</span>
          <h3 className="font-extrabold text-xl text-slate-900">Không Tìm Thấy Đề Xuất Feature</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Task/Feature ID {id} không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <button
            onClick={() => navigate(`/projects/${projectId}/issues`)}
            className="mt-2 py-2 px-6 bg-[#0ea5e9] text-white font-bold text-sm rounded-lg hover:bg-[#0284c7] transition-colors shadow-sm"
          >
            Quay lại Issue Tracker
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 md:p-10 pb-40 md:pb-60 overflow-y-auto relative bg-[#f8fafc] text-slate-700 select-none font-sans">
      {/* Blurred background visual effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-[#0ea5e9]/5 opacity-40 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-[#38bdf8]/5 opacity-30 blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Navigation breadcrumb */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-xs text-[#0ea5e9] font-bold hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">arrow_back</span>
                <span>Quay lại</span>
              </button>
            </div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-[#0ea5e9] font-bold">forum</span>
              Phân tích & Thảo luận: {task.title}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Đồng thuận, phân tích đánh giá và chốt các bước thực hiện (checklist) tối ưu nhất trước khi quyết định bấm chạy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#0ea5e9]/10 text-[#0284c7] border border-[#0ea5e9]/20 font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider">
              ID: {task.id}
            </span>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider">
              {task.status.replaceAll('_', ' ')}
            </span>
          </div>
        </section>

        {/* Feature Description Card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md shadow-slate-200/50 backdrop-blur-md">
          <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-2">Mô tả tính năng</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {task.description || 'Không có mô tả chi tiết cho tính năng này.'}
          </p>
        </section>

        {/* Core details layout - Centered Single Column Layout */}
        <div className="space-y-6">
          
          {/* Checklist Proposals Collaborative Workspace (Direct Rendering, No Tabs) */}
          <div className="space-y-6 font-sans">

            {/* Form to submit proposal - Sticky floating at the top on scroll */}
            <form onSubmit={handleAddProposal} className="sticky top-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-lg transition-all">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đề xuất bước thực hiện mới</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProposalText}
                  onChange={(e) => setNewProposalText(e.target.value)}
                  placeholder="Ví dụ: 'Cần thiết lập validation định dạng email ở cả frontend và backend'..."
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0ea5e9] text-slate-800 font-semibold"
                  required
                />
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-gradient-to-r from-[#0ea5e9] to-[#38bdf8] hover:from-[#0284c7] hover:to-[#0ea5e9] text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm font-bold">send</span>
                  Gửi đề xuất
                </button>
              </div>
            </form>

            {/* Proposals List */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh sách đề xuất đang thảo luận</h4>
              
              {proposals.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center italic text-xs text-slate-500 shadow-sm">
                  Chưa có đề xuất nào. Hãy bắt đầu thảo luận bằng cách thêm đề xuất ở trên!
                </div>
              ) : (
                proposals.map((prop) => {
                  const hasVoted = prop.votes?.includes(currentUserFullName) || false
                  const hasDownvoted = prop.downvotes?.includes(currentUserFullName) || false
                  const isPending = prop.status === 'PENDING'
                  const isApproved = prop.status === 'APPROVED'
                  const isRejected = prop.status === 'REJECTED'
                  const isExpanded = expandedProposalComments[prop.id]

                  return (
                    <div
                      key={prop.id}
                      className={`bg-white rounded-2xl p-5 border transition-all shadow-sm ${
                        isApproved
                          ? 'border-green-300 bg-green-50/30'
                          : isRejected
                          ? 'border-slate-200 opacity-60 bg-slate-50/50'
                          : 'border-slate-200 hover:border-[#0ea5e9]/30'
                      }`}
                    >
                      {/* Proposal header info */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#38bdf8] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                            {prop.proposedBy ? prop.proposedBy.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{prop.proposedBy}</span>
                              <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-medium">Đề xuất</span>
                            </div>
                            <span className="text-[9px] text-slate-500 block mt-0.5">
                              {new Date(prop.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div>
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 bg-sky-50 text-[#0ea5e9] border border-[#0ea5e9]/20 rounded-lg uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse"></span>
                              Đang thảo luận
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 bg-green-50 text-green-600 border border-green-200 rounded-lg uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[10px] font-black">done</span>
                              Đã duyệt & Ban hành
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[10px] font-black">close</span>
                              Đã từ chối
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Proposal content */}
                      <div className="my-4 pl-1">
                        <p className="text-sm text-slate-800 font-bold leading-relaxed">{prop.text}</p>
                      </div>

                      {/* Actions & Reactions toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          {/* Vote button */}
                          <button
                            onClick={() => handleVoteProposal(prop.id)}
                            disabled={!isPending}
                            className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              hasVoted
                                ? 'bg-[#0ea5e9]/10 border-[#0ea5e9]/25 text-[#0ea5e9]'
                                : isPending
                                ? 'bg-slate-50 border-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 hover:border-slate-300'
                                : 'border-transparent text-slate-400'
                            }`}
                            title={hasVoted ? 'Bỏ đồng ý' : 'Đồng ý với đề xuất này'}
                          >
                            <span className="material-symbols-outlined text-sm shrink-0" style={hasVoted ? { fontVariationSettings: "'FILL' 1" } : {}}>thumb_up</span>
                            <span>Đồng ý ({prop.votes?.length || 0})</span>
                          </button>

                          {/* Downvote button */}
                          <button
                            onClick={() => handleDownvoteProposal(prop.id)}
                            disabled={!isPending}
                            className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              hasDownvoted
                                ? 'bg-rose-50 border-rose-200/60 text-rose-600'
                                : isPending
                                ? 'bg-slate-50 border-slate-200/80 text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 hover:border-rose-200'
                                : 'border-transparent text-slate-400'
                            }`}
                            title={hasDownvoted ? 'Bỏ không đồng ý' : 'Không đồng ý với đề xuất này'}
                          >
                            <span className="material-symbols-outlined text-sm shrink-0" style={hasDownvoted ? { fontVariationSettings: "'FILL' 1" } : {}}>thumb_down</span>
                            <span>Không đồng ý ({prop.downvotes?.length || 0})</span>
                          </button>

                          {/* Comment collapse toggle */}
                          <button
                            onClick={() => toggleProposalCommentVisibility(prop.id)}
                            className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              isExpanded
                                ? 'bg-[#0ea5e9]/10 border-[#0ea5e9]/25 text-[#0ea5e9]'
                                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 hover:border-slate-200'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs shrink-0" style={isExpanded ? { fontVariationSettings: "'FILL' 1" } : {}}>chat_bubble</span>
                            <span>Góp ý ({prop.comments?.length || 0})</span>
                          </button>
                        </div>

                        {/* Leader actions */}
                        {isPending && (
                          <div className="flex items-center gap-2">
                            {isLeader ? (
                              <>
                                <button
                                  onClick={() => handleApproveProposal(prop)}
                                  className="flex items-center gap-1 py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-green-900/10 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-xs font-black">done</span>
                                  Duyệt & Chốt
                                </button>
                                <button
                                  onClick={() => handleRejectProposal(prop.id)}
                                  className="flex items-center gap-1 py-1.5 px-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 border border-slate-200 hover:border-red-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                                >
                                  <span className="material-symbols-outlined text-xs font-black">close</span>
                                  Từ chối
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Chờ Leader chốt duyệt</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expanded Proposal Comment Feed */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">forum</span>
                            Ý kiến thảo luận & đóng góp cho mục này
                          </h5>

                          {/* Comment items */}
                          <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                            {prop.comments && prop.comments.length > 0 ? (
                              prop.comments.map((pc) => (
                                <div key={pc.id} className="flex gap-2 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                                    {pc.author ? pc.author.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold text-slate-800">{pc.author}</span>
                                      <span className="text-[8px] text-slate-400">
                                        {new Date(pc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">{pc.content}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-slate-500 italic text-center py-2">
                                Chưa có ý kiến góp ý nào. Hãy để lại ý kiến của bạn ở dưới!
                              </p>
                            )}
                          </div>

                          {/* Comment form */}
                          <form
                            onSubmit={(e) => handleAddProposalComment(e, prop.id)}
                            className="flex gap-1.5 pt-2 border-t border-slate-200"
                          >
                            <input
                              type="text"
                              value={proposalCommentsInputs[prop.id] || ''}
                              onChange={(e) =>
                                setProposalCommentsInputs((prev) => ({
                                  ...prev,
                                  [prop.id]: e.target.value
                                }))
                              }
                              placeholder="Ý kiến góp ý hoặc đề nghị chỉnh sửa..."
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-[#0ea5e9] text-slate-800 font-semibold text-xs rounded-lg outline-none"
                              required
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-[11px] font-bold rounded-lg cursor-pointer"
                            >
                              Gửi
                            </button>
                          </form>
                        </div>
                      )}

                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* UI guidelines alert box */}
          <div className="bg-[#0ea5e9]/5 border border-[#0ea5e9]/15 rounded-2xl p-4 text-[11px] text-slate-600 space-y-1 font-sans">
            <h4 className="font-black text-[#0ea5e9] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">info</span>
              Quy tắc tích hợp
            </h4>
            <p>Mục đích của trang này là thảo luận để thống nhất danh sách việc cần làm (Checklist). Checklist được phê duyệt sẽ được đồng bộ và hiển thị trên Kanban Board của dự án.</p>
          </div>

        </div>
      </div>
    </main>
  )
}
