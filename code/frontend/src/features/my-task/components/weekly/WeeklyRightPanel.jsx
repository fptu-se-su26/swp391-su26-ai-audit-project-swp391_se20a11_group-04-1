import SprintOverviewCard from './SprintOverviewCard'
import TeamWorkloadCard from './TeamWorkloadCard'
import AiWeeklyInsightCard from './AiWeeklyInsightCard'

/**
 * WeeklyRightPanel - Panel bên phải gồm 3 card
 * Props:
 *   sprintProgress: object  → SprintOverviewCard
 *   teamWorkload: array     → TeamWorkloadCard
 *   aiInsight: object       → AiWeeklyInsightCard
 *   onViewReport: function
 */
const WeeklyRightPanel = ({ sprintProgress, activeSprint, teamWorkload, aiInsight, onViewReport }) => {
  return (
    <aside className="col-span-3 space-y-4">
      <SprintOverviewCard sprintProgress={sprintProgress} activeSprint={activeSprint} />
      <TeamWorkloadCard members={teamWorkload} />
      <AiWeeklyInsightCard insight={aiInsight} onViewReport={onViewReport} />
    </aside>
  )
}

export default WeeklyRightPanel
