export default function SprintReportHeader({
  activeProject,
  onRefresh,
  onExportPdf,
  isExporting,
  canExport,
  onTestDigest,
  isTestingDigest,
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-outline-variant/60 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {activeProject.title || activeProject.name}
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-on-surface">
          <span className="material-symbols-outlined text-primary">monitoring</span>
          Sprint Reports
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Refresh
        </button>
        <button
          type="button"
          onClick={onTestDigest}
          disabled={isTestingDigest}
          title="Chạy thử hệ thống nhắc nhở gửi mail (Chỉ dùng cho test)"
          className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">schedule_send</span>
          {isTestingDigest ? 'Đang chạy...' : 'Chạy thử hệ thống nhắc nhở'}
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          disabled={isExporting || !canExport}
          title={canExport ? 'Export report to PDF' : 'Select a sprint and ensure data is loaded'}
          className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>
    </header>
  )
}
