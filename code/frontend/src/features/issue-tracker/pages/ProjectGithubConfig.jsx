import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import bugService from '../services/bugService'

export function ProjectGithubConfig() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const activeProject = useProjectStore((state) => state.activeProject)

  const [formData, setFormData] = useState({
    repoOwner: '',
    repoName: '',
    accessToken: '',
    webhookSecret: ''
  })

  const [repoUrl, setRepoUrl] = useState('')
  const [urlParseStatus, setUrlParseStatus] = useState(null) // 'ok' | 'error' | null

  const [hasToken, setHasToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  const [webhookStatus, setWebhookStatus] = useState('PENDING')
  const [lastWebhookReceivedAt, setLastWebhookReceivedAt] = useState(null)

  const [rateLimit, setRateLimit] = useState(null)
  const [loadingRateLimit, setLoadingRateLimit] = useState(false)

  const [pinging, setPinging] = useState(false)
  const [helpModalType, setHelpModalType] = useState(null) // null | 'pat' | 'webhook' | 'ngrok' | 'troubleshoot'

  // Webhook URL endpoint computed dynamically
  const webhookUrl = `${window.location.origin}/api/v1/github/webhook`

  useEffect(() => {
    const fetchConfig = async () => {
      if (!projectId) return
      setLoading(true)
      try {
        const config = await bugService.getGithubConfig(projectId)
        if (config) {
          setFormData({
            repoOwner: config.repoOwner || '',
            repoName: config.repoName || '',
            accessToken: '', // Keep blank on UI for security
            webhookSecret: config.webhookSecret || ''
          })
          setHasToken(config.hasToken || false)
          setWebhookStatus(config.webhookStatus || 'PENDING')
          setLastWebhookReceivedAt(config.lastWebhookReceivedAt || null)

          if (config.hasToken) {
            fetchRateLimit()
          }
        }
      } catch (err) {
        console.error('Error loading GitHub configuration:', err)
        toast.error('Unable to load GitHub configurations')
      } finally {
        setLoading(false)
      }
    }

    const pollStatus = async () => {
      if (!projectId) return
      try {
        const config = await bugService.getGithubConfig(projectId)
        if (config) {
          setWebhookStatus(config.webhookStatus || 'PENDING')
          setLastWebhookReceivedAt(config.lastWebhookReceivedAt || null)
        }
      } catch (err) {
        console.error('Error polling GitHub status:', err)
      }
    }

    const triggerAutoPing = async () => {
      if (!projectId) return
      try {
        // Auto-ping GitHub once when entering the project configuration
        await bugService.pingWebhook(projectId)
      } catch (err) {
        console.error('Error auto-pinging webhook:', err)
      }
    }

    const fetchRateLimit = async () => {
      setLoadingRateLimit(true)
      try {
        const limitData = await bugService.getGithubRateLimit(projectId)
        if (limitData) setRateLimit(limitData)
      } catch (err) {
        console.error('Error loading rate limit:', err)
      } finally {
        setLoadingRateLimit(false)
      }
    }

    fetchConfig().then(() => {
      triggerAutoPing()
    })

    // Start active polling every 10 seconds for real-time updates
    const intervalId = setInterval(() => {
      pollStatus()
    }, 10000)

    // Cleanup interval when component unmounts (user leaves the page)
    return () => clearInterval(intervalId)
  }, [projectId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Auto-parse GitHub URL → repoOwner + repoName
  const handleUrlChange = (e) => {
    const raw = e.target.value
    setRepoUrl(raw)
    if (!raw.trim()) {
      setUrlParseStatus(null)
      return
    }
    try {
      // Support formats:
      //   https://github.com/owner/repo
      //   https://github.com/owner/repo.git
      //   github.com/owner/repo
      const cleaned = raw.trim().replace(/\.git$/, '').replace(/\/$/, '')
      const url = new URL(cleaned.startsWith('http') ? cleaned : 'https://' + cleaned)

      // Must be github.com domain only
      if (url.hostname !== 'github.com') {
        setUrlParseStatus('error')
        return
      }

      const parts = url.pathname.split('/').filter(Boolean)

      // Need at least owner + repo
      if (parts.length < 2) {
        setUrlParseStatus('error')
        return
      }

      // Smart extract: always take first 2 segments (owner/repo)
      // Extra segments like /tree/main, /issues/123, /blob/main/file.js are ignored
      const [owner, repo] = parts
      const hasExtraPath = parts.length > 2

      // Validate GitHub owner: alphanumeric + hyphens, no leading/trailing hyphens
      const ownerValid = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(owner)
      // Validate GitHub repo name: alphanumeric, hyphens, underscores, dots
      const repoValid = /^[a-zA-Z0-9._-]{1,100}$/.test(repo)

      if (!ownerValid || !repoValid) {
        setUrlParseStatus('error')
        return
      }

      setFormData(prev => ({ ...prev, repoOwner: owner, repoName: repo }))
      setUrlParseStatus(hasExtraPath ? 'ok-trimmed' : 'ok')

    } catch {
      setUrlParseStatus('error')
    }
  }


  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let secret = ''
    for (let i = 0; i < 24; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData((prev) => ({ ...prev, webhookSecret: secret }))
    setShowSecret(true)
    toast.success('Generated a secure webhook secret!')
  }

  const handlePingWebhook = async () => {
    if (!projectId) return
    setPinging(true)
    try {
      await bugService.pingWebhook(projectId)
      toast.success('Ping requested from GitHub! Waiting for delivery...')
      // Wait a bit for GitHub to send the ping and our server to process it
      setTimeout(async () => {
        const config = await bugService.getGithubConfig(projectId)
        if (config) {
          setWebhookStatus(config.webhookStatus || 'PENDING')
          setLastWebhookReceivedAt(config.lastWebhookReceivedAt || null)
          if (config.webhookStatus === 'HEALTHY') {
            toast.success('Ping delivered successfully! Connection is healthy.')
          } else if (config.webhookStatus === 'FAILED') {
            toast.error('Ping failed! Check webhook secret.')
          }
        }
        setPinging(false)
      }, 3000)
    } catch (err) {
      console.error('Error pinging webhook:', err)
      toast.error('Failed to trigger webhook ping')
      setPinging(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.repoOwner.trim() || !formData.repoName.trim()) {
      toast.error('Repository Owner and Name are required!')
      return
    }

    setSaving(true)
    try {
      const payload = {
        repoOwner: formData.repoOwner.trim(),
        repoName: formData.repoName.trim(),
        webhookSecret: formData.webhookSecret.trim(),
        accessToken: formData.accessToken.trim() || null
      }

      const config = await bugService.saveGithubConfig(projectId, payload)
      toast.success('GitHub connection configured successfully!')
      setHasToken(config.hasToken || false)
      setWebhookStatus(config.webhookStatus || 'PENDING')
      setLastWebhookReceivedAt(config.lastWebhookReceivedAt || null)
      if (formData.accessToken) {
        setFormData((prev) => ({ ...prev, accessToken: '' })) // Clear plain text input
      }
      setTimeout(() => navigate(`/projects/${projectId}/issues`), 1500)

    } catch (err) {
      console.error('Error saving configurations:', err)
      toast.error(err.response?.data?.message || 'Failed to save GitHub connection')
    } finally {
      setSaving(false)
    }
  }

  // Security authorization check
  const isLeader = activeProject?.role === 'Project Leader'

  if (!isLeader) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 shadow-lg space-y-4">
          <span className="material-symbols-outlined text-5xl text-error">gpp_maybe</span>
          <h3 className="font-extrabold text-xl text-on-surface">Access Denied</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Only Project Leaders are authorized to view or edit GitHub synchronization configurations.
          </p>
          <button
            onClick={() => navigate(`/projects/${projectId}/issues`)}
            className="mt-2 py-2 px-6 bg-primary text-on-primary font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Bugs
          </button>
        </div>
      </main>
    )
  }

  // --- Modal Components ---
  const renderHelpModal = () => {
    if (!helpModalType) return null

    let content = null
    if (helpModalType === 'pat') {
      content = (
        <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
          <h3 className="text-lg font-black text-on-surface border-b pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">token</span>
            Create PAT
          </h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Go to your GitHub account <strong>Settings</strong> &rarr; <strong>Developer settings</strong> &rarr; <strong>Personal access tokens</strong> &rarr; <strong>Tokens (classic)</strong>.</li>
            <li>Click <strong>Generate new token (classic)</strong>.</li>
            <li>Check scopes: <strong>repo</strong> and <strong>admin:repo_hook</strong>.</li>
            <li>Click <strong>Generate token</strong> and paste it here.</li>
          </ol>
          <div className="mt-2 text-xs text-primary bg-primary/10 p-2 rounded">
            <strong>Tip:</strong> If you configured a PAT in another project, leave the input blank to auto-reuse it.
          </div>
        </div>
      )
    } else if (helpModalType === 'webhook') {
      content = (
        <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
          <h3 className="text-lg font-black text-on-surface border-b pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">webhook</span>
            Configure Webhook
          </h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Go to your GitHub Repository <strong>Settings</strong> &rarr; <strong>Webhooks</strong> &rarr; <strong>Add webhook</strong>.</li>
            <li>Paste <strong>Payload URL</strong>:
              <div className="mt-1 p-2 bg-surface-container-low border border-outline-variant rounded font-mono select-all break-all text-xs text-on-surface font-semibold">{webhookUrl}</div>
            </li>
            <li>Set Content type to <strong>application/json</strong>.</li>
            <li>Paste the <strong>Webhook Secret Key</strong> from the left panel.</li>
            <li>Select events: <strong>Issues</strong> and <strong>Issue comments</strong>, then add.</li>
          </ol>
        </div>
      )
    } else if (helpModalType === 'ngrok') {
      content = (
        <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
          <h3 className="text-lg font-black text-on-surface border-b pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">api</span>
            Local Development (ngrok)
          </h3>
          <p>GitHub cannot reach your <code>localhost</code>. To test webhooks locally:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Install ngrok.</li>
            <li>Run <code>ngrok http 8080</code> (assuming your Spring Boot backend runs on 8080).</li>
            <li>Copy the public URL (e.g., <code>https://xyz.ngrok-free.app</code>).</li>
            <li>In your GitHub Webhook settings, use your ngrok URL instead of <code>{window.location.origin}</code> for the Payload URL. Example: <code>https://xyz.ngrok-free.app/api/v1/github/webhook</code></li>
          </ol>
        </div>
      )
    } else if (helpModalType === 'troubleshoot') {
      content = (
        <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
          <h3 className="text-lg font-black text-on-surface border-b pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-error">build</span>
            Troubleshooting Errors
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Status FAILED:</strong> Secret Key mismatch. Check that the Secret Key on GitHub exactly matches the one you pasted here.</li>
            <li><strong>Status PENDING:</strong> Webhook isn't sending events. Go to GitHub Webhook settings, click "Recent Deliveries", select the failed delivery, and click <strong>Redeliver</strong>.</li>
            <li><strong>No events received:</strong> Ensure you checked "Issues" and "Issue comments" when setting up the webhook.</li>
          </ul>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
          <button
            onClick={() => setHelpModalType(null)}
            className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-background select-none pt-2">
      {renderHelpModal()}
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-primary-fixed opacity-[0.08] blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-secondary-fixed opacity-[0.1] blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header section */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => navigate(`/projects/${projectId}/issues`)}
                className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-xs">arrow_back</span>
                <span>Bugs Dashboard</span>
              </button>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary font-bold">settings_ethernet</span>
              GitHub Integration Setup
            </h1>
            <p className="text-sm text-on-surface-variant mt-2 max-w-3xl">
              Connect this project to a GitHub repository to activate bidirectional synchronization of Issues, Checklists, and CI workflows.
            </p>
          </div>
        </section>

        {loading ? (
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
            <p className="mt-4 text-sm font-bold text-on-surface-variant">Loading integration settings...</p>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Settings Card */}
            <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-black text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[28px]">integration_instructions</span>
                    Connection Details
                  </h2>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-outline-variant/50">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">webhook</span>
                  Webhook Delivery Status
                </h3>
                {webhookStatus === 'HEALTHY' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-green-700 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Healthy
                    </span>
                    <button onClick={handlePingWebhook} disabled={pinging} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 flex items-center gap-1">
                      <span className={`material-symbols-outlined text-[14px] ${pinging ? 'animate-spin' : ''}`}>
                        {pinging ? 'sync' : 'network_ping'}
                      </span>
                      Test
                    </button>
                  </div>
                ) : webhookStatus === 'FAILED' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-red-700 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      Failing
                    </span>
                    <button onClick={handlePingWebhook} disabled={pinging} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 flex items-center gap-1">
                      <span className={`material-symbols-outlined text-[14px] ${pinging ? 'animate-spin' : ''}`}>
                        {pinging ? 'sync' : 'network_ping'}
                      </span>
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-yellow-700 bg-yellow-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">pending</span>
                      Pending
                    </span>
                    <button onClick={handlePingWebhook} disabled={pinging} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 flex items-center gap-1">
                      <span className={`material-symbols-outlined text-[14px] ${pinging ? 'animate-spin' : ''}`}>
                        {pinging ? 'sync' : 'network_ping'}
                      </span>
                      Ping
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs text-on-surface-variant flex flex-col gap-1">
                {webhookStatus === 'HEALTHY' && (
                  <p>Last successful delivery: {lastWebhookReceivedAt ? new Date(lastWebhookReceivedAt).toLocaleString() : 'Just now'}</p>
                )}
                {webhookStatus === 'FAILED' && (
                  <p className="text-red-600">Last delivery failed (Signature Mismatch) at: {lastWebhookReceivedAt ? new Date(lastWebhookReceivedAt).toLocaleString() : 'Unknown'}. Please check your secret key!</p>
                )}
              </div>

              {/* Rate Limit UI moved to top */}
              {hasToken && (
                <div className="pb-6 border-b border-outline-variant/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">speed</span>
                      API Rate Limit Status
                    </h3>
                    {loadingRateLimit ? (
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                        Checking...
                      </span>
                    ) : rateLimit ? (
                      <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                        Resets at {new Date(rateLimit.reset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : null}
                  </div>

                  {rateLimit ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-on-surface-variant">Remaining Requests</span>
                        <span className={rateLimit.remaining > 1000 ? "text-green-600" : rateLimit.remaining > 0 ? "text-yellow-600" : "text-red-600"}>
                          {rateLimit.remaining} <span className="text-on-surface-variant font-normal">/ {rateLimit.limit}</span>
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${rateLimit.remaining > 1000 ? "bg-green-500" : rateLimit.remaining > 0 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${Math.max(0, Math.min(100, (rateLimit.remaining / rateLimit.limit) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : !loadingRateLimit ? (
                    <div className="text-xs text-on-surface-variant italic">
                      Unable to fetch rate limit. Token might be invalid or expired.
                    </div>
                  ) : null}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Quick-fill from GitHub URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">link</span>
                    Quick Fill from GitHub URL
                    <span className="text-[9px] font-normal text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">optional</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={handleUrlChange}
                      placeholder="Paste GitHub repo URL — e.g. https://github.com/fptu-se-su26/swp391-ai-audit-project"
                      className={`w-full px-3.5 py-2 rounded-lg bg-surface-container-low border text-sm text-on-surface focus:outline-none transition-colors pr-8
                        ${urlParseStatus === 'ok' || urlParseStatus === 'ok-trimmed'
                          ? urlParseStatus === 'ok-trimmed' ? 'border-yellow-400 focus:border-yellow-400' : 'border-green-500 focus:border-green-500'
                          : urlParseStatus === 'error'
                            ? 'border-red-400 focus:border-red-400'
                            : 'border-outline-variant focus:border-primary'
                        }`}
                    />
                    {(urlParseStatus === 'ok') && (
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-base text-green-600">check_circle</span>
                    )}
                    {urlParseStatus === 'ok-trimmed' && (
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-base text-yellow-500">warning</span>
                    )}
                    {urlParseStatus === 'error' && (
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-base text-red-500">error</span>
                    )}
                  </div>
                  {urlParseStatus === 'ok' && (
                    <p className="text-[10px] text-green-700 font-semibold">
                      ✓ Auto-filled: <span className="font-mono">{formData.repoOwner}</span> / <span className="font-mono">{formData.repoName}</span>
                    </p>
                  )}
                  {urlParseStatus === 'ok-trimmed' && (
                    <p className="text-[10px] text-yellow-600 font-semibold">
                      ✓ Auto-filled: <span className="font-mono">{formData.repoOwner}</span> / <span className="font-mono">{formData.repoName}</span>
                      <span className="font-normal ml-1">(extra path in URL was ignored)</span>
                    </p>
                  )}
                  {urlParseStatus === 'error' && (
                    <p className="text-[10px] text-red-500">Invalid GitHub URL. Format: https://github.com/owner/repo</p>
                  )}
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">GitHub Repository Owner</label>
                    <input
                      type="text"
                      name="repoOwner"
                      value={formData.repoOwner}
                      onChange={handleInputChange}
                      placeholder="e.g. fptu-se-su26"
                      className="px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Repository Name</label>
                    <input
                      type="text"
                      name="repoName"
                      value={formData.repoName}
                      onChange={handleInputChange}
                      placeholder="e.g. swp391-ai-audit-project"
                      className="px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                    GitHub Personal Access Token (PAT)
                    {hasToken && (
                      <span className="text-[10px] font-bold text-[#047857] bg-green-500/10 px-1.5 py-0.25 rounded uppercase">
                        Active Token Configured
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    name="accessToken"
                    value={formData.accessToken}
                    onChange={handleInputChange}
                    placeholder={hasToken ? "●●●●●●●●●●●●●●●● (Enter new token to overwrite)" : "Paste PAT (Leave blank to reuse your saved token)"}
                    className="px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">Webhook Secret Key</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showSecret ? "text" : "password"}
                        name="webhookSecret"
                        value={formData.webhookSecret}
                        onChange={handleInputChange}
                        placeholder="Enter secret to authenticate incoming webhooks"
                        className="w-full px-3.5 py-2 pr-10 rounded-lg bg-surface-container-low border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-full flex items-center justify-center"
                        title={showSecret ? "Hide secret" : "Show secret"}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showSecret ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generateSecret}
                      className="py-2 px-3 border border-outline-variant text-primary text-xs font-bold rounded-lg hover:bg-surface-container-high transition-all shrink-0"
                    >
                      Generate Key
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-lg hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>Configuring Integration...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      <span>Validate & Save Connection</span>
                    </>
                  )}
                </button>
              </form>


            </div>

            {/* Instruction Sidebar Guide Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-sm space-y-6 h-fit">
              <h2 className="text-md font-black text-on-surface border-b border-outline-variant/50 pb-2.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">help</span>
                Need Help?
              </h2>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setHelpModalType('pat')}
                  className="w-full text-left px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 transition-colors flex items-center gap-3 group"
                >
                  <span className="material-symbols-outlined text-primary text-xl group-hover:scale-110 transition-transform">token</span>
                  <span className="text-sm font-semibold text-on-surface">How to create PAT?</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHelpModalType('webhook')}
                  className="w-full text-left px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 transition-colors flex items-center gap-3 group"
                >
                  <span className="material-symbols-outlined text-primary text-xl group-hover:scale-110 transition-transform">webhook</span>
                  <span className="text-sm font-semibold text-on-surface">How to configure Webhook?</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHelpModalType('ngrok')}
                  className="w-full text-left px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 transition-colors flex items-center gap-3 group"
                >
                  <span className="material-symbols-outlined text-primary text-xl group-hover:scale-110 transition-transform">api</span>
                  <span className="text-sm font-semibold text-on-surface">Local Development (ngrok)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHelpModalType('troubleshoot')}
                  className="w-full text-left px-4 py-3 rounded-xl bg-error/10 hover:bg-error/20 border border-error/20 transition-colors flex items-center gap-3 group"
                >
                  <span className="material-symbols-outlined text-error text-xl group-hover:scale-110 transition-transform">build</span>
                  <span className="text-sm font-semibold text-error">Troubleshooting Errors</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectGithubConfig;
