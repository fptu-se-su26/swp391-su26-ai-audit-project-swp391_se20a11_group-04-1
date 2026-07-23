export default function SprintReportHeader({
  activeProject,
  canExport,
  onPreviewReport,
}) {
  return (
    <header className="flex flex-col gap-3 rounded-xl border border-[#D9E7E4] bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#278A99]">
          {activeProject.title || activeProject.name}
        </p>
        <h1 className="mt-0.5 flex items-center gap-2 text-2xl font-black leading-tight text-on-surface">
          <span className="material-symbols-outlined text-[24px] text-[#1E707D]">monitoring</span>
          Sprint Reports
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPreviewReport}
          disabled={!canExport}
          title={canExport ? 'Preview report before exporting' : 'Select a sprint and ensure data is loaded'}
          className="flex h-9 items-center gap-2 rounded-lg border border-[#D9E7E4] bg-white px-3 text-sm font-semibold text-[#165964] hover:bg-[#F0F9FA] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">preview</span>
          Preview Report
        </button>
      </div>
    </header>
  )
}
