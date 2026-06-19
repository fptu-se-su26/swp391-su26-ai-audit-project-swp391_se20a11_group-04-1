import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '@store/useAuthStore'
import { getInitials } from '@utils/avatarHelper'
import profileService from '../services/profileService'

export default function ProfilePage() {
  const { userId } = useParams()
  const isPublicView = !!userId
  const fetchMe = useAuthStore((state) => state.fetchMe)
  
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [coworkers, setCoworkers] = useState([])
  
  const [profileLoading, setProfileLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [coworkersLoading, setCoworkersLoading] = useState(true)
  
  // Profile update form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [updatingProfile, setUpdatingProfile] = useState(false)
  
  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  
  // Avatar upload state
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e) => {
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

  useEffect(() => {
    loadProfile()
    loadStats()
    loadCoworkers()
  }, [userId])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
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
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }
    setUpdatingPassword(true)
    const toastId = toast.loading('Changing password...')
    try {
      await profileService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      toast.success('Password changed successfully!', { id: toastId })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to change password', { id: toastId })
    } finally {
      setUpdatingPassword(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold text-on-surface-variant">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Header Account Card */}
      <div className="flex flex-col gap-6 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm dark:bg-surface-dim md:flex-row md:items-center">
        <div className="relative shrink-0 self-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profile?.fullName || profile?.username}
              className="h-20 w-20 rounded-full border border-outline-variant/60 object-cover shadow-sm"
              onError={(e) => {
                e.target.src = ''
                setAvatarUrl('')
              }}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-on-primary text-3xl font-bold shadow-md border border-outline-variant/60">
              {getInitials(profile?.fullName || profile?.username)}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1 text-center md:text-left">
          <div className="flex flex-col items-center gap-2 md:flex-row">
            <h1 className="text-2xl font-black text-on-surface">{profile?.fullName || profile?.username}</h1>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Update Profile & Change Password */}
        <div className="space-y-6 lg:col-span-2">
          {/* 2. Personal Information */}
          <form onSubmit={handleUpdateProfile} className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm dark:bg-surface-dim space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <span className="material-symbols-outlined text-primary">person</span>
              <h2 className="text-lg font-bold text-on-surface">Personal Information</h2>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl bg-surface-container-low border-none px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl bg-surface-container-low border-none px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Avatar URL / Upload File</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="flex-1 rounded-xl bg-surface-container-low border-none px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  placeholder="https://example.com/avatar.jpg"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl bg-secondary-container px-4 py-2.5 text-sm font-bold text-on-secondary-container hover:bg-secondary-container/90 transition-colors shrink-0 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-surface-container-low border-none px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="Tell us about yourself..."
              />
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:bg-primary/95 disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              {updatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* 3. Change Password */}
          <form onSubmit={handleChangePassword} className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm dark:bg-surface-dim space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <span className="material-symbols-outlined text-primary">lock</span>
              <h2 className="text-lg font-bold text-on-surface">Change Password</h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low border-none px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl bg-surface-container-low border-none px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl bg-surface-container-low border-none px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:bg-primary/95 disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">vpn_key</span>
              {updatingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Right Column: Projects & Roles */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm dark:bg-surface-dim space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <span className="material-symbols-outlined text-primary">folder_shared</span>
              <h2 className="text-lg font-bold text-on-surface">Projects & Roles</h2>
            </div>

            {profile?.projectRoles && profile.projectRoles.length > 0 ? (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {profile.projectRoles.map((role) => (
                  <div
                    key={role.projectId}
                    className="flex flex-col gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low p-3 shadow-inner"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-on-surface truncate" title={role.projectName}>
                        {role.projectName}
                      </h3>
                      {role.projectStatus && (
                        <span className="rounded bg-primary-container/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
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
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm dark:bg-surface-dim space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <span className="material-symbols-outlined text-primary">group</span>
              <h2 className="text-lg font-bold text-on-surface">Teammates / Co-workers</h2>
            </div>

            {coworkersLoading ? (
              <div className="py-6 text-center text-sm text-on-surface-variant">Loading teammates...</div>
            ) : coworkers && coworkers.length > 0 ? (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {coworkers.map((worker) => (
                  <div
                    key={worker.userId}
                    className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-3 shadow-inner"
                  >
                    <div className="relative shrink-0">
                      {worker.avatarUrl ? (
                        <img
                          src={worker.avatarUrl}
                          alt={worker.fullName}
                          className="h-10 w-10 rounded-full object-cover border border-outline-variant/40 shadow-sm"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-on-secondary text-sm font-bold shadow-inner border border-outline-variant/40">
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
                    <span className="shrink-0 rounded-full bg-primary-container px-2.5 py-0.5 text-[10px] font-bold text-on-primary-container shadow-sm border border-outline-variant/30">
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

      {/* 4. Statistics Section */}
      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm dark:bg-surface-dim space-y-4">
        <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3">
          <span className="material-symbols-outlined text-primary">bar_chart</span>
          <h2 className="text-lg font-bold text-on-surface">Light Statistics</h2>
        </div>

        {statsLoading ? (
          <div className="py-12 text-center text-sm text-on-surface-variant">Loading statistics...</div>
        ) : stats ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {/* Stat Item */}
            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">folder</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.totalProjects}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Total Projects</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">manage_accounts</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.leaderProjects}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Leader Projects</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">person</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.memberProjects}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Member Projects</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">assignment</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.totalAssignedTasks}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Assigned Tasks</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">task_alt</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.completedTasks}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Completed Tasks</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">done_all</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.onTimeCompletedTasks}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">On-Time Tasks</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">running_with_errors</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.overdueTasks}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Overdue Tasks</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">inventory_2</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.uploadedEvidenceCount}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Uploaded Evidence</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">notifications_active</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.slaActionCount}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">SLA Actions</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">warning</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.slaWarningCount}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">SLA Warnings</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">gavel</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.penaltyCount}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Penalties</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">verified</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.approvedRecoveryPlans}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Approved Recovery</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-inner">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-[22px]">cancel</span>
              <div>
                <p className="text-[20px] font-black text-on-surface leading-none">{stats.rejectedRecoveryPlans}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Rejected Recovery</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-on-surface-variant">Failed to load statistics data.</div>
        )}
      </div>
    </div>
  )
}
