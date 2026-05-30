/**
 * MemberProgressPanel - Tiến độ từng thành viên (Daily View right panel)
 * Nhận data từ MemberProgressResponse (backend đã tính sẵn)
 *
 * Props:
 *   members: MemberProgressResponse[]
 *     { userId, name, initials, projectRole, totalTasks, doneTasks, inProgressTasks, lateTasks, workloadPercent }
 */

const AVATAR_COLORS = ['#1E3A5F', '#732900', '#505f76', '#16A34A', '#7C3AED', '#DC2626']

const MemberProgressPanel = ({ members = [] }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm shrink-0">
      <h4 className="font-black text-gray-800 text-[15px] mb-5 tracking-tight">Team Daily Status</h4>

      {members.length === 0 ? (
        <p className="text-[12px] text-gray-400 text-center py-4">No data</p>
      ) : (
        <div className="space-y-4">
          {members.map((member, idx) => {
            const total   = member.totalTasks    || 0
            const done    = member.doneTasks      || 0
            const late    = member.lateTasks      || 0
            const inProgress = member.inProgressTasks || 0
            
            // Tính số task chưa đụng tới (To do)
            const todo = total - done - late - inProgress

            const initials = member.initials
              || (member.name || '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
              || '?'

            return (
              <div key={member.userId || idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm"
                    style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                  >
                    {initials}
                  </div>
                  <span className="text-[12.5px] font-bold text-gray-800">
                    {member.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {total === 0 ? (
                    <span className="px-1.5 py-[2px] rounded bg-gray-100 text-gray-500 text-[9px] font-bold uppercase tracking-wider">
                      Free today
                    </span>
                  ) : (
                    <>
                      {late > 0 && (
                        <span className="px-1.5 py-[2px] rounded bg-red-100 text-red-600 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          {late} Overdue
                        </span>
                      )}
                      {inProgress > 0 && (
                        <span className="px-1.5 py-[2px] rounded bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider border border-blue-100">
                          {inProgress} Ongoing
                        </span>
                      )}
                      {done > 0 && (
                        <span className="px-1.5 py-[2px] rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wider border border-emerald-100">
                          {done} Done
                        </span>
                      )}
                      {todo > 0 && late === 0 && inProgress === 0 && done === 0 && (
                        <span className="px-1.5 py-[2px] rounded bg-gray-50 text-gray-500 text-[9px] font-bold uppercase tracking-wider border border-gray-200">
                          {todo} To Do
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MemberProgressPanel
