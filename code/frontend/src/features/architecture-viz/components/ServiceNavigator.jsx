import React from 'react'
import { Server, Database, MessageSquare, Terminal, Cpu, Play, Search, ArrowRight } from 'lucide-react'
import { useArchitectureStore } from '../store/architectureStore'

const SERVICE_ICONS = {
  client: Server,
  service: Server,
  database: Database,
  cache: Cpu,
  broker: MessageSquare,
  parser: Terminal,
  worker: Play
}

export const ServiceNavigator = ({ services = [], onFocusNode }) => {
  const { activeView, activeServiceId, navigateToService, navigateToSystem } = useArchitectureStore()
  
  const handleServiceClick = (svc) => {
    if (activeView === 'SYSTEM') {
      onFocusNode(`service:${svc.id}`)
    } else {
      navigateToService(svc.id, svc.name)
    }
  }

  const handleDoubleServiceClick = (svc) => {
    if (activeView === 'SYSTEM') {
      navigateToService(svc.id, svc.name)
    }
  }

  return (
    <div className="w-[280px] bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-2.5">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <span>Dịch Vụ Hệ Thống</span>
          {activeView === 'INTERNAL' && (
            <button 
              onClick={navigateToSystem}
              className="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition"
            >
              Xem Tổng Quan
            </button>
          )}
        </h3>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
          {activeView === 'SYSTEM' 
            ? 'Click để định vị service trên canvas. Double-click để khám phá mã nguồn bên trong.'
            : 'Click để chuyển đổi nhanh giữa các service trong hệ thống.'
          }
        </p>
      </div>

      {/* Services List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
        {services.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Không tìm thấy dịch vụ nào.
          </div>
        ) : (
          services.map((svc) => {
            const Icon = SERVICE_ICONS[svc.type] || Server
            const isActive = activeView === 'INTERNAL' && activeServiceId === svc.id

            return (
              <div
                key={svc.id}
                onClick={() => handleServiceClick(svc)}
                onDoubleClick={() => handleDoubleServiceClick(svc)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition select-none group
                  ${isActive 
                    ? 'border-blue-500 bg-blue-50/15 dark:bg-blue-950/20' 
                    : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                    ${isActive 
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <span className={`font-semibold text-xs truncate
                      ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {svc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      {svc.tech || 'Docker Container'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  {svc.port && !isActive && (
                    <span className="text-[9px] font-mono px-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-250/20 dark:border-slate-700/35">
                      {svc.port}
                    </span>
                  )}
                  {activeView === 'SYSTEM' && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-350 opacity-0 group-hover:opacity-100 transition translate-x-1 group-hover:translate-x-0" />
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ServiceNavigator
