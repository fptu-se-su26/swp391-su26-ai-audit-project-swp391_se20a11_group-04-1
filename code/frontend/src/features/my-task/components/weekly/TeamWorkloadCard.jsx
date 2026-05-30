/**
 * TeamWorkloadCard - Workload từng thành viên (Weekly right panel)
 * Nhận MemberProgressResponse[] từ backend (đã tính sẵn workloadPercent)
 *
 * Props:
 *   members: MemberProgressResponse[]
 *     { userId, name, initials, projectRole, totalTasks, doneTasks, inProgressTasks, lateTasks, workloadPercent }
 */

const AVATAR_COLORS = ['#1E3A5F', '#732900', '#505f76', '#16A34A', '#7C3AED', '#DC2626']

const TeamWorkloadCard = ({ members = [] }) => {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
      <h3 className="text-[15px] font-black text-gray-800 mb-5 tracking-tight">Team Workload</h3>

      {members.length === 0 ? (
        <p className="text-xs text-on-surface-variant text-center py-4">No data</p>
      ) : (
        <div className="space-y-4">
          {[...members].sort((a, b) => (b.workloadPercent ?? 0) - (a.workloadPercent ?? 0)).map((member, idx) => {
            const total      = member.totalTasks      || 0
            const done       = member.doneTasks        || 0
            const inProgress = member.inProgressTasks  || 0
            
            // Góc độ quản lý: Active tasks (Chưa xong) là thước đo độ bận rộn
            const activeTasks = total - done
            const MAX_CAPACITY = 5 // Sức chứa tối đa (tasks/tuần)
            const isOverloaded = activeTasks > MAX_CAPACITY

            const workloadWidth = Math.min(Math.round((activeTasks / MAX_CAPACITY) * 100), 100)

            const initials = member.initials
              || (member.name || '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
              || '?'

            const name = member.name || 'Unknown'
            const role = member.projectRole || ''

            return (
              <div key={member.userId || idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm ${isOverloaded ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
                      style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                    >
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-800 text-[12.5px]">
                          {name}
                        </span>
                        {role === 'LEADER' && (
                          <span className="px-1 py-[1.5px] rounded-[3px] bg-amber-100 text-amber-700 text-[7.5px] font-black tracking-wider uppercase">
                            LEADER
                          </span>
                        )}
                        {role === 'MEMBER' && (
                          <span className="px-1 py-[1.5px] rounded-[3px] bg-gray-100 text-gray-600 text-[7.5px] font-black tracking-wider uppercase">
                            MEMBER
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] text-gray-400 font-medium mt-0.5">
                        {done}/{total} tasks completed
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <span className={`font-black text-[13px] leading-none ${isOverloaded ? 'text-red-500 drop-shadow-sm' : 'text-gray-800'}`}>
                      {activeTasks}
                    </span>
                    <span className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${isOverloaded ? 'text-red-400' : 'text-gray-400'}`}>
                      Active
                    </span>
                  </div>
                </div>

                <div className={`h-1.5 w-full rounded-full overflow-hidden flex shadow-inner ${isOverloaded ? 'bg-red-100' : 'bg-gray-100'}`}>
                  {isOverloaded ? (
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 w-full animate-pulse shadow-[0_0_5px_rgba(225,29,72,0.6)]" />
                  ) : (
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.1)]" style={{ width: `${workloadWidth}%` }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 shadow-sm" />
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Capacity Used</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-sm animate-pulse" />
          <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide">Overloaded (&gt;5)</span>
        </div>
      </div>
    </div>
  )
}

export default TeamWorkloadCard
