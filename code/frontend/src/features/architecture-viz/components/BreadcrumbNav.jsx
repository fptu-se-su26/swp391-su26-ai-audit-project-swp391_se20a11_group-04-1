import React from 'react'
import { useArchitectureStore } from '../store/architectureStore'

export default function BreadcrumbNav() {
  const { breadcrumbs, popBreadcrumb } = useArchitectureStore()

  return (
    <nav className="flex items-center space-x-2 text-sm text-on-surface-variant font-medium py-2 px-4 bg-surface-container-low rounded-lg border border-outline-variant/30">
      {breadcrumbs.map((bc, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="text-outline-variant">/</span>}
          <button
            onClick={() => popBreadcrumb(idx)}
            disabled={idx === breadcrumbs.length - 1}
            className={`hover:underline focus:outline-none transition-colors ${
              idx === breadcrumbs.length - 1 
                ? 'text-primary font-bold cursor-default' 
                : 'text-on-surface hover:text-primary'
            }`}
          >
            {bc.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  )
}
