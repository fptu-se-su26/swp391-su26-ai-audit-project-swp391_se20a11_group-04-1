import { useMemo } from 'react'
import useAuthStore from '@/store/useAuthStore'
import useProjectStore from '@/store/useProjectStore'

/**
 * Hook để lấy role của user hiện tại trong dự án đang mở
 * @returns {{ isLeader: boolean, isMember: boolean, role: string, memberId: string | number }}
 */
export const useProjectRole = () => {
  const userId = useAuthStore((state) => state.userId)
  const activeProject = useProjectStore((state) => state.activeProject)

  const roleInfo = useMemo(() => {
    if (!activeProject || !userId) {
      return { isLeader: false, isMember: false, role: null, memberId: null }
    }

    // Convert userId from authStore (string) to number if necessary, or just == comparison
    const currentMember = activeProject.members?.find((m) => String(m.id) === String(userId))
    
    if (!currentMember) {
      return { isLeader: false, isMember: false, role: null, memberId: null }
    }

    // role can be a string like "LEADER" or an object like { name: "LEADER" }
    const roleName = typeof currentMember.role === 'object' && currentMember.role !== null 
                      ? currentMember.role.name?.toUpperCase() 
                      : String(currentMember.role || '').toUpperCase()

    const isLeader = roleName.includes('LEADER') || roleName.includes('MENTOR')
    const isMember = roleName.includes('MEMBER')

    return { 
      isLeader, 
      isMember, 
      role: roleName, 
      memberId: currentMember.id 
    }
  }, [activeProject, userId])

  return roleInfo
}

export default useProjectRole
