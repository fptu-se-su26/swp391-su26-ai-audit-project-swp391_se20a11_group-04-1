import { useMemo } from 'react'
import useAuthStore from '@/store/useAuthStore'
import useProjectStore from '@/store/useProjectStore'

const normalizeRole = (role) => {
  if (!role) return ''
  if (typeof role === 'object') {
    return normalizeRole(role.name || role.roleName || role.code || role.value)
  }
  return String(role).trim().toUpperCase().replace(/\s+/g, '_')
}

const resolveMemberUserId = (member) => member?.userId || member?.id || member?.user?.id || member?.accountId

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

    const currentMember = activeProject.members?.find((m) => String(resolveMemberUserId(m)) === String(userId))
    
    if (!currentMember) {
      return { isLeader: false, isMember: false, role: null, memberId: null }
    }

    const roleName = normalizeRole(
      currentMember.role
      || currentMember.projectRole
      || currentMember.roleName
      || currentMember.projectRoleName
    )

    const isLeader = roleName.includes('LEADER') || roleName.includes('MENTOR')
    const isMember = roleName.includes('MEMBER') || roleName.includes('DEVELOPER')

    return { 
      isLeader, 
      isMember, 
      role: roleName, 
      memberId: resolveMemberUserId(currentMember)
    }
  }, [activeProject, userId])

  return roleInfo
}

export default useProjectRole
