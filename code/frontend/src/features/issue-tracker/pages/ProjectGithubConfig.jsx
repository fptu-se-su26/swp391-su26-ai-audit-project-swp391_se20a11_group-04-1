import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import bugService from '../services/bugService'
import axiosInstance from '@/api/axiosConfig'

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
  const [webhookEventType, setWebhookEventType] = useState('selected') // 'push', 'all', 'selected'
  const [selectedEvents, setSelectedEvents] = useState(['issues', 'issue_comment'])
  
  const defaultWebhookUrl = `${window.location.origin}/api/v1/github/webhook`
  const [webhookUrlInput, setWebhookUrlInput] = useState(defaultWebhookUrl)
  const [webhookSecretInput, setWebhookSecretInput] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [isEditingConfig, setIsEditingConfig] = useState(false)

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
          if (config.repoOwner && config.repoName) {
            setSearchRepo(`${config.repoOwner}/${config.repoName}`)
            setIsEditingConfig(false)
            // Config đã lưu, load rate limit để hiển thị
            fetchRateLimit()
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

    let eventsToSend = []
    if (webhookEventType === 'push') {
      eventsToSend = ['push']
    } else if (webhookEventType === 'all') {
      eventsToSend = ['*']
    } else {
      eventsToSend = selectedEvents
      if (eventsToSend.length === 0) {
        toast.error('Please select at least one event.')
        return
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

  const isLeader = ['PROJECT_LEADER', 'LEADER', 'Project Leader', 'MENTOR'].includes(activeProject?.role)
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

      {/* Rate Limit Bar — hiện ngay đầu trang khi đã kết nối GitHub */}
      {hasToken && rateLimit && (
        <div className="bg-surface-container-lowest rounded-2xl px-5 py-3 shadow-sm border border-outline-variant/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-primary">speed</span>
              GitHub API Rate Limit
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-on-surface-variant">
                <b className="text-on-surface">{rateLimit.remaining}</b> / {rateLimit.limit} remaining &nbsp;·&nbsp; Resets {rateLimit.reset ? new Date(rateLimit.reset * 1000).toLocaleTimeString() : 'N/A'}
              </span>
              <button onClick={fetchRateLimit} className="text-[11px] text-primary hover:underline">Refresh</button>
            </div>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all ${
                (rateLimit.remaining / rateLimit.limit) > 0.4 ? 'bg-green-500' :
                (rateLimit.remaining / rateLimit.limit) > 0.15 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${(rateLimit.remaining / rateLimit.limit) * 100}%` }}
            />
          </div>
        </div>
      )}

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
        // CONNECTED VIEW - Sequential steps
        <div className="space-y-6">

          {/* STEP 1: Repository Selection */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/60 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant/50">
              <h2 className="text-lg font-black flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-on-primary text-xs font-black flex items-center justify-center">1</span>
                <span className="material-symbols-outlined text-primary">book</span>
                Repository Selection
              </h2>
              <button 
                onClick={handleConnectGitHub}
                className="text-xs font-bold text-primary hover:bg-surface-container-high px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                Switch GitHub Account
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
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-sm outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <ul className="absolute top-10 z-10 w-[calc(100%-48px)] mt-1 max-h-60 overflow-auto rounded-lg bg-surface-container-lowest border border-outline-variant shadow-lg">
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

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-on-surface-variant">Webhook Secret Key (For GitHub Setup)</label>
                <div className="flex gap-2 relative">
                  <div className="relative w-full">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      placeholder="Enter or generate secret"
                      disabled={!isEditingConfig}
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-surface-container-low border border-outline-variant text-sm font-mono outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full py-2.5 mt-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {saving ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">save</span>}
                  Save Configuration
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => { setIsEditingConfig(true); fetchRepos() }}
                  className="w-full py-2.5 mt-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined">edit</span>
                  Edit Configuration
                </button>
              )}
            </form>
          </div>

          {/* STEP 2: Webhook — chỉ hiện khi đã lưu repo (trạng thái khóa) */}
          {!isEditingConfig && repoOwner && repoName && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/60 space-y-4">
              <h2 className="text-lg font-black flex items-center gap-2 pb-4 border-b border-outline-variant/50">
                <span className="w-7 h-7 rounded-full bg-primary text-on-primary text-xs font-black flex items-center justify-center">2</span>
                <span className="material-symbols-outlined text-primary">router</span>
                Webhook Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Connection Health */}
                <div className="bg-surface-container-low p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-on-surface">Connection Health</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${webhookStatus === 'HEALTHY' ? 'bg-green-500/10 text-green-600' : webhookStatus === 'FAILED' ? 'bg-red-500/10 text-red-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                      {webhookStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-2">
                    Last Received: {lastWebhookReceivedAt ? new Date(lastWebhookReceivedAt).toLocaleString() : 'Never'}
                  </p>
                  <button 
                    onClick={handlePingWebhook} 
                    disabled={pinging || !repoOwner}
                    className="w-full mt-4 py-2 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {pinging ? 'Pinging...' : 'Test Webhook Connection'}
                  </button>
                </div>

                {/* Add / Reconfigure Webhook */}
                <div className="flex flex-col justify-center gap-3">
                  <button
                    onClick={() => setShowWebhookModal(true)}
                    disabled={webhookStatus === 'HEALTHY'}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all disabled:opacity-60 disabled:hover:bg-green-600 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">{webhookStatus === 'HEALTHY' ? 'check_circle' : 'add'}</span>
                    {webhookStatus === 'HEALTHY' ? 'Webhook Configured' : 'Add Webhook'}
                  </button>
                  {webhookStatus === 'HEALTHY' && (
                    <button
                      onClick={() => setShowWebhookModal(true)}
                      className="w-full py-2 border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">settings</span>
                      Reconfigure Webhook
                    </button>
                  )}
                  {window.location.hostname === 'localhost' && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                      <span className="material-symbols-outlined text-yellow-600 text-[16px] mt-0.5">warning</span>
                      <p className="text-[11px] text-yellow-700/80 leading-relaxed">
                        <b>Localhost Detected:</b> GitHub cannot send webhooks to your local computer. Use ngrok to get a public URL.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery History */}
              <div className="border border-outline-variant/60 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeliveries(!showDeliveries)
                    if (!showDeliveries && deliveries.length === 0) fetchDeliveries()
                  }}
                  className="w-full flex justify-between items-center px-4 py-3 bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-bold"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">history</span>
                    Recent Deliveries
                    {deliveries.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{deliveries.length}</span>
                    )}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    {showDeliveries ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {showDeliveries && (
                  <div className="divide-y divide-outline-variant/40">
                    <div className="px-4 py-2 flex justify-end bg-surface-container-lowest">
                      <button onClick={fetchDeliveries} disabled={loadingDeliveries} className="text-[11px] text-primary hover:underline disabled:opacity-50">
                        {loadingDeliveries ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                    {deliveries.length === 0 && !loadingDeliveries && (
                      <div className="px-4 py-6 text-center text-xs text-on-surface-variant">No deliveries found.</div>
                    )}
                    {deliveries.map((d) => (
                      <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3 bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${d.status_code >= 200 && d.status_code < 300 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-on-surface truncate">#{d.id} &nbsp;·&nbsp; <span className="text-primary font-bold">{d.event}</span></p>
                            <p className="text-[10px] text-on-surface-variant">{new Date(d.delivered_at).toLocaleString()} &nbsp;·&nbsp; {d.duration}ms &nbsp;·&nbsp; HTTP {d.status_code}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRedeliver(d.id)}
                          disabled={redelivering === d.id}
                          className="shrink-0 px-2.5 py-1 text-[11px] font-bold border border-outline-variant rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <span className={`material-symbols-outlined text-[13px] ${redelivering === d.id ? 'animate-spin' : ''}`}>replay</span>
                          {redelivering === d.id ? '...' : 'Redeliver'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
                  We'll send a POST request to the URL below with details of any subscribed events. You can also specify which data format you'd like to receive. 
                  You can freely edit the Payload URL and Secret below (e.g., use an ngrok URL for local testing).
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-on-surface">Payload URL <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={webhookUrlInput}
                  onChange={(e) => setWebhookUrlInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant font-mono text-xs outline-none focus:border-primary"
                  placeholder="https://<your-ngrok-id>.ngrok-free.app/api/v1/github/webhook"
                />
                <p className="text-xs text-on-surface-variant mt-1">Hint: Use Ngrok on port 8080. Example: <code>https://abc.ngrok-free.app/api/v1/github/webhook</code></p>
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
                <label className="font-bold text-on-surface block mb-3">Which events would you like to trigger this webhook?</label>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="webhookEventType"
                      checked={webhookEventType === 'push'}
                      onChange={() => setWebhookEventType('push')}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-bold text-on-surface">Just the push event.</span>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="webhookEventType"
                      checked={webhookEventType === 'all'}
                      onChange={() => setWebhookEventType('all')}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-bold text-on-surface">Send me <b>everything</b>.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="webhookEventType"
                      checked={webhookEventType === 'selected'}
                      onChange={() => setWebhookEventType('selected')}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-bold text-on-surface">Let me select individual events.</span>
                    </div>
                  </label>

                  {webhookEventType === 'selected' && (
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
