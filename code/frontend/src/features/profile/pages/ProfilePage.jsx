import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '@store/useAuthStore'
import { getInitials } from '@utils/avatarHelper'
import profileService from '../services/profileService'

export default function ProfilePage() {
  const { userId } = useParams()
  const location = useLocation()
  const currentUserId = useAuthStore((state) => state.userId)
  const canEditProfile = !userId || String(userId) === String(currentUserId)
  const isPublicView = !canEditProfile
  const fetchMe = useAuthStore((state) => state.fetchMe)
  
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [coworkers, setCoworkers] = useState([])
  
  const [profileLoading, setProfileLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [coworkersLoading, setCoworkersLoading] = useState(true)

  // GitHub integration state
  const [githubStatus, setGithubStatus] = useState(null)
  const [githubLoading, setGithubLoading] = useState(true)
  
  // Profile update form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [updatingProfile, setUpdatingProfile] = useState(false)

  // Password update form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  // Avatar upload state
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  
  // Avatar Viewer state
  const [isAvatarViewerOpen, setIsAvatarViewerOpen] = useState(false)
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false)
  const handleFileChange = async (e) => {
    if (!canEditProfile) return
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const toastId = toast.loading('Uploading avatar image...')
    try {
      const url = await profileService.uploadAvatar(file)
      setAvatarUrl(url)
      toast.success('Avatar uploaded successfully!', { id: toastId })
    } catch (error) {
      console.error(error)
      const errorMsg = error.response?.data?.message || error.message || 'Failed to upload avatar image'
      toast.error(`Upload failed: ${errorMsg}`, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const loadProfile = async () => {
    setProfileLoading(true)
    try {
      const data = await profileService.getProfile(userId)
      setProfile(data)
      setFullName(data?.fullName || '')
      setPhone(data?.phone || '')
      setBio(data?.bio || '')
      setAvatarUrl(data?.avatarUrl || '')
    } catch (error) {
      console.error(error)
      toast.error('Failed to load profile details')
    } finally {
      setProfileLoading(false)
    }
  }

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const data = await profileService.getProfileStatistics(userId)
      setStats(data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load statistics')
    } finally {
      setStatsLoading(false)
    }
  }

  const loadCoworkers = async () => {
    setCoworkersLoading(true)
    try {
      const data = await profileService.getCoWorkers(userId)
      setCoworkers(data || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load teammates')
    } finally {
      setCoworkersLoading(false)
    }
  }

  const loadGithubStatus = async () => {
    if (isPublicView) {
      setGithubLoading(false)
      return
    }
    setGithubLoading(true)
    try {
      const data = await profileService.getGithubStatus()
      setGithubStatus(data)
    } catch (error) {
      console.error(error)
    } finally {
      setGithubLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    loadStats()
    loadCoworkers()
    loadGithubStatus()
  }, [userId])

  useEffect(() => {
    if (location.state?.openSettings) {
      setShowPasswordDialog(true)
    } else {
      setShowPasswordDialog(false)
    }
  }, [location.state])

  const handleConnectGithub = async () => {
    try {
      const authUrl = await profileService.getGithubAuthUrl()
      const state = btoa(JSON.stringify({ fromProfile: true }))
      window.location.href = `${authUrl}&state=${state}`
    } catch (error) {
      console.error(error)
      toast.error('Failed to get GitHub authorization link.')
    }
  }

  const handleDisconnectGithub = async () => {
    if (!window.confirm('Are you sure you want to disconnect your GitHub account?')) return
    const toastId = toast.loading('Disconnecting GitHub account...')
    try {
      await profileService.disconnectGithub()
      setGithubStatus(null)
      toast.success('GitHub account disconnected successfully!', { id: toastId })
      loadGithubStatus()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to disconnect GitHub account.', { id: toastId })
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!canEditProfile) {
      toast.error('You can only update your own profile')
      return
    }
    setUpdatingProfile(true)
    const toastId = toast.loading('Saving profile changes...')
    try {
      const updated = await profileService.updateProfile({
        fullName,
        phone,
        bio,
        avatarUrl,
      })
      setProfile(updated)
      toast.success('Profile updated successfully!', { id: toastId })
      // Sync with auth store to update top bar and avatar names
      await fetchMe()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to update profile', { id: toastId })
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!canEditProfile) {
      toast.error('You can only change your own password')
      return
    }
    if (!currentPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu hiện tại')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp')
      return
    }

    setUpdatingPassword(true)
    const toastId = toast.loading('Đang đổi mật khẩu...')
    try {
      await profileService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Đổi mật khẩu thành công!', { id: toastId })
      setShowPasswordDialog(false)
      await loadProfile()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu', { id: toastId })
    } finally {
      setUpdatingPassword(false)
    }
  }

  const closePasswordDialog = () => {
    if (updatingPassword) return
    setShowPasswordDialog(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  if (profileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E707D] border-t-transparent"></div>
          <p className="text-sm font-semibold text-on-surface-variant">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      {/* 1. Header Account Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm dark:bg-surface-dim md:flex-row md:items-center">
        <div className="relative shrink-0 self-center">
          <div 
            className="relative h-16 w-16 rounded-full border border-outline-variant/60 shadow-sm overflow-hidden cursor-pointer group"
            onClick={() => setIsAvatarViewerOpen(true)}
            title="Xem ảnh đại diện"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile?.fullName || profile?.username}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.src = ''
                  setAvatarUrl('')
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#1E707D] text-white text-2xl font-bold">
                {getInitials(profile?.fullName || profile?.username)}
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white">zoom_in</span>
            </div>
          </div>
          
          {!isPublicView && (
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          )}
        </div>
        <div className="flex-1 space-y-1 text-center md:text-left">
          <div className="flex flex-col items-center gap-2 md:flex-row">
            <h1 className="text-xl font-black text-on-surface md:text-2xl">{profile?.fullName || profile?.username}</h1>
            <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
              Active
            </span>
          </div>
          <p className="text-sm text-on-surface-variant font-medium">@{profile?.username}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-on-surface-variant md:justify-start">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">mail</span>
              {profile?.email}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              System Role: {profile?.systemRole}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column: Update Profile */}
        <div className="space-y-4 lg:col-span-2">
          {/* 2. Personal Information */}
          <form onSubmit={handleUpdateProfile} className="space-y-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm dark:bg-surface-dim">
            <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-2.5">
              <span className="material-symbols-outlined text-[#1E707D]">person</span>
              <h2 className="text-base font-bold text-on-surface">Personal Information</h2>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!canEditProfile}
                  className="w-full rounded-lg bg-surface-container-low border-none px-3 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!canEditProfile}
                  className="w-full rounded-lg bg-surface-container-low border-none px-3 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>



            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                disabled={!canEditProfile}
                className="w-full rounded-lg bg-surface-container-low border-none px-3 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="Tell us about yourself..."
              />
            </div>

            {canEditProfile && (
              <button
                type="submit"
                disabled={updatingProfile}
                className="flex items-center gap-2 rounded-lg bg-[#1E707D] px-4 py-2 text-sm font-bold text-white hover:bg-[#1E707D]/95 disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                {updatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>

          {/* GitHub Connection */}
          {!isPublicView && (
            <div className="space-y-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm dark:bg-surface-dim">
              <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-2.5">
                <span className="material-symbols-outlined text-[#1E707D]">link</span>
                <h2 className="text-base font-bold text-on-surface">GitHub Integration</h2>
              </div>

              {githubLoading ? (
                <div className="flex items-center justify-center py-4 text-on-surface-variant text-sm font-medium">
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  Checking GitHub link status...
                </div>
              ) : githubStatus?.hasToken ? (
                <div className="flex flex-col gap-4 rounded-lg bg-surface-container-low p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    {githubStatus.avatarUrl ? (
                      <img
                        src={githubStatus.avatarUrl}
                        alt={githubStatus.username}
                        className="h-11 w-11 rounded-full border border-outline-variant object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1E707D] text-white text-lg font-bold">
                        {githubStatus.username?.substring(0, 2).toUpperCase() || 'GH'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-black text-on-surface">{githubStatus.name || githubStatus.username}</p>
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-green-600 dark:text-green-400">
                          Connected
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-on-surface-variant">@{githubStatus.username}</p>
                      {githubStatus.email && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">mail</span>
                          {githubStatus.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConnectGithub}
                      className="shrink-0 rounded-lg border border-outline px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container"
                    >
                      Reconnect
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGithub}
                      className="shrink-0 rounded-lg bg-error/10 px-3 py-2 text-xs font-bold text-error transition-colors hover:bg-error/25"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Link your GitHub account to enable automatic sync for task issues, commit activity, pull requests, and audit evidence reports.
                  </p>
                  <button
                    type="button"
                    onClick={handleConnectGithub}
                    className="flex items-center gap-2 rounded-lg bg-[#24292e] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#24292e]/90"
                  >
                    <span className="material-symbols-outlined text-lg">link</span>
                    Connect GitHub Account
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. Statistics Section */}
          <div className="space-y-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm dark:bg-surface-dim">
            <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-2.5">
              <span className="material-symbols-outlined text-[#1E707D]">bar_chart</span>
              <h2 className="text-base font-bold text-on-surface">Statistics</h2>
            </div>

            {statsLoading ? (
              <div className="py-12 text-center text-sm text-on-surface-variant">Loading statistics...</div>
            ) : stats ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-low p-3">
                  <span className="material-symbols-outlined rounded-md bg-[#1E707D]/10 p-2 text-[20px] text-[#1E707D]">folder_shared</span>
                  <div className="min-w-0">
                    <p className="text-xl font-black leading-none text-on-surface">{stats.totalProjects}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Dự án tham gia</p>
                    <p className="mt-1 text-xs font-medium text-on-surface-variant">
                      Leader {stats.leaderProjects} • Member {stats.memberProjects}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-low p-3">
                  <span className="material-symbols-outlined rounded-md bg-[#1E707D]/10 p-2 text-[20px] text-[#1E707D]">assignment</span>
                  <div className="min-w-0">
                    <p className="text-xl font-black leading-none text-on-surface">{stats.totalAssignedTasks}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Công việc được giao</p>
                    <p className="mt-1 text-xs font-medium text-on-surface-variant">
                      Hoàn thành {stats.completedTasks} • Trễ hạn {stats.overdueTasks}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-green-200/70 bg-green-50 p-3 dark:border-green-900/40 dark:bg-green-950/20">
                  <span className="material-symbols-outlined rounded-md bg-green-500/10 p-2 text-[20px] text-green-600 dark:text-green-400">workspace_premium</span>
                  <div className="min-w-0">
                    <p className="text-xl font-black leading-none text-on-surface">{stats.onTimeCompletedTasks}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">Thành tích</p>
                    <p className="mt-1 text-xs font-medium text-on-surface-variant">
                      Việc đúng hạn • {stats.approvedRecoveryPlans} kế hoạch khắc phục được duyệt
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-red-200/70 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
                  <span className="material-symbols-outlined rounded-md bg-red-500/10 p-2 text-[20px] text-red-600 dark:text-red-400">gavel</span>
                  <div className="min-w-0">
                    <p className="text-xl font-black leading-none text-on-surface">{stats.penaltyCount}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">Phạt / cảnh báo</p>
                    <p className="mt-1 text-xs font-medium text-on-surface-variant">
                      {stats.slaWarningCount} cảnh báo SLA • {stats.rejectedRecoveryPlans} kế hoạch bị từ chối
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-on-surface-variant">Failed to load statistics data.</div>
            )}
          </div>
        </div>

        {/* Right Column: Projects & Roles */}
        <div className="space-y-4">
          <div className="space-y-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm dark:bg-surface-dim">
            <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-2.5">
              <span className="material-symbols-outlined text-[#1E707D]">folder_shared</span>
              <h2 className="text-base font-bold text-on-surface">Projects & Roles</h2>
            </div>

            {profile?.projectRoles && profile.projectRoles.length > 0 ? (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {profile.projectRoles.map((role) => (
                  <div
                    key={role.projectId}
                    className="flex flex-col gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-on-surface truncate" title={role.projectName}>
                        {role.projectName}
                      </h3>
                      {role.projectStatus && (
                        <span className="rounded bg-[#D7EEF1]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#1E707D]">
                          {role.projectStatus}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant font-medium">
                      <span className="rounded bg-secondary-container text-on-secondary-container px-2 py-0.5 font-bold uppercase tracking-wider text-[10px]">
                        {role.roleName}
                      </span>
                      {role.joinedAt && (
                        <span>
                          Joined: {new Date(role.joinedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-on-surface-variant">
                You are not a member of any projects yet.
              </div>
            )}
          </div>

          {/* Teammates / Co-workers card */}
          <div className="space-y-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm dark:bg-surface-dim">
            <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-2.5">
              <span className="material-symbols-outlined text-[#1E707D]">group</span>
              <h2 className="text-base font-bold text-on-surface">Teammates</h2>
            </div>

            {coworkersLoading ? (
              <div className="py-6 text-center text-sm text-on-surface-variant">Loading teammates...</div>
            ) : coworkers && coworkers.length > 0 ? (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {coworkers.map((worker) => (
                  <div
                    key={worker.userId}
                    className="flex items-center gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-low p-2.5"
                  >
                    <div className="relative shrink-0">
                      {worker.avatarUrl ? (
                        <img
                          src={worker.avatarUrl}
                          alt={worker.fullName}
                          className="h-9 w-9 rounded-full object-cover border border-outline-variant/40 shadow-sm"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-on-secondary text-sm font-bold shadow-inner border border-outline-variant/40">
                          {getInitials(worker.fullName || worker.username)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-on-surface truncate" title={worker.fullName}>
                        {worker.fullName}
                      </h3>
                      <p className="text-xs text-on-surface-variant truncate text-left">@{worker.username}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#D7EEF1] px-2.5 py-0.5 text-[10px] font-bold text-[#1E707D] shadow-sm border border-outline-variant/30">
                      {worker.sharedProjectsCount} {worker.sharedProjectsCount === 1 ? 'project' : 'projects'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-on-surface-variant">
                No teammates found.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Change Password Dialog */}
      {canEditProfile && showPasswordDialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleChangePassword}
            className="w-full max-w-xl space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-2xl dark:bg-surface-dim"
          >
            <div className="flex items-center justify-between gap-3 border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1E707D]">lock_reset</span>
                <h2 className="text-base font-bold text-on-surface">Đổi mật khẩu</h2>
              </div>
              <button
                type="button"
                onClick={closePasswordDialog}
                disabled={updatingPassword}
                className="rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-lg bg-surface-container-low border-none px-3 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  placeholder="Nhập mật khẩu hiện tại"
                  autoFocus
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-lg bg-surface-container-low border-none px-3 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-lg bg-surface-container-low border-none px-3 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closePasswordDialog}
                disabled={updatingPassword}
                className="rounded-lg px-4 py-2 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={updatingPassword}
                className="flex items-center gap-2 rounded-lg bg-[#1E707D] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1E707D]/95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">lock_reset</span>
                {updatingPassword ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Avatar Viewer Modal */}
      {isAvatarViewerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            
            {/* Top Bar Actions */}
            <div className="absolute -top-14 right-0 flex items-center gap-3">
              {!isPublicView && (
                <div className="relative">
                  <button 
                    onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                    className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
                  >
                    <span className="material-symbols-outlined text-[24px]">more_vert</span>
                  </button>

                  {/* Dropdown Menu */}
                  {isAvatarMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/50 overflow-hidden z-[110] animate-in slide-in-from-top-2">
                      <button
                        onClick={() => { fileInputRef.current?.click(); setIsAvatarMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[#1E707D]">edit</span>
                        Đổi ảnh mới
                      </button>
                      {avatarUrl && (
                        <button
                          onClick={() => {
                            setAvatarUrl('');
                            setIsAvatarViewerOpen(false);
                            setIsAvatarMenuOpen(false);
                            toast.success('Đã xóa ảnh tạm thời. Bấm Save Changes để lưu chính thức!');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-error hover:bg-error/10 transition-colors text-left border-t border-outline-variant/30"
                        >
                          <span className="material-symbols-outlined text-error">delete</span>
                          Xóa ảnh
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button 
                onClick={() => setIsAvatarViewerOpen(false)}
                className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            {/* Image Preview (Full, Uncropped) */}
            <div className="relative max-w-full max-h-[80vh] rounded-xl flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Full" className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />
              ) : (
                <div className="flex h-[300px] w-[300px] items-center justify-center bg-[#1E707D] text-white text-[100px] font-bold rounded-xl shadow-2xl">
                  {getInitials(profile?.fullName || profile?.username)}
                </div>
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 rounded-xl">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                  <span className="text-white font-bold tracking-wider text-lg">Uploading...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
