import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import { useProjectRole } from '@/hooks/useProjectRole'
import { projectSettingsService } from '../services/projectSettingsService'
import { ProjectGithubConfig } from '@features/issue-tracker'

// ── Preset cover images (Unsplash) ──────────────────────────────
const PRESET_COVERS = [
  { id: 'city',    url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80', label: 'City' },
  { id: 'forest',  url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80', label: 'Forest' },
  { id: 'ocean',   url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200&q=80', label: 'Ocean' },
  { id: 'mountain',url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80', label: 'Mountain' },
  { id: 'abstract',url: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1200&q=80', label: 'Abstract' },
  { id: 'dark',    url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&q=80', label: 'Dark' },
]

// ── Preset theme colors ──────────────────────────────────────────
const PRESET_COLORS = [
  { id: 'teal',   value: '#1E707D', label: 'Teal'   },
  { id: 'blue',   value: '#2563EB', label: 'Blue'   },
  { id: 'purple', value: '#7C3AED', label: 'Purple' },
  { id: 'pink',   value: '#DB2777', label: 'Pink'   },
  { id: 'orange', value: '#EA580C', label: 'Orange' },
  { id: 'yellow', value: '#CA8A04', label: 'Yellow' },
  { id: 'green',  value: '#16A34A', label: 'Green'  },
  { id: 'gray',   value: '#4B5563', label: 'Gray'   },
]

const PROJECT_TYPES = ['WEB_APP', 'MOBILE', 'DATABASE', 'RESEARCH', 'OTHER']
const DEFAULT_COVER = ''
const DEFAULT_THEME = '#1E707D'

// ── Tabs definition ─────────────────────────────────────────────
const TABS = [
  { id: 'general',  label: 'General',            icon: 'tune'       },
  { id: 'github',   label: 'GitHub & Code Insight', icon: 'webhook' },
]

export default function ProjectSettingsPage() {
  const { projectId } = useParams()
  const { isLeader, isMember } = useProjectRole()
  const activeProject    = useProjectStore((s) => s.activeProject)
  const fetchProjectById = useProjectStore((s) => s.fetchProjectById)

  const [activeTab, setActiveTab] = useState('general')
  const [loading,   setLoading]   = useState(true)

  // ── Draft form state ──────────────────────────────────────────
  const [draftName,        setDraftName]        = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftType,        setDraftType]        = useState('WEB_APP')
  const [draftStatus,      setDraftStatus]      = useState('PLANNING')
  const [draftStartDate,   setDraftStartDate]   = useState('')
  const [draftDeadline,    setDraftDeadline]    = useState('')
  const [draftMaxMembers,  setDraftMaxMembers]  = useState(10)
  const [draftCover,       setDraftCover]       = useState(DEFAULT_COVER)
  const [draftTheme,       setDraftTheme]       = useState(DEFAULT_THEME)
  const [customHex,        setCustomHex]        = useState('')
  const [hexError,         setHexError]         = useState(false)

  // Upload state
  const [uploading,   setUploading]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [isDirty,     setIsDirty]     = useState(false)
  const fileInputRef  = useRef(null)

  // ── Load project data ────────────────────────────────────────
  // Normalize LocalDate from backend: may be "2026-07-13" (ISO) or [2026,7,13] (array)
  const toDateInput = (date) => {
    if (!date) return ''
    if (Array.isArray(date)) {
      const [y, m, d] = date
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
    return typeof date === 'string' ? date.substring(0, 10) : ''
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (!activeProject || String(activeProject.id) !== String(projectId)) {
        await fetchProjectById(projectId)
      }
      setLoading(false)
    }
    load()
  }, [projectId])

  useEffect(() => {
    if (activeProject && String(activeProject.id) === String(projectId)) {
      setDraftName(activeProject.title || '')
      setDraftDescription(activeProject.description || '')
      setDraftType(activeProject.type || 'WEB_APP')
      setDraftStatus(activeProject.status || 'PLANNING')
      setDraftStartDate(toDateInput(activeProject.startDate))
      setDraftDeadline(toDateInput(activeProject.deadline))
      setDraftMaxMembers(activeProject.maxMembers || 10)
      setDraftCover(activeProject.coverImageUrl || DEFAULT_COVER)
      setDraftTheme(activeProject.themeColor || DEFAULT_THEME)
      setCustomHex(activeProject.themeColor || DEFAULT_THEME)
      setLoading(false)
    }
  }, [activeProject, projectId])

  // ── Dirty tracking ───────────────────────────────────────────
  const markDirty = useCallback(() => setIsDirty(true), [])

  // ── Warn on browser tab close/refresh when dirty ─────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // ── Colour helpers ───────────────────────────────────────────
  const applyTheme = (hex) => {
    setDraftTheme(hex)
    setCustomHex(hex)
    setHexError(false)
    // Preview CSS var immediately
    document.documentElement.style.setProperty('--project-theme', hex)
    document.documentElement.style.setProperty('--project-theme-light', hex + '26')
    document.documentElement.style.setProperty('--project-theme-hover', `color-mix(in srgb, ${hex} 85%, white)`)
    document.documentElement.style.setProperty('--project-theme-dark', `color-mix(in srgb, ${hex} 85%, black)`)
    markDirty()
  }

  const handleHexInput = (val) => {
    setCustomHex(val)
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setDraftTheme(val)
      setHexError(false)
      document.documentElement.style.setProperty('--project-theme', val)
      document.documentElement.style.setProperty('--project-theme-light', val + '26')
      document.documentElement.style.setProperty('--project-theme-hover', `color-mix(in srgb, ${val} 85%, white)`)
      document.documentElement.style.setProperty('--project-theme-dark', `color-mix(in srgb, ${val} 85%, black)`)
    } else {
      setHexError(true)
    }
    markDirty()
  }

  // ── Cover upload ─────────────────────────────────────────────
  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG or WebP images are accepted.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.')
      return
    }
    setUploading(true)
    const tid = toast.loading('Uploading cover image…')
    try {
      const data = await projectSettingsService.uploadCoverImage(projectId, file)
      setDraftCover(data.url)
      markDirty()
      toast.success('Cover image uploaded!', { id: tid })
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message), { id: tid })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // ── Save handler ─────────────────────────────────────────────
  const handleSave = async (e) => {
    e?.preventDefault()
    if (!draftName.trim()) { toast.error('Project name is required.'); return }
    if (hexError) { toast.error('Please fix the HEX color before saving.'); return }

    setSaving(true)
    const tid = toast.loading('Saving project settings…')
    try {
      await projectSettingsService.updateProject(projectId, {
        name:          draftName.trim(),
        description:   draftDescription,
        type:          draftType,
        status:        draftStatus,
        startDate:     draftStartDate || null,
        deadline:      draftDeadline  || null,
        maxMembers:    Number(draftMaxMembers),
        coverImageUrl: draftCover === DEFAULT_COVER ? '' : draftCover,
        themeColor:    draftTheme,
      })
      // Refresh store
      await fetchProjectById(projectId)
      setIsDirty(false)
      toast.success('Settings saved successfully!', { id: tid })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.', { id: tid })
    } finally {
      setSaving(false)
    }
  }

  // ── Access guard ─────────────────────────────────────────────
  if (!loading && !isLeader && !isMember) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white p-10 rounded-2xl shadow-sm border border-outline-variant/60">
          <span className="material-symbols-outlined text-5xl text-danger mb-4 block">lock</span>
          <h3 className="font-extrabold text-xl text-on-surface mb-2">Access Denied</h3>
          <p className="text-sm text-on-surface-variant">Only Project Leaders and Members can view Project Settings.</p>
        </div>
      </main>
    )
  }

  const canEdit = isLeader

  return (
    <>
      <div className="min-h-full bg-background">
        {/* ── COVER HEADER ─────────────────────────────────────── */}
        <CoverHeader
          project={activeProject}
          cover={draftCover}
          theme={draftTheme}
          canEdit={canEdit}
          uploading={uploading}
          onFileClick={() => fileInputRef.current?.click()}
          onReset={() => { setDraftCover(activeProject?.coverImageUrl || DEFAULT_COVER); markDirty() }}
        />

        {/* ── TAB NAV ──────────────────────────────────────────── */}
        <div className="bg-white border-b border-outline-variant/60 px-6 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all mr-1"
                style={{
                  borderBottomColor: activeTab === tab.id ? draftTheme : 'transparent',
                  color: activeTab === tab.id ? draftTheme : '#6B7280',
                }}
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1", color: activeTab === tab.id ? draftTheme : '#9CA3AF' }}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB BODY ─────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {loading ? (
            <LoadingSkeleton />
          ) : activeTab === 'general' ? (
            <GeneralTab
              // form state
              draftName={draftName}          setDraftName={(v) => { setDraftName(v); markDirty() }}
              draftDescription={draftDescription} setDraftDescription={(v) => { setDraftDescription(v); markDirty() }}
              draftType={draftType}          setDraftType={(v) => { setDraftType(v); markDirty() }}
              draftStatus={draftStatus}      setDraftStatus={(v) => { setDraftStatus(v); markDirty() }}
              draftStartDate={draftStartDate} setDraftStartDate={(v) => { setDraftStartDate(v); markDirty() }}
              draftDeadline={draftDeadline}  setDraftDeadline={(v) => { setDraftDeadline(v); markDirty() }}
              draftMaxMembers={draftMaxMembers} setDraftMaxMembers={(v) => { setDraftMaxMembers(v); markDirty() }}
              // appearance
              initialCover={activeProject?.coverImageUrl || DEFAULT_COVER}
              draftCover={draftCover}        setDraftCover={(v) => { setDraftCover(v); markDirty() }}
              draftTheme={draftTheme}
              customHex={customHex}          hexError={hexError}
              onApplyTheme={applyTheme}      onHexInput={handleHexInput}
              // upload
              fileInputRef={fileInputRef}
              onFileClick={() => fileInputRef.current?.click()}
              onFileChange={handleCoverFileChange}
              uploading={uploading}
              // save
              canEdit={canEdit}
              saving={saving}
              onSave={handleSave}
              isDirty={isDirty}
            />
          ) : (
            // GitHub & Code Insight tab — reuse existing page component
            <div className="max-w-4xl">
              <ProjectGithubConfig />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// COVER HEADER
// ═══════════════════════════════════════════════════════════════
function CoverHeader({ project, cover, theme, canEdit, uploading, onFileClick, onReset }) {
  const typeBadge = project?.type || project?.major || 'PROJECT'
  const projectName = project?.title || 'Project Settings'

  return (
    <div className="relative mx-6 mt-6 rounded-2xl overflow-hidden" style={{ height: 170 }}>
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: theme,
          backgroundImage: cover ? `url(${cover})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-color 0.4s ease, background-image 0.4s ease',
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.10) 100%)' }} />

      {/* Content */}
      <div className="relative z-10 h-full flex items-end justify-between px-7 pb-6">
        <div>
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-white/80 bg-white/15 border border-white/20 px-2.5 py-0.5 rounded-full mb-2 backdrop-blur-sm">
            {typeBadge.replace('_', ' ')} · {project?.semester || '2026'}
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">{projectName}</h1>
          <p className="text-xs text-white/70 mt-0.5">Manage your project configuration and integrations</p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={onFileClick}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 backdrop-blur-sm transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">image</span>
              {uploading ? 'Uploading…' : 'Change Cover'}
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 bg-black/30 hover:bg-black/50 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 backdrop-blur-sm transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// GENERAL TAB
// ═══════════════════════════════════════════════════════════════
function GeneralTab({
  draftName, setDraftName, draftDescription, setDraftDescription,
  draftType, setDraftType, draftStatus, setDraftStatus,
  draftStartDate, setDraftStartDate,
  draftDeadline, setDraftDeadline, draftMaxMembers, setDraftMaxMembers,
  initialCover, draftCover, setDraftCover, draftTheme,
  customHex, hexError, onApplyTheme, onHexInput,
  fileInputRef, onFileClick, onFileChange, uploading,
  canEdit, saving, onSave, isDirty,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
      {/* ── LEFT ── */}
      <div className="space-y-5">
        <AppearanceCard
          initialCover={initialCover}
          draftCover={draftCover} setDraftCover={setDraftCover}
          draftTheme={draftTheme} customHex={customHex} hexError={hexError}
          onApplyTheme={onApplyTheme} onHexInput={onHexInput}
          fileInputRef={fileInputRef} onFileClick={onFileClick} onFileChange={onFileChange}
          uploading={uploading} canEdit={canEdit}
        />
        <BasicInfoCard
          draftName={draftName} setDraftName={setDraftName}
          draftDescription={draftDescription} setDraftDescription={setDraftDescription}
          draftType={draftType} setDraftType={setDraftType}
          draftStatus={draftStatus} setDraftStatus={setDraftStatus}
          draftStartDate={draftStartDate} setDraftStartDate={setDraftStartDate}
          draftDeadline={draftDeadline} setDraftDeadline={setDraftDeadline}
          draftMaxMembers={draftMaxMembers} setDraftMaxMembers={setDraftMaxMembers}
          canEdit={canEdit} saving={saving} onSave={onSave} isDirty={isDirty}
        />
      </div>

      {/* ── RIGHT ── */}
      <div className="space-y-5">
        <LivePreviewCard theme={draftTheme} cover={draftCover} projectName={draftName} />
        <UIPreviewCard theme={draftTheme} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// APPEARANCE CARD
// ═══════════════════════════════════════════════════════════════
function AppearanceCard({ initialCover, draftCover, setDraftCover, draftTheme, customHex, hexError, onApplyTheme, onHexInput, fileInputRef, onFileClick, onFileChange, uploading, canEdit }) {
  const hasInitialInPresets = PRESET_COVERS.some(p => p.url === initialCover) || !initialCover
  const thumbnails = hasInitialInPresets
    ? PRESET_COVERS
    : [{ id: 'initial', url: initialCover, label: 'Current' }, ...PRESET_COVERS]

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/60 p-6 shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#278A99,#1E707D)' }}>
          <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings:"'FILL' 1" }}>palette</span>
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-on-surface">Project Appearance</h2>
          <p className="text-[11px] text-on-surface-variant">Customize how your project looks across DevTrack.</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {/* Cover preview + thumbnails */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Project Cover</p>
          {/* Large preview */}
          <div className="relative rounded-xl overflow-hidden mb-3" style={{ height: 140, backgroundColor: draftTheme, transition: 'background-color 0.3s ease' }}>
            {draftCover && <img src={draftCover} alt="cover preview" className="w-full h-full object-cover" />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.3))' }} />
            {canEdit && (
              <button onClick={onFileClick} disabled={uploading}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">image</span>
                {uploading ? 'Uploading…' : 'Change Image'}
              </button>
            )}
          </div>

          {/* Thumbnails row */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {/* Solid color / No Image thumbnail */}
            <button
              onClick={() => canEdit && setDraftCover('')} disabled={!canEdit}
              className="relative shrink-0 rounded-lg overflow-hidden transition-all flex items-center justify-center"
              style={{ width: 64, height: 40, border: draftCover === '' ? `2.5px solid ${draftTheme}` : '2px solid transparent', backgroundColor: draftTheme }}
              title="Solid Color (No Image)"
            >
              {draftCover === '' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings:"'FILL' 1" }}>check_circle</span>
                </div>
              )}
            </button>
            {thumbnails.map((preset) => (
              <button key={preset.id} onClick={() => canEdit && setDraftCover(preset.url)} disabled={!canEdit}
                className="relative shrink-0 rounded-lg overflow-hidden transition-all"
                style={{ width: 64, height: 40, border: draftCover === preset.url ? `2.5px solid ${draftTheme}` : '2px solid transparent' }}
              >
                <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                {draftCover === preset.url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings:"'FILL' 1" }}>check_circle</span>
                  </div>
                )}
              </button>
            ))}
            {/* Upload button */}
            {canEdit && (
              <>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
                <button onClick={onFileClick}
                  className="shrink-0 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant/60 hover:border-primary hover:bg-surface-container-low text-on-surface-variant hover:text-primary transition-all"
                  style={{ width: 64, height: 40 }}
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span className="text-[9px] font-bold">Upload</span>
                </button>
              </>
            )}
          </div>        </div>

        {/* Theme color */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Theme Color</p>
          <p className="text-[11px] text-on-surface-variant mb-3">Used for buttons, highlights, active navigation, badges, and project UI accents.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_COLORS.map((c) => (
              <button key={c.id} onClick={() => canEdit && onApplyTheme(c.value)} disabled={!canEdit} title={c.label}
                className="relative flex items-center justify-center transition-all"
                style={{
                  width: draftTheme === c.value ? 34 : 28,
                  height: draftTheme === c.value ? 34 : 28,
                  borderRadius: '50%',
                  background: c.value,
                  border: draftTheme === c.value ? `3px solid ${c.value}` : '2px solid transparent',
                  boxShadow: draftTheme === c.value ? `0 0 0 2px #fff, 0 0 0 4px ${c.value}` : '0 1px 4px rgba(0,0,0,0.15)',
                }}
              >
                {draftTheme === c.value && <span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings:"'FILL' 1" }}>check</span>}
              </button>
            ))}
          </div>

          {/* Custom hex input */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-outline-variant/60 shrink-0 cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 transition-all">
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : '#E5E7EB'}
                onChange={(e) => onApplyTheme(e.target.value)}
                disabled={!canEdit}
                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0 disabled:cursor-not-allowed"
                title="Choose a custom color"
              />
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                value={customHex}
                onChange={(e) => onHexInput(e.target.value)}
                disabled={!canEdit}
                maxLength={7}
                placeholder="#0D9488"
                className={`w-full rounded-lg px-3 py-2 text-sm font-mono border ${hexError ? 'border-danger text-danger' : 'border-outline-variant'} bg-surface-container-low focus:outline-none focus:ring-1`}
                style={{ '--tw-ring-color': draftTheme }}
              />
              {hexError && <p className="absolute -bottom-4 left-0 text-[10px] text-danger font-medium">Use format #RRGGBB</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BASIC INFO CARD
// ═══════════════════════════════════════════════════════════════
function BasicInfoCard({ draftName, setDraftName, draftDescription, setDraftDescription, draftType, setDraftType, draftStatus, setDraftStatus, draftStartDate, setDraftStartDate, draftDeadline, setDraftDeadline, draftMaxMembers, setDraftMaxMembers, canEdit, saving, onSave, isDirty }) {
  const inputCls = 'w-full rounded-xl bg-surface-container-low border-none px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-[rgba(30,112,125,0.25)] disabled:opacity-50 disabled:cursor-not-allowed'
  const labelCls = 'text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5'

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/60 p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-outline-variant/40">
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#278A99,#1E707D)' }}>
          <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings:"'FILL' 1" }}>info</span>
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-on-surface">Basic Information</h2>
          <p className="text-[11px] text-on-surface-variant">Update your project details and preferences.</p>
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        {/* Name + Type + Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Project Name <span className="text-danger">*</span></label>
            <input type="text" value={draftName} onChange={(e) => setDraftName(e.target.value)} disabled={!canEdit} required className={inputCls} placeholder="My Project" />
          </div>
          <div>
            <label className={labelCls}>Project Type</label>
            <select value={draftType} onChange={(e) => setDraftType(e.target.value)} disabled={!canEdit} className={inputCls + ' cursor-pointer'}>
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Project Status</label>
            <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)} disabled={!canEdit} className={inputCls + ' cursor-pointer'}>
              <option value="PLANNING">Planning (Kế hoạch)</option>
              <option value="ACTIVE">Active (Hoạt động)</option>
              <option value="IN_REVIEW">In Review (Đánh giá)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} disabled={!canEdit} rows={3}
            className={inputCls + ' resize-none'} placeholder="Describe your project..." />
        </div>

        {/* Dates + Max Members */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Start Date</label>
            <input type="date" value={draftStartDate} onChange={(e) => setDraftStartDate(e.target.value)} disabled={!canEdit} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Deadline <span className="text-danger">*</span></label>
            <input type="date" value={draftDeadline} onChange={(e) => setDraftDeadline(e.target.value)} disabled={!canEdit} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Max Members</label>
            <input type="number" min={1} max={50} value={draftMaxMembers} onChange={(e) => setDraftMaxMembers(e.target.value)} disabled={!canEdit} className={inputCls} />
          </div>
        </div>

        {/* Save button */}
        {canEdit && (
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving || !isDirty}
              className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
              style={{ background: saving ? '#9CA3AF' : 'linear-gradient(180deg,#278A99 0%,#1E707D 55%,#165964 100%)', boxShadow: saving ? 'none' : '0 4px 12px rgba(30,112,125,0.25)' }}
            >
              {saving ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      : <span className="material-symbols-outlined text-[18px]">save</span>}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
        {!canEdit && (
          <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[15px]">visibility</span>
            View-only mode — only Project Leaders can edit settings.
          </p>
        )}
      </form>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LIVE PREVIEW CARD
// ═══════════════════════════════════════════════════════════════
function LivePreviewCard({ theme, cover, projectName }) {
  const initial = (projectName || 'P').charAt(0).toUpperCase()
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[18px]" style={{ color: theme, fontVariationSettings:"'FILL' 1" }}>visibility</span>
        <div>
          <h3 className="text-[13px] font-bold text-on-surface">Live Preview</h3>
          <p className="text-[10px] text-on-surface-variant">See how your project theme will look.</p>
        </div>
      </div>

      {/* Mini app mockup */}
      <div className="rounded-xl border border-outline-variant/50 overflow-hidden bg-[#F1F5F9]" style={{ fontSize: '0' }}>
        {/* Mini top bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-outline-variant/40">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-black" style={{ background: theme }}>{initial}</div>
          <div className="flex gap-1.5">
            <div className="h-1.5 w-12 rounded-full bg-gray-200" />
            <div className="h-1.5 w-8 rounded-full bg-gray-200" />
          </div>
          <div className="ml-auto flex gap-1">
            <div className="w-4 h-4 rounded-full bg-gray-100" />
            <div className="w-4 h-4 rounded-full bg-gray-100" />
          </div>
        </div>

        <div className="flex">
          {/* Mini sidebar */}
          <div className="w-16 bg-white border-r border-outline-variant/30 py-2 px-1.5 space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-5 rounded-md flex items-center px-1 gap-1" style={{ background: i === 0 ? theme + '22' : 'transparent' }}>
                <div className="w-3 h-3 rounded-sm" style={{ background: i === 0 ? theme : '#E5E7EB' }} />
                <div className="h-1 flex-1 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>

          {/* Mini content */}
          <div className="flex-1 p-2 space-y-2">
            {/* Cover mini */}
            <div className="rounded-lg overflow-hidden relative" style={{ height: 36 }}>
              <img src={cover} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right,rgba(0,0,0,0.5),transparent)' }} />
              <span className="absolute left-2 bottom-1.5 text-white text-[8px] font-bold">{projectName || 'My Project'}</span>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-1">
              {[{ icon: 'assignment', n: 12 }, { icon: 'bug_report', n: 3 }, { icon: 'task_alt', n: 8 }].map((s, i) => (
                <div key={i} className="bg-white rounded-md p-1.5 border border-outline-variant/40">
                  <div className="w-3 h-3 rounded-sm mb-1" style={{ background: theme + '22' }}>
                    <span className="material-symbols-outlined text-[9px] block text-center leading-3" style={{ color: theme }}>{s.icon}</span>
                  </div>
                  <div className="text-[9px] font-black text-on-surface">{s.n}</div>
                </div>
              ))}
            </div>
            {/* Buttons */}
            <div className="flex gap-1">
              <div className="flex-1 h-5 rounded-md text-white text-[8px] font-bold flex items-center justify-center" style={{ background: theme }}>Primary</div>
              <div className="flex-1 h-5 rounded-md text-[8px] font-bold flex items-center justify-center border" style={{ color: theme, borderColor: theme + '55' }}>Secondary</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// UI PREVIEW CARD
// ═══════════════════════════════════════════════════════════════
function UIPreviewCard({ theme }) {
  const [checked, setChecked] = useState(true)
  const [toggled, setToggled] = useState(true)
  const [radio,   setRadio]   = useState('a')
  const progress = 72

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[18px]" style={{ color: theme, fontVariationSettings:"'FILL' 1" }}>dashboard_customize</span>
        <div>
          <h3 className="text-[13px] font-bold text-on-surface">UI Preview</h3>
          <p className="text-[10px] text-on-surface-variant">Preview of UI components with your theme.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Buttons row */}
        <div className="flex flex-wrap gap-2">
          <button className="text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all" style={{ background: theme, boxShadow: `0 3px 10px ${theme}44` }}>Primary</button>
          <button className="text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all" style={{ color: theme, borderColor: theme + '66', background: theme + '11' }}>Secondary</button>
          <button className="text-xs font-semibold px-3.5 py-1.5 rounded-lg text-on-surface-variant bg-surface-container-low border border-outline-variant/60 hover:bg-surface-container transition-all">Tertiary</button>
        </div>

        {/* Badge, Tag, Status */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: theme }}>Badge</span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border" style={{ color: theme, borderColor: theme + '55', background: theme + '11' }}>Tag ×</span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-500/10 text-green-600">Status Active</span>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-on-surface-variant font-medium">Progress</span>
            <span className="text-[10px] font-bold" style={{ color: theme }}>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container">
            <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, background: theme }} />
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-2">
          <button onClick={() => setChecked(c => !c)}
            className="w-4 h-4 rounded flex items-center justify-center border transition-all"
            style={{ background: checked ? theme : 'transparent', borderColor: checked ? theme : '#D1D5DB' }}
          >
            {checked && <span className="material-symbols-outlined text-white text-[10px]" style={{ fontVariationSettings:"'FILL' 1" }}>check</span>}
          </button>
          <span className="text-xs text-on-surface">Checkbox</span>
        </div>

        {/* Radio */}
        <div className="flex items-center gap-4">
          {['a', 'b'].map((v, i) => (
            <button key={v} onClick={() => setRadio(v)} className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all" style={{ borderColor: radio === v ? theme : '#D1D5DB' }}>
                {radio === v && <div className="w-2 h-2 rounded-full" style={{ background: theme }} />}
              </div>
              <span className="text-xs text-on-surface">Radio option</span>
            </button>
          ))}
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-2">
          <button onClick={() => setToggled(t => !t)}
            className="relative w-9 h-5 rounded-full transition-all"
            style={{ background: toggled ? theme : '#D1D5DB' }}
          >
            <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: toggled ? '18px' : '2px' }} />
          </button>
          <span className="text-xs text-on-surface">{toggled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 animate-pulse">
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-outline-variant/40 p-6 h-64" />
        <div className="bg-white rounded-2xl border border-outline-variant/40 p-6 h-72" />
      </div>
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-outline-variant/40 p-5 h-52" />
        <div className="bg-white rounded-2xl border border-outline-variant/40 p-5 h-64" />
      </div>
    </div>
  )
}
