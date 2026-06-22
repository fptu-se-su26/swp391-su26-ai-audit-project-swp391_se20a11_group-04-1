import React from 'react'
import { Home, ChevronRight } from 'lucide-react'
import { useArchitectureStore } from '../store/architectureStore'

export default function BreadcrumbNav() {
  const { breadcrumbs, popBreadcrumb } = useArchitectureStore()

  return (
    <nav className="flex items-center gap-1.5 text-[11px] font-semibold py-1.5 px-3 bg-slate-100/70 dark:bg-slate-800/40 text-slate-500 rounded-lg border border-slate-200/40 dark:border-slate-700/30 select-none">
      {breadcrumbs.map((bc, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
          <button
            onClick={() => popBreadcrumb(idx)}
            disabled={idx === breadcrumbs.length - 1}
            className={`flex items-center gap-1 hover:underline focus:outline-none transition-colors ${
              idx === breadcrumbs.length - 1 
                ? 'text-blue-600 dark:text-blue-400 font-bold cursor-default hover:no-underline' 
                : 'text-slate-600 dark:text-slate-350 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            {idx === 0 && <Home className="w-3.5 h-3.5 shrink-0" />}
            <span>{bc.label}</span>
          </button>
        </React.Fragment>
      ))}
    </nav>
  )
}
