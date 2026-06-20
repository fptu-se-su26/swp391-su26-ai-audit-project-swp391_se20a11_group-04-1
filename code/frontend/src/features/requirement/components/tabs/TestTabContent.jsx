import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
const TestTabContent = ({ tests, requirement, onOpenTestCaseModal }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  if (!tests || tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[24px]">science</span>
        </div>
        <p className="text-slate-600 text-sm mb-4">No test cases created for this requirement yet</p>
        <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm" onClick={onOpenTestCaseModal || (() => console.log('Generate Test Cases clicked'))}>
          Generate Test Cases
        </button>
      </div>
    );
  }

  const getStatusDisplay = (status) => {
    const s = status?.toUpperCase() || 'UNTESTED';
    if (s === 'PASS' || s === 'PASSED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase text-emerald-700 bg-emerald-50 border border-emerald-200/50">
          <span className="text-[8px]">🟢</span> PASSED
        </span>
      );
    }
    if (s === 'FAIL' || s === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase text-rose-700 bg-rose-50 border border-rose-200/50">
          <span className="text-[8px]">🔴</span> FAILED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase text-slate-600 bg-slate-100 border border-slate-200/50">
        <span className="text-[8px]">⚪</span> UNTESTED
      </span>
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full">
      {/* List Header */}
      <div className="grid grid-cols-[100px_1fr_150px_130px_100px] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/30 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div>ID</div>
        <div>Test Case Name</div>
        <div>Tester</div>
        <div>Status</div>
        <div className="text-right">Action</div>
      </div>

      {/* List Body */}
      <div className="flex flex-col">
        {tests.map((test, index) => {
          const code = test.code || `TC-${String(test.id).padStart(3, '0')}`;
          
          return (
            <div 
              key={test.id} 
              onClick={() => navigate(`/projects/${projectId}/test-cases/${test.id}`)}
              className={`grid grid-cols-[100px_1fr_150px_130px_100px] gap-4 px-6 py-3 items-center hover:bg-indigo-50/40 transition-colors cursor-pointer bg-white ${index !== tests.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="text-sm font-medium text-slate-500">{code}</div>
              
              <div className="text-sm font-medium text-slate-800 truncate pr-4" title={test.title}>{test.title}</div>
              
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 shrink-0 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold" title={test.createdBy?.name || test.lastExecutedBy || 'System'}>
                  {getInitials(test.createdBy?.name || test.lastExecutedBy || 'S')}
                </div>
                <span className="text-sm text-slate-600 truncate" title={test.createdBy?.name || test.lastExecutedBy || 'Unassigned'}>
                  {test.createdBy?.name || test.lastExecutedBy || 'Unassigned'}
                </span>
              </div>
              
              <div className="flex items-center">
                {getStatusDisplay(test.status)}
              </div>
              
              <div className="text-right flex items-center justify-end">
                <button 
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${projectId}/test-cases/${test.id}`);
                  }}
                >
                  <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                  Run
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TestTabContent;
