import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import bugService from '../services/bugService'
import axiosInstance from '@/api/axiosConfig'

const CODE_INSIGHT_RECOMMENDED_EVENTS = ['issues', 'push', 'pull_request', 'workflow_run', 'check_run']
const REQUIRED_CODE_INSIGHT_EVENTS = ['issues', 'push', 'pull_request', 'workflow_run', 'check_run']

export function ProjectGithubConfig() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const activeProject = useProjectStore((state) => state.activeProject)

  const [hasToken, setHasToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [repoOwner, setRepoOwner] = useState('')
  const [repoName, setRepoName] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [searchRepo, setSearchRepo] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Status state
  const [webhookStatus, setWebhookStatus] = useState('PENDING')
  const [lastWebhookReceivedAt, setLastWebhookReceivedAt] = useState(null)
  const [pinging, setPinging] = useState(false)
  const [autoConfiguring, setAutoConfiguring] = useState(false)
  
  // Github Repos
  const [userRepos, setUserRepos] = useState([])
  const [loadingRepos, setLoadingRepos] = useState(false)

  // Deliveries
  const [deliveries, setDeliveries] = useState([])
  const [loadingDeliveries, setLoadingDeliveries] = useState(false)
  const [showDeliveries, setShowDeliveries] = useState(false)
  const [redelivering, setRedelivering] = useState(null)

  // Rate Limit
  const [rateLimit, setRateLimit] = useState(null)

  // Create Repo Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRepoName, setNewRepoName] = useState('')
  const [newRepoDesc, setNewRepoDesc] = useState('')
  const [newRepoPrivate, setNewRepoPrivate] = useState(false)
  const [creatingRepo, setCreatingRepo] = useState(false)

  // Advanced Webhook Modal
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [webhookEventType, setWebhookEventType] = useState('recommended')
  const [selectedEvents, setSelectedEvents] = useState(CODE_INSIGHT_RECOMMENDED_EVENTS)
  
  const defaultWebhookUrl = `${window.location.origin}/api/v1/github/webhook`
  const [webhookUrlInput, setWebhookUrlInput] = useState(defaultWebhookUrl)
  const [webhookSecretInput, setWebhookSecretInput] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [isEditingConfig, setIsEditingConfig] = useState(false)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      if (!projectId) return
      setLoading(true)
      try {
        const config = await bugService.getGithubConfig(projectId)
        if (config) {
          setRepoOwner(config.repoOwner || '')
          setRepoName(config.repoName || '')
          setWebhookSecret(config.webhookSecret || '')
          setWebhookSecretInput(config.webhookSecret || '')
          setWebhookStatus(config.webhookStatus || 'PENDING')
          setLastWebhookReceivedAt(config.lastWebhookReceivedAt || null)
          if (config.configuredWebhookUrl) {
            setWebhookUrlInput(config.configuredWebhookUrl)
          }
          if (config.repoOwner && config.repoName) {
            setSearchRepo(`${config.repoOwner}/${config.repoName}`)
            setIsEditingConfig(false)
            // Config đã lưu, load rate limit để hiển thị
            fetchRateLimit()
            fetchDeliveries()
          } else {
            // Chưa có config => vào edit mode và load repos
            setIsEditingConfig(true)
            if (config.hasToken) {
              fetchRepos()
            }
          }
          setHasToken(config.hasToken || false)
        } else {
          setIsEditingConfig(true)
          // Không có config, chưa có token => chưa cần load repos
        }
      } catch (err) {
        console.error('Error loading config:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchConfig()
  }, [projectId])

  const fetchRepos = async () => {
    setLoadingRepos(true)
    try {
      const res = await axiosInstance.get('/v1/github/repos')
      setUserRepos(res.data?.data || [])
    } catch (err) {
      console.error('Failed to fetch repos', err)
      toast.error('Failed to fetch your GitHub repositories.')
    } finally {
      setLoadingRepos(false)
    }
  }

  const fetchRateLimit = async () => {
    try {
      const res = await axiosInstance.get(`/v1/projects/${projectId}/github-integration/rate-limit`)
      setRateLimit(res.data?.data || null)
    } catch (err) {
      console.error('Failed to fetch rate limit', err)
    }
  }

  const fetchDeliveries = async () => {
    setLoadingDeliveries(true)
    try {
      const data = await bugService.getWebhookDeliveries(projectId)
      setDeliveries(data || [])
    } catch (err) {
      toast.error('Failed to fetch deliveries')
    } finally {
      setLoadingDeliveries(false)
    }
  }

  const handleRedeliver = async (deliveryId) => {
    setRedelivering(deliveryId)
    try {
      await bugService.redeliverWebhook(projectId, deliveryId)
      toast.success('Redelivery triggered!')
      fetchDeliveries()
    } catch (err) {
      toast.error('Failed to redeliver')
    } finally {
      setRedelivering(null)
    }
  }

  const handleConnectGitHub = async () => {
    try {
      const res = await axiosInstance.get('/v1/github/auth-url')
      const state = btoa(JSON.stringify({ projectId }))
      // Redirect to github auth url
      window.location.href = res.data.data + "&state=" + state
    } catch (error) {
      console.error("OAuth Init Error:", error);
      toast.error('Failed to initialize GitHub OAuth: ' + (error.response?.data?.message || error.message))
    }
  }

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let secret = ''
    for (let i = 0; i < 24; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setWebhookSecret(secret)
    toast.success('Generated a secure webhook secret!')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!repoOwner.trim() || !repoName.trim()) {
      toast.error('Please select a repository!')
      return
    }

    setSaving(true)
    try {
      const config = await bugService.saveGithubConfig(projectId, {
        repoOwner,
        repoName,
        webhookSecret,
      })
      toast.success('GitHub configuration saved successfully!')
      setWebhookStatus(config.webhookStatus || 'PENDING')
      setLastWebhookReceivedAt(config.lastWebhookReceivedAt || null)
      setWebhookSecretInput(webhookSecret) // sync to modal
      setIsEditingConfig(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handlePingWebhook = async () => {
    if (!projectId) return
    setPinging(true)
    try {
      await bugService.pingWebhook(projectId)
      toast.success('Ping requested from GitHub! Waiting for delivery...')
      setTimeout(async () => {
        try {
          const config = await bugService.getGithubConfig(projectId)
          if (config) {
            setWebhookStatus(config.webhookStatus || 'PENDING')
            setLastWebhookReceivedAt(config.lastWebhookReceivedAt || null)
          }
        } catch(e){}
        setPinging(false)
      }, 3000)
    } catch (err) {
      toast.error('Failed to trigger webhook ping')
      setPinging(false)
    }
  }

  const handleAutoConfigureWebhook = async (e) => {
    if (e) e.preventDefault()
    if (!projectId) return

    let eventsToSend = CODE_INSIGHT_RECOMMENDED_EVENTS
    if (webhookEventType === 'custom') {
      eventsToSend = selectedEvents
      if (eventsToSend.length === 0) {
        toast.error('Please select at least one event.')
        return
      }
      const missing = REQUIRED_CODE_INSIGHT_EVENTS.filter((eventName) => !eventsToSend.includes(eventName))
      if (missing.length > 0) {
        toast(`Warning: webhook is missing ${missing.join(', ')}. Code Insight may not link all evidence.`)
      }
    }

    setAutoConfiguring(true)
    try {
      await bugService.autoConfigureWebhook(projectId, webhookUrlInput, eventsToSend, webhookSecretInput)
      toast.success('Webhook configured successfully on GitHub!')
      setWebhookSecret(webhookSecretInput) // sync to main form
      setShowWebhookModal(false)
      // Auto-trigger a ping to verify
      handlePingWebhook()
    } catch (err) {
      toast.error('Failed to configure webhook: ' + (err.response?.data?.message || err.message))
    } finally {
      setAutoConfiguring(false)
    }
  }

  const handleEventCheckboxChange = (eventValue) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventValue)) {
        return prev.filter(e => e !== eventValue)
      } else {
        return [...prev, eventValue]
      }
    })
  }

  const handleCreateNewRepo = async (e) => {
    e.preventDefault()
    if (!newRepoName.trim()) return

    setCreatingRepo(true)
    try {
      const res = await bugService.createGithubRepo({
        name: newRepoName.trim(),
        description: newRepoDesc.trim(),
        isPrivate: newRepoPrivate
      })
      toast.success('Repository created successfully on GitHub!')
      
      const repoFullName = res.full_name
      
      // Update local repos state
      setUserRepos(prev => [res, ...prev])
      
      // Auto select
      const [owner, name] = repoFullName.split('/')
      setRepoOwner(owner)
      setRepoName(name)
      setSearchRepo(repoFullName)
      
      // Reset and close
      setShowCreateModal(false)
      setNewRepoName('')
      setNewRepoDesc('')
      setNewRepoPrivate(false)
    } catch (err) {
      toast.error('Failed to create repository: ' + (err.response?.data?.message || err.message))
    } finally {
      setCreatingRepo(false)
    }
  }

  const isLeader = activeProject?.role === 'Project Leader'
  if (!isLeader) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-surface-container-lowest p-8 rounded-2xl shadow-lg">
          <h3 className="font-extrabold text-xl text-on-surface">Access Denied</h3>
          <p className="text-sm text-on-surface-variant">Only Project Leaders can edit GitHub configurations.</p>
        </div>
      </main>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/projects/${projectId}/issues`)} className="hover:bg-surface-container p-2 rounded-full">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">webhook</span>
            GitHub Integration
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Connect this project to a GitHub repository to sync issues automatically.</p>
        </div>
      </div>



      {loading ? (
        <div className="flex justify-center p-12">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
        </div>
      ) : !hasToken ? (
        // NOT CONNECTED VIEW
        <div className="bg-surface-container-lowest rounded-3xl p-10 text-center shadow-lg border border-outline-variant/50 flex flex-col items-center">
          <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" className="w-24 h-24 mb-6 opacity-90" />
          <h2 className="text-2xl font-black mb-3">Link Your GitHub Account</h2>
          <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-8 leading-relaxed">
            To enable automatic issue synchronization, you need to authorize DevTrack AI to access your GitHub repositories. You only need to do this once.
          </p>
          <button 
            onClick={handleConnectGitHub}
            className="flex items-center gap-3 bg-[#24292e] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#1b1f23] transition-all transform hover:scale-105 shadow-md"
          >
            <i className="fa-brands fa-github text-xl"></i>
            Connect with GitHub
          </button>
          <div className="mt-6 flex items-center gap-2 text-xs text-on-surface-variant font-medium bg-surface-container-low px-4 py-2 rounded-lg">
            <span className="material-symbols-outlined text-[16px] text-green-600">security</span>
            We only request access to read/write repositories for issue syncing.
          </div>
        </div>
      ) : (
        // CONNECTED VIEW - Grouped Dashboard
        <div className="space-y-6">
          {/* SECTION 1: Active Connection Status (Dashboard) */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/60 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-outline-variant/50">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Section 1: Status Dashboard</span>
                <h2 className="text-lg font-black flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-primary">link</span>
                  Active Connection
                </h2>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-on-surface-variant font-medium">Status:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                  webhookStatus === 'HEALTHY' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 
                  webhookStatus === 'FAILED' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 
                  'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    webhookStatus === 'HEALTHY' ? 'bg-green-500' : 
                    webhookStatus === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  {webhookStatus === 'HEALTHY' ? 'Active' : webhookStatus === 'FAILED' ? 'Failed' : 'Pending'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Linked Repository</label>
                  {repoOwner && repoName ? (
                    <a 
                      href={`https://github.com/${repoOwner}/${repoName}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline hover:text-primary-hover"
                    >
                      <i className="fa-brands fa-github text-base"></i>
                      {repoOwner}/{repoName}
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-on-surface-variant italic">No repository linked yet</span>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">Last Sync Event</label>
                  <p className="text-xs text-on-surface">
                    {lastWebhookReceivedAt ? new Date(lastWebhookReceivedAt).toLocaleString() : 'Never received a webhook event'}
                  </p>
                </div>
              </div>

              {/* Rate Limit within Status Dashboard */}
              <div className="space-y-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-primary">speed</span>
                    GitHub API Rate Limit
                  </span>
                  <button type="button" onClick={fetchRateLimit} className="text-[10px] text-primary font-bold hover:underline">Refresh</button>
                </div>
                {rateLimit ? (
                  <>
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden mt-1">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          (rateLimit.remaining / rateLimit.limit) > 0.4 ? 'bg-green-500' :
                          (rateLimit.remaining / rateLimit.limit) > 0.15 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(rateLimit.remaining / rateLimit.limit) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-1.5">
                      <span><b>{rateLimit.remaining}</b> / {rateLimit.limit} remaining</span>
                      <span>Resets: {rateLimit.reset ? new Date(rateLimit.reset * 1000).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-on-surface-variant italic">Rate limit info not available</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Webhook Configuration & Troubleshooter */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/60 space-y-4">
            <div className="pb-4 border-b border-outline-variant/50">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Section 2: Troubleshooter Tools</span>
              <h2 className="text-lg font-black flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-primary">build</span>
                Webhook & Troubleshooter
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payload URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Payload URL</label>
                  <div className="px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/60 text-xs font-mono truncate text-on-surface select-all" title={webhookUrlInput}>
                    {webhookUrlInput}
                  </div>
                </div>

                {/* Webhook Secret */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Webhook Secret</label>
                  <div className="relative">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={webhookSecret || webhookSecretInput}
                      readOnly
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-surface-container border border-outline-variant/60 text-xs font-mono outline-none text-on-surface select-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showSecret ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {window.location.hostname === 'localhost' && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                  <span className="material-symbols-outlined text-yellow-600 text-[16px] mt-0.5">warning</span>
                  <p className="text-[11px] text-yellow-700/80 leading-relaxed">
                    <b>Localhost Detected:</b> GitHub cannot send webhooks to <code>localhost</code>. Please verify that your Payload URL uses a public Ngrok tunnel or active server endpoint.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(true)}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  <span className="material-symbols-outlined text-sm">settings</span>
                  Sync / Re-configure Webhook
                </button>
                <button 
                  type="button"
                  onClick={handlePingWebhook} 
                  disabled={pinging || !repoOwner}
                  className="flex-1 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {pinging ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                      Pinging GitHub...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">sensors</span>
                      Test Webhook (Ping)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: Change Repository (Edit Config) - COLLAPSED ACCORDION */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/60 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setIsAdvancedOpen(!isAdvancedOpen)
                if (!isAdvancedOpen && userRepos.length === 0) fetchRepos()
              }}
              className="w-full flex justify-between items-center px-6 py-4 hover:bg-surface-container/30 transition-colors"
            >
              <div className="text-left">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Section 3: Advanced Settings</span>
                <span className="text-base font-black text-on-surface flex items-center gap-2 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">settings_applications</span>
                  Change Repository / Edit Integration
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-medium">
                  {isAdvancedOpen ? 'Collapse' : 'Expand'}
                </span>
                <span className={`material-symbols-outlined transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>
            </button>

            {isAdvancedOpen && (
              <div className="p-6 border-t border-outline-variant/50 bg-surface-container-lowest/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center pb-2">
                  <p className="text-xs text-on-surface-variant">
                    Modify the linked GitHub repository or link a different account.
                  </p>
                  <button 
                    onClick={handleConnectGitHub}
                    className="text-xs font-bold text-primary hover:bg-surface-container px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-outline-variant/40"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                    Switch Account
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Select Repository</label>
                    {loadingRepos ? (
                      <div className="p-2 text-xs text-on-surface-variant animate-pulse bg-surface-container rounded-lg">Loading repositories...</div>
                    ) : (
                      <div className="flex gap-2 relative">
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-sm outline-none focus:border-primary disabled:opacity-50"
                          placeholder="-- Type to search a Repository --"
                          value={searchRepo}
                          onChange={(e) => {
                            setSearchRepo(e.target.value)
                            setIsDropdownOpen(true)
                            if (!e.target.value) {
                              setRepoOwner('')
                              setRepoName('')
                            }
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                          required={!repoOwner || !repoName}
                          disabled={!isEditingConfig}
                        />
                        {isEditingConfig && (
                          <button type="button" onClick={() => setShowCreateModal(true)} className="px-3 bg-surface-container hover:bg-surface-container-high rounded-lg text-primary flex items-center justify-center transition-colors shadow-sm border border-outline-variant" title="Create new repository">
                            <span className="material-symbols-outlined">add</span>
                          </button>
                        )}
                        {isDropdownOpen && isEditingConfig && (
                          <ul className="absolute top-10 left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-lg bg-surface-container-lowest border border-outline-variant shadow-lg">
                            {userRepos
                              .filter(repo => repo.full_name.toLowerCase().includes(searchRepo.toLowerCase()))
                              .map(repo => (
                                <li
                                  key={repo.id}
                                  className="px-3 py-2 text-sm cursor-pointer hover:bg-surface-container-high text-on-surface"
                                  onMouseDown={() => {
                                    const [owner, name] = repo.full_name.split('/')
                                    setRepoOwner(owner)
                                    setRepoName(name)
                                    setSearchRepo(repo.full_name)
                                    setIsDropdownOpen(false)
                                  }}
                                >
                                  {repo.full_name}
                                </li>
                            ))}
                            {userRepos.filter(repo => repo.full_name.toLowerCase().includes(searchRepo.toLowerCase())).length === 0 && (
                              <li className="px-3 py-2 text-sm text-on-surface-variant">No repositories found.</li>
                            )}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Webhook Secret Key (For GitHub Setup)</label>
                    <div className="flex gap-2 relative">
                      <div className="relative w-full">
                        <input
                          type={showSecret ? "text" : "password"}
                          value={webhookSecret}
                          onChange={(e) => setWebhookSecret(e.target.value)}
                          placeholder="Enter or generate secret"
                          disabled={!isEditingConfig}
                          className="w-full px-3 py-2 pr-10 rounded-lg bg-surface-container-low border border-outline-variant text-sm font-mono outline-none focus:border-primary disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showSecret ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {isEditingConfig && (
                        <button type="button" onClick={generateSecret} className="px-3 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-bold transition-colors">
                          Generate
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingConfig ? (
                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditingConfig(false)
                          setSearchRepo(repoOwner && repoName ? `${repoOwner}/${repoName}` : '')
                        }}
                        className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-lg text-xs transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="flex-1 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50"
                      >
                        {saving ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">save</span>}
                        Save Configuration
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => { setIsEditingConfig(true); fetchRepos() }}
                      className="w-full py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/65 text-on-surface font-bold rounded-lg flex items-center justify-center gap-2 text-xs transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Unlock & Edit Configuration
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* SECTION 4: Webhook Delivery Logs */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/60 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant/50">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Section 4: Delivery Logs</span>
                <h2 className="text-lg font-black flex items-center gap-2 mt-0.5">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Webhook Delivery Logs
                </h2>
              </div>
              <button 
                type="button"
                onClick={fetchDeliveries} 
                disabled={loadingDeliveries} 
                className="text-xs font-bold text-primary hover:bg-surface-container-high border border-outline-variant px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                {loadingDeliveries ? 'Loading...' : 'Refresh Logs'}
              </button>
            </div>

            <div className="border border-outline-variant/50 rounded-xl overflow-hidden bg-surface-container-low/20">
              <div className="divide-y divide-outline-variant/40 max-h-[400px] overflow-y-auto">
                {deliveries.length === 0 && !loadingDeliveries && (
                  <div className="px-4 py-8 text-center text-sm text-on-surface-variant italic">No webhook deliveries recorded yet. Trigger a ping test or run a GitHub action to generate logs.</div>
                )}
                {deliveries.map((d) => (
                  <div key={d.id} className="px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors text-sm">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${d.status_code >= 200 && d.status_code < 300 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-bold text-on-surface">#{d.id}</span>
                          <span className="text-on-surface-variant font-semibold">·</span>
                          <span className="text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">{d.event}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {new Date(d.delivered_at).toLocaleString()} &nbsp;·&nbsp; {d.duration}ms &nbsp;·&nbsp; 
                          <span className={`font-semibold ${d.status_code >= 200 && d.status_code < 300 ? 'text-green-600' : 'text-red-600'}`}> HTTP {d.status_code}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRedeliver(d.id)}
                      disabled={redelivering === d.id}
                      className="shrink-0 px-3 py-1.5 text-xs font-bold border border-outline-variant rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50 flex items-center gap-1 bg-surface-container-lowest"
                    >
                      <span className={`material-symbols-outlined text-[14px] ${redelivering === d.id ? 'animate-spin' : ''}`}>replay</span>
                      {redelivering === d.id ? 'Redelivering...' : 'Redeliver'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Add Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
              <h3 className="font-black text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">webhook</span>
                Add webhook
              </h3>
              <button type="button" onClick={() => setShowWebhookModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAutoConfigureWebhook} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              <div className="bg-surface-container-low p-4 rounded-lg border border-blue-500/30 text-blue-800 dark:text-blue-200 mb-6 flex gap-3">
                <span className="material-symbols-outlined text-blue-500 shrink-0">info</span>
                <p className="text-xs leading-relaxed">
                  We'll send a POST request to the URL below with details of any subscribed events. 
                  The Webhook Payload URL is configured statically on the backend server for security.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-on-surface">Payload URL</label>
                <input
                  type="text"
                  required
                  readOnly
                  disabled
                  value={webhookUrlInput}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/60 text-on-surface-variant/70 font-mono text-xs cursor-not-allowed outline-none"
                  placeholder="https://<your-ngrok-id>.ngrok-free.app/api/v1/github/webhook"
                />
                <p className="text-xs text-on-surface-variant mt-1">This URL is configured via the backend server's <code>application.yaml</code> settings.</p>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-on-surface">Content type <span className="text-red-500">*</span></label>
                <select
                  disabled
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant outline-none cursor-not-allowed"
                >
                  <option>application/json</option>
                  <option>application/x-www-form-urlencoded</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-on-surface">Secret</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    required
                    value={webhookSecretInput}
                    onChange={(e) => setWebhookSecretInput(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant font-mono text-xs outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showSecret ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">Leave as default or enter your own custom secret for GitHub to use.</p>
              </div>

              <div className="pt-4 border-t border-outline-variant/50">
                <label className="font-bold text-on-surface block mb-3">Webhook event preset</label>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="webhookEventType"
                      checked={webhookEventType === 'recommended'}
                      onChange={() => {
                        setWebhookEventType('recommended')
                        setSelectedEvents(CODE_INSIGHT_RECOMMENDED_EVENTS)
                      }}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-bold text-on-surface">Code Insight Recommended</span>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        issues, push, pull_request, workflow_run, and check_run.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="webhookEventType"
                      checked={webhookEventType === 'custom'}
                      onChange={() => setWebhookEventType('custom')}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-bold text-on-surface">Custom</span>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Use only when you understand which evidence events Code Insight needs.
                      </p>
                    </div>
                  </label>

                  {webhookEventType === 'custom' && (
                    <div className="ml-7 mt-3 p-4 bg-surface-container-low border border-outline-variant rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={selectedEvents.includes('issues')} onChange={() => handleEventCheckboxChange('issues')} className="text-primary rounded" />
                        <span className="text-on-surface text-sm">Issues</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={selectedEvents.includes('issue_comment')} onChange={() => handleEventCheckboxChange('issue_comment')} className="text-primary rounded" />
                        <span className="text-on-surface text-sm">Issue comments</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={selectedEvents.includes('pull_request')} onChange={() => handleEventCheckboxChange('pull_request')} className="text-primary rounded" />
                        <span className="text-on-surface text-sm">Pull requests</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={selectedEvents.includes('pull_request_review_comment')} onChange={() => handleEventCheckboxChange('pull_request_review_comment')} className="text-primary rounded" />
                        <span className="text-on-surface text-sm">Pull request reviews</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={selectedEvents.includes('push')} onChange={() => handleEventCheckboxChange('push')} className="text-primary rounded" />
                        <span className="text-on-surface text-sm">Pushes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={selectedEvents.includes('workflow_run')} onChange={() => handleEventCheckboxChange('workflow_run')} className="text-primary rounded" />
                        <span className="text-on-surface text-sm">Workflow runs</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={selectedEvents.includes('check_run')} onChange={() => handleEventCheckboxChange('check_run')} className="text-primary rounded" />
                        <span className="text-on-surface text-sm">Check runs</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/50 flex gap-3 sticky bottom-0 bg-surface-container-lowest">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-6 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={autoConfiguring}
                  className="flex-1 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {autoConfiguring ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : 'Add webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Repo Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-black text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_box</span>
                Create GitHub Repository
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateNewRepo} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant">Repository Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value.replace(/\s+/g, '-'))}
                  placeholder="e.g., my-awesome-project"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-sm focus:border-primary outline-none"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant">Description (Optional)</label>
                <textarea
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  placeholder="Short description of this repository"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-sm focus:border-primary outline-none resize-none h-20"
                />
              </div>
              
              <div className="flex items-center gap-3 py-2">
                <div className="flex items-center h-5">
                  <input
                    id="isPrivate"
                    type="checkbox"
                    checked={newRepoPrivate}
                    onChange={(e) => setNewRepoPrivate(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="isPrivate" className="font-bold text-on-surface">Private Repository</label>
                  <p className="text-xs text-on-surface-variant">You choose who can see and commit to this repository.</p>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRepo}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {creatingRepo ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
