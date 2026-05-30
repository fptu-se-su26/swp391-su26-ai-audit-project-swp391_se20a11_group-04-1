import TaskCard from './TaskCard'

/**
 * TaskColumn - 1 cột trong Daily View
 * Props:
 *   title: string
 *   count: number
 *   tasks: array
 *   variant: 'overdue' | 'due' | 'done'
 *   onTaskClick: function
 */
const COLUMN_CONFIG = {
  overdue: {
    icon: 'report',
    iconColor: 'text-[#DC2626]',
    titleColor: 'text-[#DC2626]',
    badgeBg: 'bg-[#DC2626]',
  },
  due: {
    icon: 'schedule',
    iconColor: 'text-[#D97706]',
    titleColor: 'text-[#D97706]',
    badgeBg: 'bg-[#D97706]',
  },
  ongoing: {
    icon: 'sync',
    iconColor: 'text-[#2563EB]',
    titleColor: 'text-[#2563EB]',
    badgeBg: 'bg-[#2563EB]',
  },
  done: {
    icon: 'check_circle',
    iconColor: 'text-[#16A34A]',
    titleColor: 'text-[#16A34A]',
    badgeBg: 'bg-[#16A34A]',
  },
}

const COLUMN_TITLE = {
  overdue: 'OVERDUE & BLOCKED',
  due:     'DUE TODAY',
  ongoing: 'ONGOING',
  done:    'DONE TODAY',
}

const TaskColumn = ({ variant = 'due', tasks = [], onTaskClick }) => {
  const config = COLUMN_CONFIG[variant]

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined ${config.iconColor} text-[18px]`}>
            {config.icon}
          </span>
          <h3 className={`font-bold ${config.titleColor} uppercase text-[13px]`}>
            {COLUMN_TITLE[variant]}
          </h3>
        </div>
        <div className={`w-[22px] h-[22px] rounded-full ${config.badgeBg} flex items-center justify-center text-white text-[11px] font-bold`}>
          {tasks.length}
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-[12px] text-[#9CA3AF] py-6 border border-dashed border-[#E5E7EB] rounded-[10px]">
            Không có task
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              variant={variant}
              onClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default TaskColumn
